from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict
from storage import load_project_test_scripts, add_test_script, update_test_script, delete_test_script

router = APIRouter(prefix="/api/projects/{project_id}/tests", tags=["Tests"])


class TestScriptCreate(BaseModel):
    requirement_id: str
    type: str = "manual"
    title: str
    content: str = ""
    parameters_snapshot: Dict[str, str] = {}


class TestScriptUpdate(BaseModel):
    title: Optional[str] = None
    type: Optional[str] = None
    content: Optional[str] = None
    parameters_snapshot: Optional[Dict[str, str]] = None


@router.get("/")
async def get_all_test_scripts(project_id: str):
    return load_project_test_scripts(project_id)


@router.get("/requirement/{req_id}")
async def get_test_scripts_for_requirement(project_id: str, req_id: str):
    all_scripts = load_project_test_scripts(project_id)
    return [s for s in all_scripts if s.get("requirement_id") == req_id]


@router.get("/{script_id}")
async def get_test_script(project_id: str, script_id: str):
    all_scripts = load_project_test_scripts(project_id)
    script = next((s for s in all_scripts if s["id"] == script_id), None)
    if not script:
        raise HTTPException(status_code=404, detail=f"Test script {script_id} not found")
    return script


@router.post("/")
async def create_test_script(project_id: str, payload: TestScriptCreate):
    try:
        new_script = add_test_script(payload.model_dump(), project_id)
        return new_script
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{script_id}")
async def update_test_script_endpoint(project_id: str, script_id: str, payload: TestScriptUpdate):
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    updated = update_test_script(script_id, updates, project_id)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Test script {script_id} not found")
    return updated


@router.delete("/{script_id}")
async def delete_test_script_endpoint(project_id: str, script_id: str):
    success = delete_test_script(script_id, project_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Test script {script_id} not found")
    return {"status": "deleted", "id": script_id}
