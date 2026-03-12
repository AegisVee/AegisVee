"""
Propagation Engine
------------------
When a requirement's signal parameters change, this module propagates
the new values into all linked test artifacts:
  - requirement description / testSteps / expectedResult (template fields)
  - linked HIL/manual/ai_generated test scripts
  - updates parameters_snapshot on each script
"""

import re
from typing import List, Dict, Any


def render_template(template: str, params: Dict[str, str]) -> str:
    """Replace {{param_name}} placeholders with their current values."""
    result = template
    for key, value in params.items():
        result = result.replace(f"{{{{{key}}}}}", value)
    return result


def _params_to_dict(parameters: List[Dict[str, Any]]) -> Dict[str, str]:
    """Convert list of SignalParameter dicts to a flat {name: value} map."""
    return {p["name"]: p["value"] for p in parameters if "name" in p and "value" in p}


def propagate_change(
    req_id: str,
    new_param_list: List[Dict[str, Any]],
    requirements: List[Dict[str, Any]],
    test_scripts: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Apply updated parameters to a requirement and all its linked test scripts.

    Parameters
    ----------
    req_id        : ID of the requirement whose parameters changed
    new_param_list: The new parameters list (list of SignalParameter dicts)
    requirements  : Full requirements list (from storage)
    test_scripts  : Full test scripts list (from storage)

    Returns
    -------
    {
        "updated_requirements": [<modified req dict>, ...],
        "updated_test_scripts": [<modified script dict>, ...],
        "summary": "human-readable change summary"
    }
    """
    new_params = _params_to_dict(new_param_list)
    updated_reqs: List[Dict[str, Any]] = []
    updated_scripts: List[Dict[str, Any]] = []

    # --- Update the requirement's own text fields ---
    for req in requirements:
        if req["id"] != req_id:
            continue

        changed_fields = []
        for field in ("description", "testSteps", "expectedResult"):
            original = req.get(field, "")
            rendered = render_template(original, new_params)
            if rendered != original:
                req[field] = rendered
                changed_fields.append(field)

        # Always update the stored parameters list
        req["parameters"] = new_param_list

        updated_reqs.append(req)
        break

    # --- Find the linked test IDs from the (possibly just updated) requirement ---
    req_obj = next((r for r in requirements if r["id"] == req_id), None)
    linked_ids = req_obj.get("linkedTestIds", []) if req_obj else []

    # --- Update each linked test script ---
    for script in test_scripts:
        if script["id"] not in linked_ids:
            continue

        original_content = script.get("content", "")
        rendered_content = render_template(original_content, new_params)

        if rendered_content != original_content or script.get("parameters_snapshot") != new_params:
            script["content"] = rendered_content
            script["parameters_snapshot"] = new_params
            updated_scripts.append(script)

    # --- Build summary ---
    param_lines = [f"  {p['name']}: {p['type']} = {p['value']} {p.get('unit','')}" for p in new_param_list]
    summary_lines = [
        f"Propagated {len(new_param_list)} parameter(s) from {req_id}:",
        *param_lines,
        f"→ Updated {len(updated_reqs)} requirement field(s)",
        f"→ Updated {len(updated_scripts)} test script(s): {[s['id'] for s in updated_scripts]}"
    ]

    return {
        "updated_requirements": updated_reqs,
        "updated_test_scripts": updated_scripts,
        "summary": "\n".join(summary_lines)
    }
