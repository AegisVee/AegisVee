"""
V&V Rules Router — Automated verification & validation rule management.

Handles:
- V&V Rule CRUD (create, read, update, delete)
- Single rule evaluation (check)
- Batch rule evaluation (check-all)
"""

from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException, Body, Query
from storage.base import GenericEntityStore

router = APIRouter(prefix="/api/projects/{project_id}", tags=["vnv-rules"])


# ============================================================
# Helpers
# ============================================================

def _vnv_store(project_id: str) -> GenericEntityStore:
    return GenericEntityStore(str(project_id), "vnv_rules")


def _next_rule_id(store: GenericEntityStore) -> str:
    items = store.load_all()
    ids = [e.get("id", "") for e in items if e.get("id", "").startswith("VVR-")]
    nums = []
    for eid in ids:
        try:
            nums.append(int(eid.split("-")[1]))
        except (IndexError, ValueError):
            pass
    return f"VVR-{max(nums, default=0) + 1:04d}"


def _evaluate_rule(rule: dict, project_id: str) -> dict:
    """Evaluate a single V&V rule against live block/requirement values."""
    from vnv_evaluator import VnVEvaluator

    block_store = GenericEntityStore(str(project_id), "blocks")
    req_store = GenericEntityStore(str(project_id), "requirements")

    blocks = block_store.load_all()
    requirements = req_store.load_all()

    evaluator = VnVEvaluator(blocks, requirements)
    return evaluator.evaluate_rule(rule)


# ============================================================
# V&V Rule CRUD Endpoints
# ============================================================

@router.get("/vnv-rules")
async def list_vnv_rules(
    project_id: str,
    requirement_id: Optional[str] = Query(None, description="Filter by requirement ID"),
):
    """List all V&V rules, optionally filtered by requirement_id."""
    store = _vnv_store(project_id)
    rules = store.load_all()

    if requirement_id:
        rules = [r for r in rules if r.get("requirement_id") == requirement_id]

    return rules


@router.post("/vnv-rules")
async def create_vnv_rule(project_id: str, body: dict = Body(...)):
    """Create a new V&V rule."""
    store = _vnv_store(project_id)
    now = datetime.now().isoformat()

    rule = {
        "id": body.get("id") or _next_rule_id(store),
        "title": body.get("title", "New Rule"),
        "requirement_id": body.get("requirement_id", ""),
        "block_id": body.get("block_id", ""),
        "formula": body.get("formula", ""),
        "operator": body.get("operator", "<="),
        "left_value": body.get("left_value", None),
        "left_label": body.get("left_label", ""),
        "right_value": body.get("right_value", None),
        "right_label": body.get("right_label", ""),
        "method": body.get("method", "test"),
        "status": "not_verified",
        "last_checked": None,
        "created_at": now,
        "updated_at": now,
        "version": 1,
    }
    return store.add(rule)


@router.get("/vnv-rules/{rule_id}")
async def get_vnv_rule(project_id: str, rule_id: str):
    """Get a single V&V rule by ID."""
    store = _vnv_store(project_id)
    rule = store.get_by_id(rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail=f"V&V Rule {rule_id} not found")
    return rule


@router.put("/vnv-rules/{rule_id}")
async def update_vnv_rule(project_id: str, rule_id: str, body: dict = Body(...)):
    """Update a V&V rule by ID."""
    store = _vnv_store(project_id)
    updated = store.update(rule_id, body)
    if not updated:
        raise HTTPException(status_code=404, detail=f"V&V Rule {rule_id} not found")
    return updated


@router.delete("/vnv-rules/{rule_id}")
async def delete_vnv_rule(project_id: str, rule_id: str):
    """Delete a V&V rule by ID."""
    store = _vnv_store(project_id)
    if not store.delete(rule_id):
        raise HTTPException(status_code=404, detail=f"V&V Rule {rule_id} not found")
    return {"status": "deleted", "id": rule_id}


# ============================================================
# Rule Evaluation Endpoints
# ============================================================

@router.post("/vnv-rules/{rule_id}/check")
async def check_vnv_rule(project_id: str, rule_id: str):
    """Evaluate a single V&V rule against live values."""
    store = _vnv_store(project_id)
    rule = store.get_by_id(rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail=f"V&V Rule {rule_id} not found")

    evaluated = _evaluate_rule(rule, project_id)

    # Save the evaluated result
    store.update(rule_id, {
        "status": evaluated["status"],
        "last_checked": evaluated["last_checked"],
        "left_value": evaluated.get("left_value"),
        "right_value": evaluated.get("right_value"),
    })

    return evaluated


@router.post("/vnv-rules/check-all")
async def check_all_vnv_rules(project_id: str):
    """Evaluate all V&V rules in the project."""
    store = _vnv_store(project_id)
    rules = store.load_all()

    results = []
    for rule in rules:
        evaluated = _evaluate_rule(rule, project_id)

        # Save each evaluated result
        store.update(rule["id"], {
            "status": evaluated["status"],
            "last_checked": evaluated["last_checked"],
            "left_value": evaluated.get("left_value"),
            "right_value": evaluated.get("right_value"),
        })
        results.append(evaluated)

    verified = sum(1 for r in results if r["status"] == "verified")
    return {
        "status": "checked",
        "total": len(results),
        "verified": verified,
        "not_verified": len(results) - verified,
        "rules": results,
    }
