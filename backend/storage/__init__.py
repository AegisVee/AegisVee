"""
AegisVee v2.0 Storage Layer

Provides:
- GenericEntityStore: Universal JSON-file CRUD for any ASPICE entity type
- Project management (load/save/add/delete projects)
- Traceability graph queries
- Data migration (v1 → v2)

Backward-compatible: All v1 storage functions are re-exported.
"""

from .base import GenericEntityStore
from .project_store import (
    load_projects,
    save_projects,
    add_project,
    delete_project,
    get_project_dir,
    update_project_metrics,
    calculate_project_analytics,
    PROJECTS_FILE,
    PROJECTS_DIR,
)
from .traceability_store import TraceabilityStore
from .migration import (
    migrate_project_to_v2,
    migrate_all_projects,
    run_legacy_migration,
)


# ============================================================
# Backward-compatible wrapper functions
# These match the original storage.py API so existing routers
# continue to work without modification.
# ============================================================

def load_project_requirements(project_id):
    """Load requirements for a project (v1-compatible)."""
    store = GenericEntityStore(project_id, "requirements")
    return store.load_all()


def save_project_requirements(project_id, requirements):
    """Save requirements for a project (v1-compatible)."""
    store = GenericEntityStore(project_id, "requirements")
    return store.save_all(requirements)


def load_project_test_scripts(project_id):
    """Load test scripts / verification measures for a project (v1-compatible).
    Tries verification_measures.json first, falls back to test_scripts.json.
    """
    vm_store = GenericEntityStore(project_id, "verification_measures")
    data = vm_store.load_all()
    if data:
        return data
    # Fallback to legacy test_scripts.json
    import os, json
    legacy_path = os.path.join("data", "projects", str(project_id), "test_scripts.json")
    if os.path.exists(legacy_path):
        with open(legacy_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return []


def save_project_test_scripts(project_id, test_scripts):
    """Save test scripts for a project (v1-compatible).
    Writes to both verification_measures.json and test_scripts.json for compat.
    """
    vm_store = GenericEntityStore(project_id, "verification_measures")
    vm_store.save_all(test_scripts)
    # Also save to legacy path for backward compatibility
    import os, json
    legacy_path = os.path.join("data", "projects", str(project_id), "test_scripts.json")
    os.makedirs(os.path.dirname(legacy_path), exist_ok=True)
    with open(legacy_path, "w", encoding="utf-8") as f:
        json.dump(test_scripts, f, indent=4, ensure_ascii=False)


def add_requirement(req_data, project_id):
    """Add a new requirement to a project (v1-compatible)."""
    store = GenericEntityStore(project_id, "requirements")
    requirements = store.load_all()

    # Generate new ID
    existing_ids = []
    for r in requirements:
        parts = r["id"].split("-")
        if len(parts) == 2 and parts[1].isdigit():
            existing_ids.append(int(parts[1]))
    next_num = max(existing_ids) + 1 if existing_ids else 1
    new_id = f"REQ-{next_num}"

    new_req = {
        "key": str(len(requirements) + 1),
        "id": new_id,
        "description": req_data.get("description", "New Requirement"),
        "title": req_data.get("title", req_data.get("description", "New Requirement")[:50]),
        "status": req_data.get("status", "Draft"),
        "testSteps": req_data.get("testSteps", ""),
        "expectedResult": req_data.get("expectedResult", ""),
        "linkedApis": req_data.get("linkedApis", []),
        "parameters": req_data.get("parameters", []),
        "linkedTestIds": req_data.get("linkedTestIds", []),
        # v2 fields
        "wp_id": "17-00",
        "test_steps": req_data.get("testSteps", ""),
        "expected_result": req_data.get("expectedResult", ""),
        "linked_apis": req_data.get("linkedApis", []),
        "linked_test_ids": req_data.get("linkedTestIds", []),
        "req_type": "functional",
        "level": "system",
        "priority": "medium",
        "functional_group": "",
        "variant": "",
        "release": "",
    }

    requirements.append(new_req)
    store.save_all(requirements)
    return new_req


def add_test_script(script_data, project_id):
    """Add a test script / verification measure (v1-compatible)."""
    store = GenericEntityStore(project_id, "verification_measures")
    scripts = store.load_all()

    # Also check legacy test_scripts
    if not scripts:
        scripts = load_project_test_scripts(project_id)

    existing_ids = [
        int(s["id"].split("-")[1])
        for s in scripts
        if s.get("id", "").startswith("TEST-") and s["id"].split("-")[1].isdigit()
    ]
    next_num = max(existing_ids) + 1 if existing_ids else 1
    new_id = f"TEST-{next_num:03d}"

    new_script = {
        "id": new_id,
        "requirement_id": script_data.get("requirement_id", ""),
        "type": script_data.get("type", "manual"),
        "title": script_data.get("title", "New Test Script"),
        "content": script_data.get("content", ""),
        "parameters_snapshot": script_data.get("parameters_snapshot", {}),
        # v2 fields
        "wp_id": "08-60",
        "technique": "test",
        "script_type": script_data.get("type", "manual"),
        "measure_type": "system",
    }
    scripts.append(new_script)
    save_project_test_scripts(project_id, scripts)

    # Link test to its parent requirement
    req_store = GenericEntityStore(project_id, "requirements")
    requirements = req_store.load_all()
    for req in requirements:
        if req["id"] == new_script["requirement_id"]:
            linked = req.get("linkedTestIds", req.get("linked_test_ids", []))
            if new_id not in linked:
                linked.append(new_id)
            req["linkedTestIds"] = linked
            req["linked_test_ids"] = linked
            break
    req_store.save_all(requirements)

    return new_script


def update_test_script(script_id, updates, project_id):
    """Update a test script by ID (v1-compatible)."""
    scripts = load_project_test_scripts(project_id)
    for i, s in enumerate(scripts):
        if s["id"] == script_id:
            scripts[i] = {**s, **updates, "id": script_id}
            save_project_test_scripts(project_id, scripts)
            return scripts[i]
    return None


def delete_test_script(script_id, project_id):
    """Delete a test script by ID (v1-compatible)."""
    scripts = load_project_test_scripts(project_id)
    original_len = len(scripts)
    scripts = [s for s in scripts if s["id"] != script_id]
    if len(scripts) < original_len:
        save_project_test_scripts(project_id, scripts)
        # Remove link from parent requirement
        req_store = GenericEntityStore(project_id, "requirements")
        requirements = req_store.load_all()
        for req in requirements:
            for field in ["linkedTestIds", "linked_test_ids"]:
                if script_id in req.get(field, []):
                    req[field] = [t for t in req[field] if t != script_id]
        req_store.save_all(requirements)
        return True
    return False


def load_data(filename, default):
    """Generic file load (v1-compatible)."""
    import os, json
    if not os.path.exists(filename):
        return list(default) if isinstance(default, list) else default
    with open(filename, "r", encoding="utf-8") as f:
        return json.load(f)


def save_data(filename, data):
    """Generic file save (v1-compatible)."""
    import os, json
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4, ensure_ascii=False)
    return True


def init_storage():
    """Initialize storage and run all migrations."""
    import os
    os.makedirs("data", exist_ok=True)

    if not os.path.exists(PROJECTS_FILE):
        save_data(PROJECTS_FILE, load_projects())

    # Run v0→v1 migration (global → per-project)
    run_legacy_migration()

    # Run v1→v2 migration (simple → ASPICE format)
    migrate_all_projects()
