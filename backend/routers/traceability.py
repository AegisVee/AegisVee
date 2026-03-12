"""
Traceability Router — Cross-cutting traceability link management.

Handles:
- TraceabilityLink CRUD
- Traceability matrix (full bidirectional view)
- Coverage analysis per entity type
- Gap detection (entities missing required links)
- Impact analysis (BFS traversal from any entity)
"""

from datetime import datetime
from fastapi import APIRouter, HTTPException, Body
from storage.traceability_store import TraceabilityStore
from engines.traceability_engine import TraceabilityEngine

router = APIRouter(prefix="/api/projects/{project_id}/traceability", tags=["traceability"])


# ============================================================
# TraceabilityLink CRUD
# ============================================================

@router.get("/links")
async def list_traceability_links(project_id: str):
    """List all traceability links for a project."""
    store = TraceabilityStore(str(project_id))
    return store.load_all_links()


@router.post("/links")
async def create_traceability_link(project_id: str, body: dict = Body(...)):
    """Create a new traceability link between two entities."""
    store = TraceabilityStore(str(project_id))
    now = datetime.now().isoformat()

    existing_links = store.load_all_links()
    link_id = f"TL-{len(existing_links) + 1:04d}"

    link = {
        "id": body.get("id", link_id),
        "source_id": body.get("source_id", ""),
        "source_type": body.get("source_type", ""),
        "target_id": body.get("target_id", ""),
        "target_type": body.get("target_type", ""),
        "link_type": body.get("link_type", "traces_to"),
        "rationale": body.get("rationale", ""),
        "created_at": now,
        "created_by": body.get("created_by", ""),
    }

    if not link["source_id"] or not link["target_id"]:
        raise HTTPException(status_code=400, detail="source_id and target_id are required")

    return store.add_link(link)


@router.get("/links/{link_id}")
async def get_traceability_link(project_id: str, link_id: str):
    """Get a single traceability link by ID."""
    store = TraceabilityStore(str(project_id))
    links = store.load_all_links()
    link = next((l for l in links if l.get("id") == link_id), None)
    if not link:
        raise HTTPException(status_code=404, detail=f"Traceability link {link_id} not found")
    return link


@router.delete("/links/{link_id}")
async def delete_traceability_link(project_id: str, link_id: str):
    """Delete a traceability link by ID."""
    store = TraceabilityStore(str(project_id))
    deleted = store.delete_link(link_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Traceability link {link_id} not found")
    return {"status": "deleted", "id": link_id}


@router.get("/links/entity/{entity_id}")
async def get_links_for_entity(project_id: str, entity_id: str):
    """Get all traceability links for a specific entity (source or target)."""
    store = TraceabilityStore(str(project_id))
    return store.get_links_for_entity(entity_id)


# ============================================================
# Traceability Matrix
# ============================================================

@router.get("/matrix")
async def get_traceability_matrix(project_id: str):
    """Generate the full traceability matrix.

    Returns a matrix showing Requirements → Architecture → Verification Measures → Results.
    Each row includes traceability completeness status.
    """
    engine = TraceabilityEngine(str(project_id))
    return engine.generate_traceability_matrix()


# ============================================================
# Coverage Analysis
# ============================================================

@router.get("/coverage")
async def get_traceability_coverage(project_id: str):
    """Get traceability coverage statistics per entity type.

    Returns the percentage of each entity type that has at least one traceability link.
    """
    engine = TraceabilityEngine(str(project_id))
    return engine.get_coverage()


# ============================================================
# Gap Detection
# ============================================================

@router.get("/gaps")
async def get_traceability_gaps(project_id: str):
    """Find entities that are missing required traceability links.

    Returns a list of entities with missing links and what they should connect to.
    """
    engine = TraceabilityEngine(str(project_id))
    return engine.get_gaps()


# ============================================================
# Impact Analysis
# ============================================================

@router.get("/impact/{entity_id}")
async def get_impact_analysis(
    project_id: str,
    entity_id: str,
    entity_type: str = "",
):
    """Perform impact analysis for a given entity.

    Uses BFS traversal to find all directly and indirectly affected entities.
    Useful for understanding the impact of changing a requirement or architecture element.
    """
    engine = TraceabilityEngine(str(project_id))
    return engine.analyze_impact(entity_id, entity_type)


# ============================================================
# Chain Traversal
# ============================================================

@router.get("/chain/{entity_id}")
async def get_traceability_chain(
    project_id: str,
    entity_id: str,
    max_depth: int = 10,
):
    """Get the full traceability chain from a given entity.

    Returns all entities reachable from the given entity via traceability links,
    with depth and link type information.
    """
    store = TraceabilityStore(str(project_id))
    return store.get_traceability_chain(entity_id, max_depth=max_depth)
