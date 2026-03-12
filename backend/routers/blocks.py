"""
Blocks Router — System block hierarchy with Valispace-style engineering properties.

Handles:
- Block CRUD (create, read, update, delete)
- Hierarchy via parent_id
- Properties (Valis) embedded on each block
- Formula recalculation across the hierarchy
"""

from datetime import datetime
from fastapi import APIRouter, HTTPException, Body
from storage.base import GenericEntityStore

router = APIRouter(prefix="/api/projects/{project_id}", tags=["blocks"])


# ============================================================
# Helpers
# ============================================================

def _block_store(project_id: str) -> GenericEntityStore:
    return GenericEntityStore(str(project_id), "blocks")


def _next_block_id(store: GenericEntityStore) -> str:
    items = store.load_all()
    ids = [e.get("id", "") for e in items if e.get("id", "").startswith("BLK-")]
    nums = []
    for eid in ids:
        try:
            nums.append(int(eid.split("-")[1]))
        except (IndexError, ValueError):
            pass
    return f"BLK-{max(nums, default=0) + 1:04d}"


def _recalculate_block_properties(store: GenericEntityStore):
    """Recalculate all block properties using the formula engine."""
    from formula_engine import FormulaEngine

    blocks = store.load_all()
    if not blocks:
        return blocks

    engine = FormulaEngine(blocks)
    updated_blocks = engine.recalculate_all()
    store.save_all(updated_blocks)
    return updated_blocks


# ============================================================
# Block CRUD Endpoints
# ============================================================

@router.get("/blocks")
async def list_blocks(project_id: str):
    """List all blocks in the project."""
    return _block_store(project_id).load_all()


@router.post("/blocks")
async def create_block(project_id: str, body: dict = Body(...)):
    """Create a new block."""
    store = _block_store(project_id)
    now = datetime.now().isoformat()

    block = {
        "id": body.get("id") or _next_block_id(store),
        "name": body.get("name", "New Block"),
        "parent_id": body.get("parent_id", ""),
        "description": body.get("description", ""),
        "type": body.get("type", "component"),
        "properties": body.get("properties", []),
        "linked_requirement_ids": body.get("linked_requirement_ids", []),
        "created_at": now,
        "updated_at": now,
        "version": 1,
    }
    result = store.add(block)

    # Recalculate formulas if this block has properties
    if block["properties"]:
        _recalculate_block_properties(store)
        # Return the recalculated version
        return store.get_by_id(block["id"]) or result

    return result


@router.get("/blocks/{block_id}")
async def get_block(project_id: str, block_id: str):
    """Get a single block by ID."""
    store = _block_store(project_id)
    block = store.get_by_id(block_id)
    if not block:
        raise HTTPException(status_code=404, detail=f"Block {block_id} not found")
    return block


@router.put("/blocks/{block_id}")
async def update_block(project_id: str, block_id: str, body: dict = Body(...)):
    """Update a block by ID. Triggers formula recalculation."""
    store = _block_store(project_id)
    updated = store.update(block_id, body)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Block {block_id} not found")

    # Recalculate all formulas after any update (properties may have changed)
    _recalculate_block_properties(store)

    # Return the recalculated version
    return store.get_by_id(block_id) or updated


@router.delete("/blocks/{block_id}")
async def delete_block(project_id: str, block_id: str):
    """Delete a block by ID."""
    store = _block_store(project_id)
    if not store.delete(block_id):
        raise HTTPException(status_code=404, detail=f"Block {block_id} not found")

    # Recalculate after deletion (parent soc() values may change)
    _recalculate_block_properties(store)

    return {"status": "deleted", "id": block_id}


# ============================================================
# Formula Recalculation
# ============================================================

@router.post("/blocks/recalculate")
async def recalculate_blocks(project_id: str):
    """Recalculate all block property formulas in the project."""
    store = _block_store(project_id)
    updated_blocks = _recalculate_block_properties(store)
    return {"status": "recalculated", "block_count": len(updated_blocks)}


# ============================================================
# Valitype Registry
# ============================================================

@router.get("/valitypes")
async def list_valitypes(project_id: str):
    """List available Valitypes with their units and conversions."""
    from valitype_registry import VALITYPES
    return VALITYPES
