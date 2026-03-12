"""
Verification Router — SYS.4 + SYS.5 ASPICE process endpoints.

Handles:
- VerificationMeasure (WP 08-60) CRUD — unifies legacy TestScript
- VerificationMeasureSelectionSet (WP 08-58) CRUD
- IntegrationSequenceInstruction (WP 06-50) CRUD
- IntegratedSystem (WP 11-06) CRUD
- VerificationMeasureData (WP 03-50) CRUD
- VerificationResult (WP 15-52) CRUD
"""

from datetime import datetime
from fastapi import APIRouter, HTTPException, Body
from storage.base import GenericEntityStore
from storage import update_project_metrics

router = APIRouter(prefix="/api/projects/{project_id}", tags=["verification"])


# ============================================================
# Helpers
# ============================================================

def _store(project_id: str, entity_type: str) -> GenericEntityStore:
    return GenericEntityStore(str(project_id), entity_type)


def _next_id(store: GenericEntityStore, prefix: str) -> str:
    count = store.count()
    return f"{prefix}-{count + 1:04d}"


# ============================================================
# VerificationMeasure (WP 08-60) — Unified with legacy TestScript
# ============================================================

@router.get("/verification-measures")
async def list_verification_measures(project_id: str):
    """List all verification measures."""
    return _store(project_id, "verification_measures").load_all()


@router.post("/verification-measures")
async def create_verification_measure(project_id: str, body: dict = Body(...)):
    """Create a new verification measure."""
    s = _store(project_id, "verification_measures")
    now = datetime.now().isoformat()

    measure = {
        "id": body.get("id") or _next_id(s, "VM"),
        "wp_id": "08-60",
        "title": body.get("title", ""),
        "technique": body.get("technique", "test"),
        "pass_criteria": body.get("pass_criteria", ""),
        "conditions": body.get("conditions", ""),
        "environment": body.get("environment", ""),
        "measure_type": body.get("measure_type", "system"),
        # Legacy TestScript fields
        "script_type": body.get("script_type", body.get("type", "manual")),
        "content": body.get("content", ""),
        "parameters_snapshot": body.get("parameters_snapshot", {}),
        "requirement_id": body.get("requirement_id", ""),
        "created_at": now,
        "updated_at": now,
        "version": 1,
        "created_by": body.get("created_by", ""),
    }
    return s.add(measure)


@router.get("/verification-measures/{vm_id}")
async def get_verification_measure(project_id: str, vm_id: str):
    s = _store(project_id, "verification_measures")
    item = s.get_by_id(vm_id)
    if not item:
        raise HTTPException(status_code=404, detail=f"Verification measure {vm_id} not found")
    return item


@router.put("/verification-measures/{vm_id}")
async def update_verification_measure(
    project_id: str, vm_id: str, body: dict = Body(...)
):
    s = _store(project_id, "verification_measures")
    updated = s.update(vm_id, body)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Verification measure {vm_id} not found")
    return updated


@router.delete("/verification-measures/{vm_id}")
async def delete_verification_measure(project_id: str, vm_id: str):
    s = _store(project_id, "verification_measures")
    if not s.delete(vm_id):
        raise HTTPException(status_code=404, detail=f"Verification measure {vm_id} not found")
    return {"status": "deleted", "id": vm_id}


@router.post("/verification-measures/{vm_id}/execute")
async def execute_verification_measure(
    project_id: str, vm_id: str, body: dict = Body(default={})
):
    """Record execution of a verification measure — creates a VerificationResult."""
    vm_store = _store(project_id, "verification_measures")
    measure = vm_store.get_by_id(vm_id)
    if not measure:
        raise HTTPException(status_code=404, detail=f"Verification measure {vm_id} not found")

    result_store = _store(project_id, "verification_results")
    now = datetime.now().isoformat()

    result = {
        "id": _next_id(result_store, "VR"),
        "wp_id": "15-52",
        "measure_id": vm_id,
        "result": body.get("result", "pending"),
        "summary": body.get("summary", ""),
        "defects": body.get("defects", []),
        "created_at": now,
        "updated_at": now,
        "version": 1,
        "created_by": body.get("created_by", ""),
    }
    result_store.add(result)
    update_project_metrics(project_id)
    return result


# ============================================================
# VerificationMeasureSelectionSet (WP 08-58) — Entry/Exit criteria
# ============================================================

@router.get("/verification-selection-sets")
async def list_selection_sets(project_id: str):
    return _store(project_id, "verification_selection_sets").load_all()


@router.post("/verification-selection-sets")
async def create_selection_set(project_id: str, body: dict = Body(...)):
    s = _store(project_id, "verification_selection_sets")
    now = datetime.now().isoformat()
    item = {
        "id": body.get("id") or _next_id(s, "SS"),
        "wp_id": "08-58",
        "title": body.get("title", ""),
        "measure_ids": body.get("measure_ids", []),
        "entry_criteria": body.get("entry_criteria", ""),
        "exit_criteria": body.get("exit_criteria", ""),
        "release_scope": body.get("release_scope", ""),
        "regression_strategy": body.get("regression_strategy", ""),
        "created_at": now,
        "updated_at": now,
        "version": 1,
        "created_by": body.get("created_by", ""),
    }
    return s.add(item)


@router.put("/verification-selection-sets/{ss_id}")
async def update_selection_set(project_id: str, ss_id: str, body: dict = Body(...)):
    s = _store(project_id, "verification_selection_sets")
    updated = s.update(ss_id, body)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Selection set {ss_id} not found")
    return updated


@router.delete("/verification-selection-sets/{ss_id}")
async def delete_selection_set(project_id: str, ss_id: str):
    s = _store(project_id, "verification_selection_sets")
    if not s.delete(ss_id):
        raise HTTPException(status_code=404, detail=f"Selection set {ss_id} not found")
    return {"status": "deleted", "id": ss_id}


# ============================================================
# IntegrationSequenceInstruction (WP 06-50)
# ============================================================

@router.get("/integration-instructions")
async def list_integration_instructions(project_id: str):
    return _store(project_id, "integration_instructions").load_all()


@router.post("/integration-instructions")
async def create_integration_instruction(project_id: str, body: dict = Body(...)):
    s = _store(project_id, "integration_instructions")
    now = datetime.now().isoformat()
    item = {
        "id": body.get("id") or _next_id(s, "II"),
        "wp_id": "06-50",
        "title": body.get("title", ""),
        "sequence_order": body.get("sequence_order", 0),
        "instruction": body.get("instruction", ""),
        "architecture_element_ids": body.get("architecture_element_ids", []),
        "created_at": now,
        "updated_at": now,
        "version": 1,
        "created_by": body.get("created_by", ""),
    }
    return s.add(item)


@router.put("/integration-instructions/{ii_id}")
async def update_integration_instruction(
    project_id: str, ii_id: str, body: dict = Body(...)
):
    s = _store(project_id, "integration_instructions")
    updated = s.update(ii_id, body)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Integration instruction {ii_id} not found")
    return updated


@router.delete("/integration-instructions/{ii_id}")
async def delete_integration_instruction(project_id: str, ii_id: str):
    s = _store(project_id, "integration_instructions")
    if not s.delete(ii_id):
        raise HTTPException(status_code=404, detail=f"Integration instruction {ii_id} not found")
    return {"status": "deleted", "id": ii_id}


# ============================================================
# IntegratedSystem (WP 11-06)
# ============================================================

@router.get("/integrated-systems")
async def list_integrated_systems(project_id: str):
    return _store(project_id, "integrated_systems").load_all()


@router.post("/integrated-systems")
async def create_integrated_system(project_id: str, body: dict = Body(...)):
    s = _store(project_id, "integrated_systems")
    now = datetime.now().isoformat()
    item = {
        "id": body.get("id") or _next_id(s, "IS"),
        "wp_id": "11-06",
        "title": body.get("title", ""),
        "element_ids": body.get("element_ids", []),
        "integration_status": body.get("integration_status", "pending"),
        "created_at": now,
        "updated_at": now,
        "version": 1,
        "created_by": body.get("created_by", ""),
    }
    return s.add(item)


@router.put("/integrated-systems/{is_id}")
async def update_integrated_system(project_id: str, is_id: str, body: dict = Body(...)):
    s = _store(project_id, "integrated_systems")
    updated = s.update(is_id, body)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Integrated system {is_id} not found")
    return updated


@router.delete("/integrated-systems/{is_id}")
async def delete_integrated_system(project_id: str, is_id: str):
    s = _store(project_id, "integrated_systems")
    if not s.delete(is_id):
        raise HTTPException(status_code=404, detail=f"Integrated system {is_id} not found")
    return {"status": "deleted", "id": is_id}


# ============================================================
# VerificationMeasureData (WP 03-50)
# ============================================================

@router.get("/verification-data")
async def list_verification_data(project_id: str):
    return _store(project_id, "verification_data").load_all()


@router.post("/verification-data")
async def create_verification_data(project_id: str, body: dict = Body(...)):
    s = _store(project_id, "verification_data")
    now = datetime.now().isoformat()
    item = {
        "id": body.get("id") or _next_id(s, "VD"),
        "wp_id": "03-50",
        "measure_id": body.get("measure_id", ""),
        "execution_date": body.get("execution_date", now),
        "raw_data": body.get("raw_data", {}),
        "notes": body.get("notes", ""),
        "created_at": now,
        "updated_at": now,
        "version": 1,
        "created_by": body.get("created_by", ""),
    }
    return s.add(item)


# ============================================================
# VerificationResult (WP 15-52)
# ============================================================

@router.get("/verification-results")
async def list_verification_results(project_id: str):
    return _store(project_id, "verification_results").load_all()


@router.post("/verification-results")
async def create_verification_result(project_id: str, body: dict = Body(...)):
    s = _store(project_id, "verification_results")
    now = datetime.now().isoformat()
    item = {
        "id": body.get("id") or _next_id(s, "VR"),
        "wp_id": "15-52",
        "measure_id": body.get("measure_id", ""),
        "result": body.get("result", "pending"),
        "summary": body.get("summary", ""),
        "defects": body.get("defects", []),
        "created_at": now,
        "updated_at": now,
        "version": 1,
        "created_by": body.get("created_by", ""),
    }
    result = s.add(item)
    update_project_metrics(project_id)
    return result


@router.put("/verification-results/{vr_id}")
async def update_verification_result(
    project_id: str, vr_id: str, body: dict = Body(...)
):
    s = _store(project_id, "verification_results")
    updated = s.update(vr_id, body)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Verification result {vr_id} not found")
    update_project_metrics(project_id)
    return updated


@router.delete("/verification-results/{vr_id}")
async def delete_verification_result(project_id: str, vr_id: str):
    s = _store(project_id, "verification_results")
    if not s.delete(vr_id):
        raise HTTPException(status_code=404, detail=f"Verification result {vr_id} not found")
    return {"status": "deleted", "id": vr_id}


# ============================================================
# v3.0: Test Runs (Flow-style test execution)
# ============================================================

@router.get("/test-runs")
async def list_test_runs(project_id: str, test_case_id: str = None):
    """List all test runs, optionally filtered by test_case_id."""
    runs = _store(project_id, "test_runs").load_all()
    if test_case_id:
        runs = [r for r in runs if r.get("test_case_id") == test_case_id]
    return runs


@router.post("/test-runs")
async def create_test_run(project_id: str, body: dict = Body(...)):
    """Create a new test run for a test case."""
    s = _store(project_id, "test_runs")
    now = datetime.now().isoformat()

    # Auto-generate run number
    existing = s.load_all()
    tc_id = body.get("test_case_id", "")
    tc_runs = [r for r in existing if r.get("test_case_id") == tc_id]
    run_number = len(tc_runs) + 1

    # Build steps from template if provided
    steps = body.get("steps", [])
    for i, step in enumerate(steps):
        if not step.get("id"):
            step["id"] = f"step-{i+1}"
        if "status" not in step:
            step["status"] = "pending"

    run = {
        "id": body.get("id") or _next_id(s, "TR"),
        "test_case_id": tc_id,
        "run_number": run_number,
        "owner": body.get("owner", ""),
        "status": "pending",
        "steps": steps,
        "notes": body.get("notes", ""),
        "created_at": now,
        "completed_at": "",
        "progress": 0.0,
    }
    return s.add(run)


@router.get("/test-runs/{tr_id}")
async def get_test_run(project_id: str, tr_id: str):
    s = _store(project_id, "test_runs")
    item = s.get_by_id(tr_id)
    if not item:
        raise HTTPException(status_code=404, detail=f"Test run {tr_id} not found")
    return item


@router.put("/test-runs/{tr_id}")
async def update_test_run(project_id: str, tr_id: str, body: dict = Body(...)):
    """Update a test run (e.g. update step statuses, overall status)."""
    s = _store(project_id, "test_runs")

    # Recalculate progress and status from steps
    steps = body.get("steps")
    if steps:
        total = len(steps)
        completed = sum(1 for step in steps if step.get("status") in ("pass", "fail", "na"))
        body["progress"] = round((completed / total) * 100, 1) if total > 0 else 0

        # Auto-derive overall status
        statuses = [step.get("status", "pending") for step in steps]
        if all(s == "pass" or s == "na" for s in statuses) and total > 0:
            body["status"] = "pass"
        elif any(s == "fail" for s in statuses):
            body["status"] = "fail"
        elif any(s == "pass" for s in statuses):
            body["status"] = "partial"

        # Auto-set completed_at when 100%
        if body["progress"] >= 100 and not body.get("completed_at"):
            body["completed_at"] = datetime.now().isoformat()

    updated = s.update(tr_id, body)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Test run {tr_id} not found")
    return updated


@router.delete("/test-runs/{tr_id}")
async def delete_test_run(project_id: str, tr_id: str):
    s = _store(project_id, "test_runs")
    if not s.delete(tr_id):
        raise HTTPException(status_code=404, detail=f"Test run {tr_id} not found")
    return {"status": "deleted", "id": tr_id}


# NOTE: V&V Rules CRUD + evaluation endpoints moved to routers/vnv_rules.py (v3.0)
# The vnv_rules router uses vnv_evaluator.py for proper $Block.Property and $REQ.EngineeringValue resolution.


# NOTE: Block CRUD endpoints moved to routers/blocks.py (v3.0)
# The blocks router uses GenericEntityStore("blocks") for the dedicated blocks data store,
# while architecture_elements remain in the architecture router.
