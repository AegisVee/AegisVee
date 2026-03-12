import json
import os
import shutil
import time

PROJECTS_FILE = "data/projects.json"
PROJECTS_DIR = "data/projects"

# Legacy paths (used only for migration)
LEGACY_REQUIREMENTS_FILE = "data/requirements.json"
LEGACY_TEST_SCRIPTS_FILE = "data/test_scripts.json"

DEFAULT_PROJECTS = [
    {
        "id": 1,
        "title": "Braking System (ABS)",
        "status": "success",
        "statusText": "Ready for Release",
        "metrics": [
            { "label": "Traceability", "value": "0%" }
        ]
    },
    {
        "id": 2,
        "title": "Lane Keep Assist (LKA)",
        "status": "warning",
        "statusText": "Review Needed",
        "metrics": [
            { "label": "Traceability", "value": "0%" }
        ]
    },
    {
        "id": 3,
        "title": "Adaptive Cruise (ACC)",
        "status": "error",
        "statusText": "Critical Failures",
        "metrics": [
            { "label": "Traceability", "value": "0%" }
        ]
    }
]

DEFAULT_REQUIREMENTS = [
    {
        "key": "1",
        "id": "REQ-101",
        "description": "The system shall maintain vehicle speed within +/- 2 km/h of the set speed.",
        "testSteps": "1. Set speed to 50 km/h.\n2. Monitor speed on flat road.\n3. Introduce incline.",
        "expectedResult": "Speed stays between 48-52 km/h.",
        "status": "Verified",
        "linkedApis": []
    },
    {
        "key": "2",
        "id": "REQ-102",
        "description": "The system shall disengage ACC when the brake pedal is pressed.",
        "testSteps": "1. Activate ACC.\n2. Press brake pedal.",
        "expectedResult": "ACC state changes to Standby.",
        "status": "Verified",
        "linkedApis": []
    },
    {
        "key": "3",
        "id": "REQ-103",
        "description": "The system shall warn the driver if the sensor is blocked.",
        "testSteps": "1. Block radar sensor.\n2. Check dashboard.",
        "expectedResult": "Warning message \"Sensor Blocked\" appears.",
        "status": "Pending",
        "linkedApis": []
    }
]


# ============================================================
# In-memory cache (TTL-based to avoid reloading JSON each request)
# ============================================================
_cache = {}
_cache_ts = {}
CACHE_TTL = 5  # seconds

def _cached_load(path, default):
    """Load JSON from file with TTL cache."""
    now = time.time()
    if path in _cache and (now - _cache_ts.get(path, 0)) < CACHE_TTL:
        return _cache[path]
    if not os.path.exists(path):
        return list(default) if isinstance(default, list) else default
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    _cache[path] = data
    _cache_ts[path] = now
    return data

def _invalidate(path):
    """Invalidate cache entry after a write."""
    _cache.pop(path, None)
    _cache_ts.pop(path, None)


# ============================================================
# Core I/O helpers
# ============================================================

def _ensure_dir(path):
    if not os.path.exists(path):
        os.makedirs(path)

def load_data(filename, default):
    return _cached_load(filename, default)

def save_data(filename, data):
    _ensure_dir(os.path.dirname(filename))
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4, ensure_ascii=False)
    _invalidate(filename)
    return True


# ============================================================
# Project-scoped storage helpers
# ============================================================

def get_project_dir(project_id):
    """Return (and ensure exists) `data/projects/{project_id}/`."""
    d = os.path.join(PROJECTS_DIR, str(project_id))
    _ensure_dir(d)
    return d

def _project_requirements_path(project_id):
    return os.path.join(get_project_dir(project_id), "requirements.json")

def _project_test_scripts_path(project_id):
    return os.path.join(get_project_dir(project_id), "test_scripts.json")

def load_project_requirements(project_id):
    return load_data(_project_requirements_path(project_id), [])

def save_project_requirements(project_id, requirements):
    return save_data(_project_requirements_path(project_id), requirements)

def load_project_test_scripts(project_id):
    return load_data(_project_test_scripts_path(project_id), [])

def save_project_test_scripts(project_id, test_scripts):
    return save_data(_project_test_scripts_path(project_id), test_scripts)


# ============================================================
# Projects CRUD (projects.json — unchanged structure)
# ============================================================

def load_projects():
    _ensure_dir("data")
    return load_data(PROJECTS_FILE, DEFAULT_PROJECTS)

def save_projects(projects):
    return save_data(PROJECTS_FILE, projects)

def add_project(project_data):
    projects = load_projects()
    new_id = max([p.get("id", 0) for p in projects]) + 1 if projects else 1

    template = project_data.get("template")

    new_project = {
        "id": new_id,
        "title": project_data.get("title", "New Project"),
        "status": "warning",
        "statusText": "Initializing",
        "metrics": [
            { "label": "Traceability", "value": "0%" }
        ]
    }

    projects.append(new_project)
    save_projects(projects)

    # Create the project directory with empty files (or from template)
    get_project_dir(new_id)
    if template:
        template_path = os.path.join("templates", template, "requirements.json")
        if os.path.exists(template_path):
            shutil.copy2(template_path, _project_requirements_path(new_id))
        else:
            save_project_requirements(new_id, [])
    else:
        save_project_requirements(new_id, [])
    save_project_test_scripts(new_id, [])

    return new_project

def delete_project(project_id):
    projects = load_projects()
    initial_count = len(projects)
    projects = [p for p in projects if str(p["id"]) != str(project_id)]

    if len(projects) < initial_count:
        save_projects(projects)
        # Optionally remove project data directory
        proj_dir = os.path.join(PROJECTS_DIR, str(project_id))
        if os.path.exists(proj_dir):
            shutil.rmtree(proj_dir)
        return True
    return False


# ============================================================
# Project-scoped Requirements CRUD
# ============================================================

def add_requirement(req_data, project_id):
    """Add a new requirement to a specific project."""
    requirements = load_project_requirements(project_id)

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
        "linkedTestIds": req_data.get("linkedTestIds", [])
    }

    requirements.append(new_req)
    save_project_requirements(project_id, requirements)
    return new_req


# ============================================================
# Project-scoped Test Scripts CRUD
# ============================================================

def add_test_script(script_data, project_id):
    scripts = load_project_test_scripts(project_id)
    existing_ids = [int(s["id"].split("-")[1]) for s in scripts if s["id"].startswith("TEST-") and s["id"].split("-")[1].isdigit()]
    next_num = max(existing_ids) + 1 if existing_ids else 1
    new_id = f"TEST-{next_num:03d}"

    new_script = {
        "id": new_id,
        "requirement_id": script_data.get("requirement_id", ""),
        "type": script_data.get("type", "manual"),
        "title": script_data.get("title", "New Test Script"),
        "content": script_data.get("content", ""),
        "parameters_snapshot": script_data.get("parameters_snapshot", {})
    }
    scripts.append(new_script)
    save_project_test_scripts(project_id, scripts)

    # Link test to its parent requirement
    requirements = load_project_requirements(project_id)
    for req in requirements:
        if req["id"] == new_script["requirement_id"]:
            linked = req.get("linkedTestIds", [])
            if new_id not in linked:
                linked.append(new_id)
            req["linkedTestIds"] = linked
            break
    save_project_requirements(project_id, requirements)

    return new_script

def update_test_script(script_id, updates, project_id):
    scripts = load_project_test_scripts(project_id)
    for i, s in enumerate(scripts):
        if s["id"] == script_id:
            scripts[i] = {**s, **updates, "id": script_id}
            save_project_test_scripts(project_id, scripts)
            return scripts[i]
    return None

def delete_test_script(script_id, project_id):
    scripts = load_project_test_scripts(project_id)
    original_len = len(scripts)
    scripts = [s for s in scripts if s["id"] != script_id]
    if len(scripts) < original_len:
        save_project_test_scripts(project_id, scripts)
        # Remove link from parent requirement
        requirements = load_project_requirements(project_id)
        for req in requirements:
            if script_id in req.get("linkedTestIds", []):
                req["linkedTestIds"] = [t for t in req["linkedTestIds"] if t != script_id]
        save_project_requirements(project_id, requirements)
        return True
    return False


# ============================================================
# Project Metrics & Analytics (now reads project-scoped data)
# ============================================================

def update_project_metrics(project_id):
    """Recalculate traceability metric from the project's own requirements."""
    projects = load_projects()
    requirements = load_project_requirements(project_id)

    project = next((p for p in projects if str(p["id"]) == str(project_id)), None)
    if not project:
        return None

    total_reqs = len(requirements)
    if total_reqs == 0:
        project["metrics"] = [
            { "label": "Traceability", "value": "0%" }
        ]
    else:
        traced_count = len([r for r in requirements if r.get("linkedTestIds") and len(r["linkedTestIds"]) > 0])
        traceability_percent = int((traced_count / total_reqs) * 100)

        if traceability_percent == 100:
            status = "success"
            status_text = "Ready"
        elif traceability_percent >= 50:
            status = "warning"
            status_text = "Review Needed"
        else:
            status = "error"
            status_text = "Critical"

        project["status"] = status
        project["statusText"] = status_text
        project["metrics"] = [
            { "label": "Traceability", "value": f"{traceability_percent}%" }
        ]

    save_projects(projects)
    return project

def calculate_project_analytics(project_id):
    projects = load_projects()
    requirements = load_project_requirements(project_id)

    project = next((p for p in projects if str(p["id"]) == str(project_id)), None)
    if not project:
        return None

    test_cases_count = len([r for r in requirements if r.get("testSteps")])
    passed_count = len([r for r in requirements if r.get("status") == "Verified"])
    failed_count = max(0, test_cases_count - passed_count)

    complexity = round(1.0 + (0.1 * len(requirements)), 1)
    duplication = "0%"

    verified_count = len([r for r in requirements if r.get("status") == "Verified"])
    open_issues = len(requirements) - verified_count

    grade = "A"
    if open_issues > 5:
        grade = "C"
    elif open_issues > 0:
        grade = "B"

    req_total = len(requirements)
    req_linked = len([r for r in requirements if r.get("linkedApis") and len(r["linkedApis"]) > 0])

    return {
        "qualityGate": {
            "testCases": test_cases_count,
            "passed": passed_count,
            "failed": failed_count
        },
        "codeAnalysis": {
            "complexity": complexity,
            "duplication": duplication,
            "grade": grade
        },
        "requirements": {
            "total": req_total,
            "linked": req_linked,
            "percent": int((req_linked / req_total * 100) if req_total > 0 else 0)
        }
    }


# ============================================================
# Migration: global requirements.json → per-project storage
# ============================================================

_MIGRATION_FLAG = os.path.join(PROJECTS_DIR, ".migrated")

def migrate_to_project_storage():
    """One-time migration from global requirements.json to per-project directories."""
    if os.path.exists(_MIGRATION_FLAG):
        return  # Already migrated

    _ensure_dir(PROJECTS_DIR)

    # Load current data
    projects = load_projects()
    all_reqs = load_data(LEGACY_REQUIREMENTS_FILE, DEFAULT_REQUIREMENTS) if os.path.exists(LEGACY_REQUIREMENTS_FILE) else list(DEFAULT_REQUIREMENTS)
    all_tests = load_data(LEGACY_TEST_SCRIPTS_FILE, []) if os.path.exists(LEGACY_TEST_SCRIPTS_FILE) else []

    assigned_req_ids = set()

    # 1) For projects that have linkedReqIds, move those requirements
    for proj in projects:
        pid = proj["id"]
        linked_ids = proj.get("linkedReqIds", [])
        proj_reqs = [r for r in all_reqs if r["id"] in linked_ids]
        proj_test_ids = set()
        for r in proj_reqs:
            for tid in r.get("linkedTestIds", []):
                proj_test_ids.add(tid)
        proj_tests = [t for t in all_tests if t["id"] in proj_test_ids]

        save_project_requirements(pid, proj_reqs)
        save_project_test_scripts(pid, proj_tests)
        assigned_req_ids.update(r["id"] for r in proj_reqs)

    # 2) For projects without linkedReqIds, create empty storage
    for proj in projects:
        pid = proj["id"]
        if not proj.get("linkedReqIds"):
            req_path = _project_requirements_path(pid)
            if not os.path.exists(req_path):
                save_project_requirements(pid, [])
                save_project_test_scripts(pid, [])

    # 3) Unassigned requirements → new "Unassigned" project
    unassigned_reqs = [r for r in all_reqs if r["id"] not in assigned_req_ids]
    if unassigned_reqs:
        unassigned_id = max([p.get("id", 0) for p in projects]) + 1 if projects else 1
        unassigned_project = {
            "id": unassigned_id,
            "title": "Unassigned",
            "status": "warning",
            "statusText": "Needs Sorting",
            "metrics": [
                { "label": "Traceability", "value": "0%" }
            ]
        }
        projects.append(unassigned_project)
        save_projects(projects)

        unassigned_test_ids = set()
        for r in unassigned_reqs:
            for tid in r.get("linkedTestIds", []):
                unassigned_test_ids.add(tid)
        unassigned_tests = [t for t in all_tests if t["id"] in unassigned_test_ids]

        save_project_requirements(unassigned_id, unassigned_reqs)
        save_project_test_scripts(unassigned_id, unassigned_tests)

    # 4) Backup legacy files
    if os.path.exists(LEGACY_REQUIREMENTS_FILE):
        os.rename(LEGACY_REQUIREMENTS_FILE, LEGACY_REQUIREMENTS_FILE.replace(".json", "_backup.json"))
    if os.path.exists(LEGACY_TEST_SCRIPTS_FILE):
        os.rename(LEGACY_TEST_SCRIPTS_FILE, LEGACY_TEST_SCRIPTS_FILE.replace(".json", "_backup.json"))

    # 5) Write migration flag
    with open(_MIGRATION_FLAG, "w") as f:
        f.write("migrated")

    print(f"[Migration] Migrated requirements to per-project storage under {PROJECTS_DIR}/")


def init_storage():
    """Initialize storage and run migration if needed."""
    _ensure_dir("data")
    if not os.path.exists(PROJECTS_FILE):
        save_data(PROJECTS_FILE, DEFAULT_PROJECTS)

    # Legacy init (only if legacy file exists and migration hasn't run)
    if not os.path.exists(_MIGRATION_FLAG) and not os.path.exists(LEGACY_REQUIREMENTS_FILE):
        save_data(LEGACY_REQUIREMENTS_FILE, DEFAULT_REQUIREMENTS)

    migrate_to_project_storage()
