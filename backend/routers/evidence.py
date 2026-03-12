"""
Evidence Router — Cross-cutting evidence management for ASPICE compliance.

Handles:
- ConsistencyEvidence (WP 13-51) CRUD
- CommunicationEvidence (WP 13-52) CRUD
- AnalysisResult (WP 15-51) CRUD
"""

from datetime import datetime
from fastapi import APIRouter, HTTPException, Body
from storage.base import GenericEntityStore

router = APIRouter(prefix="/api/projects/{project_id}", tags=["evidence"])


# ============================================================
# Helpers
# ============================================================

def _store(project_id: str, entity_type: str) -> GenericEntityStore:
    return GenericEntityStore(str(project_id), entity_type)


def _next_id(store: GenericEntityStore, prefix: str) -> str:
    return f"{prefix}-{store.count() + 1:04d}"


# ============================================================
# ConsistencyEvidence (WP 13-51)
# ============================================================

@router.get("/consistency-evidence")
async def list_consistency_evidence(project_id: str):
    """List all consistency evidence records."""
    return _store(project_id, "consistency_evidence").load_all()


@router.post("/consistency-evidence")
async def create_consistency_evidence(project_id: str, body: dict = Body(...)):
    """Create a new consistency evidence record."""
    s = _store(project_id, "consistency_evidence")
    now = datetime.now().isoformat()
    item = {
        "id": body.get("id") or _next_id(s, "CE"),
        "wp_id": "13-51",
        "evidence_type": body.get("evidence_type", "tool_link"),
        "source_id": body.get("source_id", ""),
        "target_id": body.get("target_id", ""),
        "description": body.get("description", ""),
        "status": body.get("status", "open"),
        "created_at": now,
        "updated_at": now,
        "version": 1,
        "created_by": body.get("created_by", ""),
    }
    return s.add(item)


@router.get("/consistency-evidence/{ce_id}")
async def get_consistency_evidence(project_id: str, ce_id: str):
    s = _store(project_id, "consistency_evidence")
    item = s.get_by_id(ce_id)
    if not item:
        raise HTTPException(status_code=404, detail=f"Consistency evidence {ce_id} not found")
    return item


@router.put("/consistency-evidence/{ce_id}")
async def update_consistency_evidence(
    project_id: str, ce_id: str, body: dict = Body(...)
):
    s = _store(project_id, "consistency_evidence")
    updated = s.update(ce_id, body)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Consistency evidence {ce_id} not found")
    return updated


@router.delete("/consistency-evidence/{ce_id}")
async def delete_consistency_evidence(project_id: str, ce_id: str):
    s = _store(project_id, "consistency_evidence")
    if not s.delete(ce_id):
        raise HTTPException(status_code=404, detail=f"Consistency evidence {ce_id} not found")
    return {"status": "deleted", "id": ce_id}


# ============================================================
# CommunicationEvidence (WP 13-52)
# ============================================================

@router.get("/communication-evidence")
async def list_communication_evidence(project_id: str):
    """List all communication evidence records."""
    return _store(project_id, "communication_evidence").load_all()


@router.post("/communication-evidence")
async def create_communication_evidence(project_id: str, body: dict = Body(...)):
    """Create a new communication evidence record."""
    s = _store(project_id, "communication_evidence")
    now = datetime.now().isoformat()
    item = {
        "id": body.get("id") or _next_id(s, "COM"),
        "wp_id": "13-52",
        "comm_type": body.get("comm_type", "notification"),
        "participants": body.get("participants", []),
        "content": body.get("content", ""),
        "decision": body.get("decision", ""),
        "created_at": now,
        "updated_at": now,
        "version": 1,
        "created_by": body.get("created_by", ""),
    }
    return s.add(item)


@router.get("/communication-evidence/{com_id}")
async def get_communication_evidence(project_id: str, com_id: str):
    s = _store(project_id, "communication_evidence")
    item = s.get_by_id(com_id)
    if not item:
        raise HTTPException(status_code=404, detail=f"Communication evidence {com_id} not found")
    return item


@router.put("/communication-evidence/{com_id}")
async def update_communication_evidence(
    project_id: str, com_id: str, body: dict = Body(...)
):
    s = _store(project_id, "communication_evidence")
    updated = s.update(com_id, body)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Communication evidence {com_id} not found")
    return updated


@router.delete("/communication-evidence/{com_id}")
async def delete_communication_evidence(project_id: str, com_id: str):
    s = _store(project_id, "communication_evidence")
    if not s.delete(com_id):
        raise HTTPException(status_code=404, detail=f"Communication evidence {com_id} not found")
    return {"status": "deleted", "id": com_id}


# ============================================================
# AnalysisResult (WP 15-51)
# ============================================================

@router.get("/analysis-results")
async def list_analysis_results(project_id: str):
    """List all analysis results."""
    return _store(project_id, "analysis_results").load_all()


@router.post("/analysis-results")
async def create_analysis_result(project_id: str, body: dict = Body(...)):
    """Create a new analysis result."""
    s = _store(project_id, "analysis_results")
    now = datetime.now().isoformat()
    item = {
        "id": body.get("id") or _next_id(s, "AR"),
        "wp_id": "15-51",
        "source_id": body.get("source_id", ""),
        "analysis_type": body.get("analysis_type", "consistency"),
        "result": body.get("result", ""),
        "score": body.get("score"),
        "created_at": now,
        "updated_at": now,
        "version": 1,
        "created_by": body.get("created_by", ""),
    }
    return s.add(item)


@router.get("/analysis-results/{ar_id}")
async def get_analysis_result(project_id: str, ar_id: str):
    s = _store(project_id, "analysis_results")
    item = s.get_by_id(ar_id)
    if not item:
        raise HTTPException(status_code=404, detail=f"Analysis result {ar_id} not found")
    return item


@router.put("/analysis-results/{ar_id}")
async def update_analysis_result(project_id: str, ar_id: str, body: dict = Body(...)):
    s = _store(project_id, "analysis_results")
    updated = s.update(ar_id, body)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Analysis result {ar_id} not found")
    return updated


@router.delete("/analysis-results/{ar_id}")
async def delete_analysis_result(project_id: str, ar_id: str):
    s = _store(project_id, "analysis_results")
    if not s.delete(ar_id):
        raise HTTPException(status_code=404, detail=f"Analysis result {ar_id} not found")
    return {"status": "deleted", "id": ar_id}
