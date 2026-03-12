"""
Data Migration: v1 → v2

Converts existing v1 data (simple Requirement + TestScript) to
v2 ASPICE work product format (RequirementNode + VerificationMeasure + TraceabilityLink).

Migration steps:
1. Detect .migrated_v2 flag — skip if already done
2. Convert requirements.json → new RequirementNode format
3. Convert test_scripts.json → VerificationMeasure format
4. Generate TraceabilityLink records from linkedTestIds
5. Backup original data to _backup_v1/
6. Write .migrated_v2 flag
"""

import json
import os
import shutil
from typing import List, Dict, Any
from datetime import datetime
from .base import GenericEntityStore, _ensure_dir

PROJECTS_DIR = "data/projects"
MIGRATION_V2_FLAG = ".migrated_v2"

# Legacy paths (global, used only for v0→v1 migration)
LEGACY_REQUIREMENTS_FILE = "data/requirements.json"
LEGACY_TEST_SCRIPTS_FILE = "data/test_scripts.json"


def _migration_flag_path(project_id: str) -> str:
    return os.path.join(PROJECTS_DIR, str(project_id), MIGRATION_V2_FLAG)


def _is_migrated(project_id: str) -> bool:
    return os.path.exists(_migration_flag_path(project_id))


def _write_migration_flag(project_id: str):
    flag_path = _migration_flag_path(project_id)
    _ensure_dir(flag_path)
    with open(flag_path, "w") as f:
        f.write(f"migrated_at={datetime.now().isoformat()}")


def _convert_requirement_to_v2(req: Dict[str, Any]) -> Dict[str, Any]:
    """Convert a v1 requirement dict to v2 RequirementNode format."""
    now = datetime.now().isoformat()
    return {
        "id": req.get("id", ""),
        "wp_id": "17-00",
        "title": req.get("title", req.get("description", "")[:80]),
        "description": req.get("description", ""),
        "req_type": "functional",
        "level": "system",
        "status": req.get("status", "Draft"),
        "priority": "medium",
        "functional_group": "",
        "variant": "",
        "release": "",
        "verification_method": None,
        "test_steps": req.get("testSteps", req.get("test_steps", "")),
        "expected_result": req.get("expectedResult", req.get("expected_result", "")),
        "parameters": req.get("parameters", []),
        # Preserve legacy fields
        "key": req.get("key", ""),
        "linked_apis": req.get("linkedApis", req.get("linked_apis", [])),
        "linked_test_ids": req.get("linkedTestIds", req.get("linked_test_ids", [])),
        # v1 compat aliases (for frontend that still reads camelCase)
        "testSteps": req.get("testSteps", req.get("test_steps", "")),
        "expectedResult": req.get("expectedResult", req.get("expected_result", "")),
        "linkedApis": req.get("linkedApis", req.get("linked_apis", [])),
        "linkedTestIds": req.get("linkedTestIds", req.get("linked_test_ids", [])),
        # Timestamps
        "created_at": req.get("created_at", now),
        "updated_at": now,
        "version": 1,
        "created_by": "",
    }


def _convert_test_script_to_verification_measure(script: Dict[str, Any]) -> Dict[str, Any]:
    """Convert a v1 StoredTestScript to v2 VerificationMeasure."""
    now = datetime.now().isoformat()
    script_type = script.get("type", "manual")
    technique = "test"  # All v1 scripts are tests

    return {
        "id": script.get("id", ""),
        "wp_id": "08-60",
        "title": script.get("title", ""),
        "technique": technique,
        "pass_criteria": "",
        "conditions": "",
        "environment": "HIL" if script_type == "hil" else "",
        "measure_type": "system",  # Default to system verification
        "script_type": script_type,
        "content": script.get("content", ""),
        "parameters_snapshot": script.get("parameters_snapshot", {}),
        "requirement_id": script.get("requirement_id", ""),
        # Timestamps
        "created_at": script.get("created_at", now),
        "updated_at": now,
        "version": 1,
        "created_by": "",
    }


def _generate_traceability_links(
    requirements: List[Dict[str, Any]],
    verification_measures: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """Generate TraceabilityLink records from legacy linkedTestIds and requirement_id."""
    links = []
    link_counter = 0
    now = datetime.now().isoformat()
    seen = set()

    # From requirements' linkedTestIds
    for req in requirements:
        req_id = req.get("id", "")
        test_ids = req.get("linkedTestIds", req.get("linked_test_ids", []))
        for test_id in test_ids:
            pair = (req_id, test_id)
            if pair not in seen:
                seen.add(pair)
                link_counter += 1
                links.append({
                    "id": f"TL-{link_counter:04d}",
                    "source_id": req_id,
                    "source_type": "requirement",
                    "target_id": test_id,
                    "target_type": "verification_measure",
                    "link_type": "verifies",
                    "rationale": "Auto-migrated from v1 linkedTestIds",
                    "created_at": now,
                    "created_by": "migration_v2",
                })

    # From verification measures' requirement_id
    for vm in verification_measures:
        vm_id = vm.get("id", "")
        req_id = vm.get("requirement_id", "")
        if req_id:
            pair = (req_id, vm_id)
            if pair not in seen:
                seen.add(pair)
                link_counter += 1
                links.append({
                    "id": f"TL-{link_counter:04d}",
                    "source_id": req_id,
                    "source_type": "requirement",
                    "target_id": vm_id,
                    "target_type": "verification_measure",
                    "link_type": "verifies",
                    "rationale": "Auto-migrated from v1 requirement_id",
                    "created_at": now,
                    "created_by": "migration_v2",
                })

    return links


def migrate_project_to_v2(project_id: str) -> Dict[str, Any]:
    """Migrate a single project's data from v1 to v2 format.

    Returns a summary dict: {requirements_migrated, tests_migrated, links_generated}
    """
    project_id = str(project_id)

    if _is_migrated(project_id):
        return {"status": "already_migrated"}

    project_dir = os.path.join(PROJECTS_DIR, project_id)
    if not os.path.exists(project_dir):
        return {"status": "project_not_found"}

    # --- Load existing v1 data ---
    req_path = os.path.join(project_dir, "requirements.json")
    test_path = os.path.join(project_dir, "test_scripts.json")

    old_requirements = []
    old_test_scripts = []

    if os.path.exists(req_path):
        with open(req_path, "r", encoding="utf-8") as f:
            old_requirements = json.load(f)

    if os.path.exists(test_path):
        with open(test_path, "r", encoding="utf-8") as f:
            old_test_scripts = json.load(f)

    # --- Backup v1 data ---
    backup_dir = os.path.join(project_dir, "_backup_v1")
    os.makedirs(backup_dir, exist_ok=True)
    if os.path.exists(req_path):
        shutil.copy2(req_path, os.path.join(backup_dir, "requirements.json"))
    if os.path.exists(test_path):
        shutil.copy2(test_path, os.path.join(backup_dir, "test_scripts.json"))

    # --- Convert requirements to v2 ---
    new_requirements = [_convert_requirement_to_v2(r) for r in old_requirements]

    # --- Convert test scripts to verification measures ---
    new_measures = [_convert_test_script_to_verification_measure(s) for s in old_test_scripts]

    # --- Generate traceability links ---
    new_links = _generate_traceability_links(old_requirements, old_test_scripts)

    # --- Save v2 data ---
    req_store = GenericEntityStore(project_id, "requirements")
    req_store.save_all(new_requirements)

    vm_store = GenericEntityStore(project_id, "verification_measures")
    vm_store.save_all(new_measures)

    link_store = GenericEntityStore(project_id, "traceability_links")
    link_store.save_all(new_links)

    # --- Initialize empty files for other entity types ---
    for entity_type in [
        "requirement_attributes",
        "architecture_elements",
        "special_characteristics",
        "verification_selection_sets",
        "integration_instructions",
        "integrated_systems",
        "verification_data",
        "verification_results",
        "analysis_results",
        "consistency_evidence",
        "communication_evidence",
    ]:
        store = GenericEntityStore(project_id, entity_type)
        if not os.path.exists(store.path):
            store.save_all([])

    # --- Remove old test_scripts.json (now in verification_measures.json) ---
    # We keep it for safety but it's no longer the primary store
    # The backup in _backup_v1/ ensures recovery

    # --- Write migration flag ---
    _write_migration_flag(project_id)

    summary = {
        "status": "migrated",
        "requirements_migrated": len(new_requirements),
        "tests_to_measures": len(new_measures),
        "links_generated": len(new_links),
    }
    print(f"[Migration v2] Project {project_id}: {summary}")
    return summary


def migrate_all_projects():
    """Run v2 migration for all existing projects."""
    if not os.path.exists(PROJECTS_DIR):
        return

    for dirname in os.listdir(PROJECTS_DIR):
        project_dir = os.path.join(PROJECTS_DIR, dirname)
        if os.path.isdir(project_dir) and dirname.isdigit():
            migrate_project_to_v2(dirname)


def run_legacy_migration():
    """Run v0→v1 migration (global requirements.json → per-project).
    This is the original migration from storage.py, preserved for backward compat.
    """
    from .project_store import (
        load_projects, save_projects, get_project_dir,
        _save_json, _load_json, PROJECTS_DIR
    )

    migration_flag = os.path.join(PROJECTS_DIR, ".migrated")
    if os.path.exists(migration_flag):
        return

    os.makedirs(PROJECTS_DIR, exist_ok=True)

    projects = load_projects()

    default_reqs = [
        {
            "key": "1", "id": "REQ-101",
            "description": "The system shall maintain vehicle speed within +/- 2 km/h of the set speed.",
            "testSteps": "1. Set speed to 50 km/h.\n2. Monitor speed on flat road.\n3. Introduce incline.",
            "expectedResult": "Speed stays between 48-52 km/h.",
            "status": "Verified", "linkedApis": []
        },
        {
            "key": "2", "id": "REQ-102",
            "description": "The system shall disengage ACC when the brake pedal is pressed.",
            "testSteps": "1. Activate ACC.\n2. Press brake pedal.",
            "expectedResult": "ACC state changes to Standby.",
            "status": "Verified", "linkedApis": []
        },
        {
            "key": "3", "id": "REQ-103",
            "description": "The system shall warn the driver if the sensor is blocked.",
            "testSteps": "1. Block radar sensor.\n2. Check dashboard.",
            "expectedResult": 'Warning message "Sensor Blocked" appears.',
            "status": "Pending", "linkedApis": []
        }
    ]

    all_reqs = (_load_json(LEGACY_REQUIREMENTS_FILE, default_reqs)
                if os.path.exists(LEGACY_REQUIREMENTS_FILE) else list(default_reqs))
    all_tests = (_load_json(LEGACY_TEST_SCRIPTS_FILE, [])
                 if os.path.exists(LEGACY_TEST_SCRIPTS_FILE) else [])

    assigned_req_ids = set()

    for proj in projects:
        pid = proj["id"]
        linked_ids = proj.get("linkedReqIds", [])
        proj_reqs = [r for r in all_reqs if r["id"] in linked_ids]
        proj_test_ids = set()
        for r in proj_reqs:
            for tid in r.get("linkedTestIds", []):
                proj_test_ids.add(tid)
        proj_tests = [t for t in all_tests if t["id"] in proj_test_ids]

        req_path = os.path.join(get_project_dir(pid), "requirements.json")
        test_path = os.path.join(get_project_dir(pid), "test_scripts.json")
        _save_json(req_path, proj_reqs)
        _save_json(test_path, proj_tests)
        assigned_req_ids.update(r["id"] for r in proj_reqs)

    for proj in projects:
        pid = proj["id"]
        if not proj.get("linkedReqIds"):
            req_path = os.path.join(get_project_dir(pid), "requirements.json")
            if not os.path.exists(req_path):
                _save_json(req_path, [])
                test_path = os.path.join(get_project_dir(pid), "test_scripts.json")
                _save_json(test_path, [])

    unassigned_reqs = [r for r in all_reqs if r["id"] not in assigned_req_ids]
    if unassigned_reqs:
        unassigned_id = max([p.get("id", 0) for p in projects]) + 1 if projects else 1
        unassigned_project = {
            "id": unassigned_id, "title": "Unassigned",
            "status": "warning", "statusText": "Needs Sorting",
            "metrics": [{"label": "Traceability", "value": "0%"}]
        }
        projects.append(unassigned_project)
        save_projects(projects)

        unassigned_test_ids = set()
        for r in unassigned_reqs:
            for tid in r.get("linkedTestIds", []):
                unassigned_test_ids.add(tid)
        unassigned_tests = [t for t in all_tests if t["id"] in unassigned_test_ids]

        req_path = os.path.join(get_project_dir(unassigned_id), "requirements.json")
        test_path = os.path.join(get_project_dir(unassigned_id), "test_scripts.json")
        _save_json(req_path, unassigned_reqs)
        _save_json(test_path, unassigned_tests)

    if os.path.exists(LEGACY_REQUIREMENTS_FILE):
        os.rename(LEGACY_REQUIREMENTS_FILE, LEGACY_REQUIREMENTS_FILE.replace(".json", "_backup.json"))
    if os.path.exists(LEGACY_TEST_SCRIPTS_FILE):
        os.rename(LEGACY_TEST_SCRIPTS_FILE, LEGACY_TEST_SCRIPTS_FILE.replace(".json", "_backup.json"))

    with open(os.path.join(PROJECTS_DIR, ".migrated"), "w") as f:
        f.write("migrated")

    print(f"[Migration v1] Migrated requirements to per-project storage under {PROJECTS_DIR}/")
