"""
Project Store — Project-level CRUD and directory management.
Preserves all v1 project management logic from the original storage.py.
"""

import json
import os
import shutil
from typing import List, Dict, Any, Optional

PROJECTS_FILE = "data/projects.json"
PROJECTS_DIR = "data/projects"

DEFAULT_PROJECTS = [
    {
        "id": 1,
        "title": "Braking System (ABS)",
        "status": "success",
        "statusText": "Ready for Release",
        "metrics": [
            {"label": "Traceability", "value": "0%"}
        ]
    },
    {
        "id": 2,
        "title": "Lane Keep Assist (LKA)",
        "status": "warning",
        "statusText": "Review Needed",
        "metrics": [
            {"label": "Traceability", "value": "0%"}
        ]
    },
    {
        "id": 3,
        "title": "Adaptive Cruise (ACC)",
        "status": "error",
        "statusText": "Critical Failures",
        "metrics": [
            {"label": "Traceability", "value": "0%"}
        ]
    }
]


def _ensure_dir(path):
    if not os.path.exists(path):
        os.makedirs(path)


def _load_json(filename, default):
    if not os.path.exists(filename):
        return list(default) if isinstance(default, list) else default
    with open(filename, "r", encoding="utf-8") as f:
        return json.load(f)


def _save_json(filename, data):
    _ensure_dir(os.path.dirname(filename))
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4, ensure_ascii=False)
    return True


# ============================================================
# Project directory helpers
# ============================================================

def get_project_dir(project_id) -> str:
    """Return (and ensure exists) `data/projects/{project_id}/`."""
    d = os.path.join(PROJECTS_DIR, str(project_id))
    _ensure_dir(d)
    return d


# ============================================================
# Projects CRUD
# ============================================================

def load_projects() -> List[Dict[str, Any]]:
    _ensure_dir("data")
    return _load_json(PROJECTS_FILE, DEFAULT_PROJECTS)


def save_projects(projects: List[Dict[str, Any]]) -> bool:
    return _save_json(PROJECTS_FILE, projects)


def add_project(project_data: Dict[str, Any]) -> Dict[str, Any]:
    projects = load_projects()
    new_id = max([p.get("id", 0) for p in projects]) + 1 if projects else 1

    template = project_data.get("template")

    new_project = {
        "id": new_id,
        "title": project_data.get("title", "New Project"),
        "status": "warning",
        "statusText": "Initializing",
        "metrics": [
            {"label": "Traceability", "value": "0%"}
        ]
    }

    projects.append(new_project)
    save_projects(projects)

    # Create the project directory
    get_project_dir(new_id)

    # Initialize with template or empty data
    req_path = os.path.join(get_project_dir(new_id), "requirements.json")
    if template:
        template_path = os.path.join("templates", template, "requirements.json")
        if os.path.exists(template_path):
            shutil.copy2(template_path, req_path)
        else:
            _save_json(req_path, [])
    else:
        _save_json(req_path, [])

    # Initialize empty entity files for new ASPICE work products
    for entity_file in [
        "requirement_attributes.json",
        "architecture_elements.json",
        "special_characteristics.json",
        "verification_measures.json",
        "verification_selection_sets.json",
        "integration_instructions.json",
        "integrated_systems.json",
        "verification_data.json",
        "verification_results.json",
        "analysis_results.json",
        "consistency_evidence.json",
        "communication_evidence.json",
        "traceability_links.json",
    ]:
        path = os.path.join(get_project_dir(new_id), entity_file)
        if not os.path.exists(path):
            _save_json(path, [])

    return new_project


def delete_project(project_id) -> bool:
    projects = load_projects()
    initial_count = len(projects)
    projects = [p for p in projects if str(p["id"]) != str(project_id)]

    if len(projects) < initial_count:
        save_projects(projects)
        proj_dir = os.path.join(PROJECTS_DIR, str(project_id))
        if os.path.exists(proj_dir):
            shutil.rmtree(proj_dir)
        return True
    return False


# ============================================================
# Project Metrics & Analytics
# ============================================================

def update_project_metrics(project_id) -> Optional[Dict[str, Any]]:
    """Recalculate metrics from the project's requirements and traceability data."""
    from .base import GenericEntityStore

    projects = load_projects()
    project = next((p for p in projects if str(p["id"]) == str(project_id)), None)
    if not project:
        return None

    req_store = GenericEntityStore(project_id, "requirements")
    requirements = req_store.load_all()
    link_store = GenericEntityStore(project_id, "traceability_links")
    links = link_store.load_all()

    total_reqs = len(requirements)
    if total_reqs == 0:
        project["metrics"] = [{"label": "Traceability", "value": "0%"}]
    else:
        # Count requirements that have at least one traceability link
        req_ids_with_links = set()
        for link in links:
            if link.get("source_type") == "requirement":
                req_ids_with_links.add(link["source_id"])
            if link.get("target_type") == "requirement":
                req_ids_with_links.add(link["target_id"])

        # Also count legacy linkedTestIds
        for r in requirements:
            if r.get("linkedTestIds") or r.get("linked_test_ids"):
                ids = r.get("linkedTestIds", []) or r.get("linked_test_ids", [])
                if ids:
                    req_ids_with_links.add(r["id"])

        traced_count = len(req_ids_with_links.intersection(r["id"] for r in requirements))
        traceability_percent = int((traced_count / total_reqs) * 100)

        if traceability_percent == 100:
            status, status_text = "success", "Ready"
        elif traceability_percent >= 50:
            status, status_text = "warning", "Review Needed"
        else:
            status, status_text = "error", "Critical"

        project["status"] = status
        project["statusText"] = status_text
        project["metrics"] = [
            {"label": "Traceability", "value": f"{traceability_percent}%"}
        ]

    save_projects(projects)
    return project


def calculate_project_analytics(project_id) -> Optional[Dict[str, Any]]:
    from .base import GenericEntityStore

    projects = load_projects()
    project = next((p for p in projects if str(p["id"]) == str(project_id)), None)
    if not project:
        return None

    req_store = GenericEntityStore(project_id, "requirements")
    requirements = req_store.load_all()
    vm_store = GenericEntityStore(project_id, "verification_measures")
    verification_measures = vm_store.load_all()
    vr_store = GenericEntityStore(project_id, "verification_results")
    verification_results = vr_store.load_all()

    # Test/verification stats
    total_measures = len(verification_measures)
    passed_results = len([r for r in verification_results if r.get("result") == "pass"])
    failed_results = len([r for r in verification_results if r.get("result") == "fail"])

    # Requirement stats
    req_total = len(requirements)
    verified_count = len([r for r in requirements if r.get("status") == "Verified"])
    open_issues = req_total - verified_count

    grade = "A" if open_issues == 0 else ("B" if open_issues <= 5 else "C")
    complexity = round(1.0 + (0.1 * req_total), 1)

    return {
        "qualityGate": {
            "testCases": total_measures,
            "passed": passed_results,
            "failed": failed_results
        },
        "codeAnalysis": {
            "complexity": complexity,
            "duplication": "0%",
            "grade": grade
        },
        "requirements": {
            "total": req_total,
            "verified": verified_count,
            "percent": int((verified_count / req_total * 100) if req_total > 0 else 0)
        }
    }
