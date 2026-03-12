"""
Architecture Router — SYS.3 ASPICE process endpoints.

Handles:
- ArchitectureElement (WP 04-06) CRUD (static + dynamic aspects)
- SpecialCharacteristic (WP 17-57) CRUD
- Canvas position persistence for @xyflow/react visualization
"""

from datetime import datetime
from fastapi import APIRouter, HTTPException, Body
from storage.base import GenericEntityStore

router = APIRouter(prefix="/api/projects/{project_id}", tags=["architecture"])


# ============================================================
# Helpers
# ============================================================

def _arch_store(project_id: str) -> GenericEntityStore:
    return GenericEntityStore(str(project_id), "architecture_elements")


def _special_store(project_id: str) -> GenericEntityStore:
    return GenericEntityStore(str(project_id), "special_characteristics")


def _next_arch_id(store: GenericEntityStore) -> str:
    items = store.load_all()
    ids = [e.get("id", "") for e in items if e.get("id", "").startswith("ARCH-")]
    nums = []
    for eid in ids:
        try:
            nums.append(int(eid.split("-")[1]))
        except (IndexError, ValueError):
            pass
    return f"ARCH-{max(nums, default=0) + 1:04d}"


def _next_sc_id(store: GenericEntityStore) -> str:
    items = store.load_all()
    return f"SC-{store.count() + 1:04d}"


# ============================================================
# ArchitectureElement (WP 04-06) Endpoints
# ============================================================

@router.get("/architecture")
async def list_architecture_elements(project_id: str):
    """List all architecture elements."""
    return _arch_store(project_id).load_all()


@router.post("/architecture")
async def create_architecture_element(project_id: str, body: dict = Body(...)):
    """Create a new architecture element."""
    store = _arch_store(project_id)
    now = datetime.now().isoformat()

    element = {
        "id": body.get("id") or _next_arch_id(store),
        "wp_id": "04-06",
        "name": body.get("name", "New Component"),
        "element_type": body.get("element_type", "component"),
        "aspect": body.get("aspect", "static"),
        "description": body.get("description", ""),
        "interfaces": body.get("interfaces", []),
        "behavior_type": body.get("behavior_type", ""),
        "behavior_data": body.get("behavior_data", {}),
        "canvas_position": body.get("canvas_position", {"x": 0, "y": 0}),
        "canvas_style": body.get("canvas_style", {}),
        "created_at": now,
        "updated_at": now,
        "version": 1,
        "created_by": body.get("created_by", ""),
    }
    return store.add(element)


@router.get("/architecture/{elem_id}")
async def get_architecture_element(project_id: str, elem_id: str):
    """Get a single architecture element by ID."""
    store = _arch_store(project_id)
    element = store.get_by_id(elem_id)
    if not element:
        raise HTTPException(status_code=404, detail=f"Architecture element {elem_id} not found")
    return element


@router.put("/architecture/{elem_id}")
async def update_architecture_element(
    project_id: str, elem_id: str, body: dict = Body(...)
):
    """Update an architecture element by ID."""
    store = _arch_store(project_id)
    updated = store.update(elem_id, body)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Architecture element {elem_id} not found")
    return updated


@router.delete("/architecture/{elem_id}")
async def delete_architecture_element(project_id: str, elem_id: str):
    """Delete an architecture element by ID."""
    store = _arch_store(project_id)
    if not store.delete(elem_id):
        raise HTTPException(status_code=404, detail=f"Architecture element {elem_id} not found")
    return {"status": "deleted", "id": elem_id}


@router.put("/architecture/{elem_id}/canvas")
async def update_canvas_position(
    project_id: str, elem_id: str, body: dict = Body(...)
):
    """Update only the canvas position/style of an architecture element.
    Used by @xyflow/react drag events.
    """
    store = _arch_store(project_id)
    updates = {}
    if "canvas_position" in body:
        updates["canvas_position"] = body["canvas_position"]
    if "canvas_style" in body:
        updates["canvas_style"] = body["canvas_style"]

    updated = store.update(elem_id, updates)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Architecture element {elem_id} not found")
    return {"id": elem_id, "canvas_position": updated.get("canvas_position"), "canvas_style": updated.get("canvas_style")}


# ============================================================
# SpecialCharacteristic (WP 17-57) Endpoints
# ============================================================

@router.get("/special-characteristics")
async def list_special_characteristics(project_id: str):
    """List all special characteristics."""
    return _special_store(project_id).load_all()


@router.post("/special-characteristics")
async def create_special_characteristic(project_id: str, body: dict = Body(...)):
    """Create a new special characteristic."""
    store = _special_store(project_id)
    now = datetime.now().isoformat()

    sc = {
        "id": body.get("id") or _next_sc_id(store),
        "wp_id": "17-57",
        "source_id": body.get("source_id", ""),
        "characteristic_type": body.get("characteristic_type", "safety"),
        "description": body.get("description", ""),
        "rationale": body.get("rationale", ""),
        "created_at": now,
        "updated_at": now,
        "version": 1,
        "created_by": body.get("created_by", ""),
    }
    return store.add(sc)


@router.get("/special-characteristics/{sc_id}")
async def get_special_characteristic(project_id: str, sc_id: str):
    store = _special_store(project_id)
    sc = store.get_by_id(sc_id)
    if not sc:
        raise HTTPException(status_code=404, detail=f"Special characteristic {sc_id} not found")
    return sc


@router.put("/special-characteristics/{sc_id}")
async def update_special_characteristic(
    project_id: str, sc_id: str, body: dict = Body(...)
):
    store = _special_store(project_id)
    updated = store.update(sc_id, body)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Special characteristic {sc_id} not found")
    return updated


@router.delete("/special-characteristics/{sc_id}")
async def delete_special_characteristic(project_id: str, sc_id: str):
    store = _special_store(project_id)
    if not store.delete(sc_id):
        raise HTTPException(status_code=404, detail=f"Special characteristic {sc_id} not found")
    return {"status": "deleted", "id": sc_id}
