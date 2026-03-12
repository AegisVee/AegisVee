"""
Requirements Router — SYS.1 + SYS.2 ASPICE process endpoints.

Handles:
- RequirementNode (WP 17-00) CRUD
- RequirementAttribute (WP 17-54) CRUD
- Parameter propagation (preserved from v1)
- Excel import/export
- AI-assisted analysis (delegates to rag router)
"""

import json
import os
from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, HTTPException, Body
from fastapi.responses import JSONResponse

from storage import (
    load_project_requirements,
    save_project_requirements,
    GenericEntityStore,
    update_project_metrics,
)

router = APIRouter(prefix="/api/projects/{project_id}", tags=["requirements"])


# ============================================================
# Helper
# ============================================================

def _req_store(project_id: str) -> GenericEntityStore:
    return GenericEntityStore(str(project_id), "requirements")


def _attr_store(project_id: str) -> GenericEntityStore:
    return GenericEntityStore(str(project_id), "requirement_attributes")


def _next_req_id(requirements: list) -> str:
    ids = [r.get("id", "") for r in requirements if r.get("id", "").startswith("REQ-")]
    nums = []
    for rid in ids:
        try:
            nums.append(int(rid.split("-")[1]))
        except (IndexError, ValueError):
            pass
    next_num = max(nums, default=100) + 1
    return f"REQ-{next_num}"


# ============================================================
# RequirementNode (WP 17-00) Endpoints
# ============================================================

@router.get("/requirements")
async def list_requirements(project_id: str):
    """List all requirements for a project."""
    requirements = load_project_requirements(project_id)
    return requirements


@router.post("/requirements")
async def create_requirement(project_id: str, body: dict = Body(...)):
    """Create a new requirement."""
    store = _req_store(project_id)
    requirements = store.load_all()

    now = datetime.now().isoformat()
    req = {
        "id": body.get("id") or _next_req_id(requirements),
        "wp_id": "17-00",
        "title": body.get("title", body.get("description", "")[:80]),
        "description": body.get("description", ""),
        "req_type": body.get("req_type", body.get("type", "functional")),
        "level": body.get("level", "system"),
        "status": body.get("status", "Draft"),
        "priority": body.get("priority", "medium"),
        "functional_group": body.get("functional_group", ""),
        "variant": body.get("variant", ""),
        "release": body.get("release", ""),
        "verification_method": body.get("verification_method"),
        "test_steps": body.get("test_steps", body.get("testSteps", "")),
        "expected_result": body.get("expected_result", body.get("expectedResult", "")),
        "parameters": body.get("parameters", []),
        # v3.0: Hierarchy & metadata
        "parent_id": body.get("parent_id"),
        "tags": body.get("tags", []),
        "assignee": body.get("assignee", ""),
        "assignee_avatar": body.get("assignee_avatar", ""),
        "specification_id": body.get("specification_id", ""),
        "level_label": body.get("level_label", ""),
        # v1 compat aliases
        "key": body.get("key", str(len(requirements) + 1)),
        "linked_apis": body.get("linked_apis", body.get("linkedApis", [])),
        "linked_test_ids": body.get("linked_test_ids", body.get("linkedTestIds", [])),
        "testSteps": body.get("testSteps", body.get("test_steps", "")),
        "expectedResult": body.get("expectedResult", body.get("expected_result", "")),
        "linkedApis": body.get("linkedApis", body.get("linked_apis", [])),
        "linkedTestIds": body.get("linkedTestIds", body.get("linked_test_ids", [])),
        # Timestamps
        "created_at": now,
        "updated_at": now,
        "version": 1,
        "created_by": body.get("created_by", ""),
    }

    requirements.append(req)
    store.save_all(requirements)
    update_project_metrics(project_id)
    return req


@router.get("/requirements/{req_id}")
async def get_requirement(project_id: str, req_id: str):
    """Get a single requirement by ID."""
    store = _req_store(project_id)
    req = store.get_by_id(req_id)
    if not req:
        raise HTTPException(status_code=404, detail=f"Requirement {req_id} not found")
    return req


@router.put("/requirements/{req_id}")
async def update_requirement(project_id: str, req_id: str, body: dict = Body(...)):
    """Update a requirement by ID."""
    store = _req_store(project_id)

    # Keep v1 compat aliases in sync
    if "test_steps" in body:
        body["testSteps"] = body["test_steps"]
    if "testSteps" in body:
        body["test_steps"] = body["testSteps"]
    if "expected_result" in body:
        body["expectedResult"] = body["expected_result"]
    if "expectedResult" in body:
        body["expected_result"] = body["expectedResult"]
    if "linked_test_ids" in body:
        body["linkedTestIds"] = body["linked_test_ids"]
    if "linkedTestIds" in body:
        body["linked_test_ids"] = body["linkedTestIds"]

    updated = store.update(req_id, body)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Requirement {req_id} not found")

    update_project_metrics(project_id)
    return updated


@router.delete("/requirements/{req_id}")
async def delete_requirement(project_id: str, req_id: str):
    """Delete a requirement by ID."""
    store = _req_store(project_id)
    deleted = store.delete(req_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Requirement {req_id} not found")
    update_project_metrics(project_id)
    return {"status": "deleted", "id": req_id}


@router.post("/requirements/add")
async def add_requirement_legacy(project_id: str, body: dict = Body(...)):
    """Legacy add endpoint — delegates to create_requirement."""
    return await create_requirement(project_id, body)


# ============================================================
# v3.0: Requirement Tree (hierarchy based on parent_id)
# ============================================================

@router.get("/requirements/tree")
async def get_requirement_tree(project_id: str):
    """Returns requirements organized as a hierarchical tree based on parent_id."""
    requirements = load_project_requirements(project_id)

    # Build lookup and tree
    by_id = {r.get("id"): r for r in requirements}
    roots = []
    for req in requirements:
        req["children"] = []

    for req in requirements:
        parent = req.get("parent_id")
        if parent and parent in by_id:
            by_id[parent]["children"].append(req)
        else:
            roots.append(req)

    def count_descendants(node):
        """Recursively count all descendants."""
        total = len(node.get("children", []))
        for child in node.get("children", []):
            total += count_descendants(child)
        return total

    for req in requirements:
        req["descendant_count"] = count_descendants(req)

    return {"roots": roots, "total": len(requirements)}


# ============================================================
# Bulk Operations
# ============================================================

@router.post("/requirements/bulk")
async def bulk_import_requirements(project_id: str, body: dict = Body(...)):
    """Bulk import requirements (e.g., from draw.io or AI generation)."""
    requirements_data = body.get("requirements", [])
    store = _req_store(project_id)
    existing = store.load_all()
    now = datetime.now().isoformat()

    imported = []
    for i, req_data in enumerate(requirements_data):
        req_id = req_data.get("id") or _next_req_id(existing + imported)
        req = {
            "id": req_id,
            "wp_id": "17-00",
            "title": req_data.get("title", req_data.get("description", "")[:80]),
            "description": req_data.get("description", ""),
            "req_type": req_data.get("req_type", "functional"),
            "level": req_data.get("level", "system"),
            "status": req_data.get("status", "Draft"),
            "priority": req_data.get("priority", "medium"),
            "functional_group": req_data.get("functional_group", ""),
            "variant": req_data.get("variant", ""),
            "release": req_data.get("release", ""),
            "verification_method": req_data.get("verification_method"),
            "test_steps": req_data.get("test_steps", req_data.get("testSteps", "")),
            "expected_result": req_data.get("expected_result", req_data.get("expectedResult", "")),
            "parameters": req_data.get("parameters", []),
            "key": req_data.get("key", str(len(existing) + len(imported) + 1)),
            "linked_apis": req_data.get("linkedApis", req_data.get("linked_apis", [])),
            "linked_test_ids": req_data.get("linkedTestIds", req_data.get("linked_test_ids", [])),
            "testSteps": req_data.get("testSteps", req_data.get("test_steps", "")),
            "expectedResult": req_data.get("expectedResult", req_data.get("expected_result", "")),
            "linkedApis": req_data.get("linkedApis", req_data.get("linked_apis", [])),
            "linkedTestIds": req_data.get("linkedTestIds", req_data.get("linked_test_ids", [])),
            "created_at": now,
            "updated_at": now,
            "version": 1,
            "created_by": body.get("created_by", ""),
        }
        imported.append(req)

    all_requirements = existing + imported
    store.save_all(all_requirements)
    update_project_metrics(project_id)
    return {"imported": len(imported), "total": len(all_requirements)}

from fastapi import UploadFile, File
import pandas as pd
import io

@router.post("/requirements/import-smart")
async def import_smart_requirements(project_id: str, file: UploadFile = File(...)):
    """Smart import requirements from an unstructured Excel file using AI."""
    try:
        # 1. Read Excel using pandas
        contents = await file.read()
        df = pd.read_excel(io.BytesIO(contents))
        
        # 2. Convert to markdown table string for AI parsing
        markdown_table = df.to_markdown(index=False)
        
        # 3. Use AI to extract structured requirements
        from rag_service import query_structured
        from models import AIRequirementList
        
        prompt = (
            f"You are a Senior Systems Analyst. I am providing you with tabular data extracted from a client's Excel file.\n"
            f"Please identify and extract all system requirements from this data.\n\n"
            f"DATA:\n{markdown_table}\n\n"
            f"Extract the requirements into a structured list. If the data provides IDs, use them; "
            f"otherwise, generate a descriptive ID (e.g. 'SYS-REQ-01'). Fill out all fields logically."
        )
        
        ai_result = query_structured(prompt, AIRequirementList)
        
        if not ai_result or not ai_result.requirements:
             return JSONResponse(status_code=400, content={"error": "AI could not extract any requirements from the file."})

        # 4. Save the requirements to the project store
        store = _req_store(project_id)
        existing = store.load_all()
        now = datetime.now().isoformat()
        
        imported = []
        for req_data in ai_result.requirements:
            req_id = req_data.id or _next_req_id(existing + imported)
            req = {
                "id": req_id,
                "wp_id": "17-00",
                "title": req_data.title,
                "description": req_data.description,
                "req_type": req_data.req_type,
                "level": "system",
                "status": "Draft",
                "priority": req_data.priority,
                "functional_group": "",
                "variant": "",
                "release": "",
                "test_steps": req_data.test_steps,
                "expected_result": req_data.expected_result,
                "parameters": [],
                "key": str(len(existing) + len(imported) + 1),
                "linked_apis": [],
                "linked_test_ids": [],
                "created_at": now,
                "updated_at": now,
                "version": 1,
                "created_by": "AI Smart Import",
            }
            imported.append(req)

        all_requirements = existing + imported
        store.save_all(all_requirements)
        update_project_metrics(project_id)
        
        return {"status": "success", "imported_count": len(imported), "total": len(all_requirements), "requirements": imported}
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"error": str(e)})

# ============================================================
# RequirementAttribute (WP 17-54) Endpoints
# ============================================================

@router.get("/requirement-attributes")
async def list_requirement_attributes(project_id: str):
    """List all requirement attributes."""
    return _attr_store(project_id).load_all()


@router.post("/requirement-attributes")
async def create_requirement_attribute(project_id: str, body: dict = Body(...)):
    """Create a new requirement attribute."""
    store = _attr_store(project_id)
    now = datetime.now().isoformat()
    attr = {
        "id": body.get("id", f"ATTR-{store.count() + 1:04d}"),
        "wp_id": "17-54",
        "requirement_id": body.get("requirement_id", ""),
        "attribute_name": body.get("attribute_name", ""),
        "attribute_value": body.get("attribute_value", ""),
        "analysis_notes": body.get("analysis_notes", ""),
        "created_at": now,
        "updated_at": now,
        "version": 1,
        "created_by": body.get("created_by", ""),
    }
    return store.add(attr)


@router.get("/requirement-attributes/{attr_id}")
async def get_requirement_attribute(project_id: str, attr_id: str):
    store = _attr_store(project_id)
    attr = store.get_by_id(attr_id)
    if not attr:
        raise HTTPException(status_code=404, detail=f"Attribute {attr_id} not found")
    return attr


@router.put("/requirement-attributes/{attr_id}")
async def update_requirement_attribute(project_id: str, attr_id: str, body: dict = Body(...)):
    store = _attr_store(project_id)
    updated = store.update(attr_id, body)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Attribute {attr_id} not found")
    return updated


@router.delete("/requirement-attributes/{attr_id}")
async def delete_requirement_attribute(project_id: str, attr_id: str):
    store = _attr_store(project_id)
    if not store.delete(attr_id):
        raise HTTPException(status_code=404, detail=f"Attribute {attr_id} not found")
    return {"status": "deleted", "id": attr_id}


# ============================================================
# Parameter Propagation (preserved from v1)
# ============================================================

@router.post("/requirements/{req_id}/propagate")
async def propagate_requirement_parameters(
    project_id: str, req_id: str, body: dict = Body(...)
):
    """Propagate parameter changes to linked test scripts / verification measures.
    Preserved from v1 propagation_engine.
    """
    try:
        from engines.propagation_engine import propagate_change
        from storage import load_project_test_scripts, save_project_test_scripts
    except ImportError:
        raise HTTPException(status_code=500, detail="Propagation engine not available")

    store = _req_store(project_id)
    req = store.get_by_id(req_id)
    if not req:
        raise HTTPException(status_code=404, detail=f"Requirement {req_id} not found")

    parameters = body.get("parameters", [])
    req["parameters"] = parameters
    store.update(req_id, {"parameters": parameters})

    test_scripts = load_project_test_scripts(project_id)
    updated_req, updated_scripts = propagate_change(req, test_scripts, parameters)
    save_project_test_scripts(project_id, updated_scripts)
    store.update(req_id, updated_req)

    return {
        "requirement": updated_req,
        "updated_scripts": len([s for s in updated_scripts
                                 if s.get("requirement_id") == req_id])
    }
