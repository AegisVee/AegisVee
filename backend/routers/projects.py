from fastapi import APIRouter, Request, HTTPException
from storage import load_projects, add_project, delete_project, update_project_metrics, calculate_project_analytics

router = APIRouter(prefix="/api/projects", tags=["Projects"])

@router.get("")
async def get_projects():
    projects = load_projects()
    updated_projects = []
    for p in projects:
        updated = update_project_metrics(p["id"])
        if updated:
            updated_projects.append(updated)
        else:
            updated_projects.append(p)
    return updated_projects

@router.post("")
async def create_project(request: Request):
    try:
        body = await request.json()
        if not body.get("title"):
            raise HTTPException(status_code=400, detail="Title is required")
        new_project = add_project(body)
        return new_project
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{project_id}")
async def delete_project_endpoint(project_id: str):
    success = delete_project(project_id)
    if not success:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"status": "success", "id": project_id}

@router.post("/{project_id}/metrics")
async def update_metrics(project_id: str):
    """Recalculate metrics from the project's own requirements."""
    updated_project = update_project_metrics(project_id)
    if not updated_project:
        raise HTTPException(status_code=404, detail="Project not found")
    return updated_project

@router.get("/{project_id}/analytics")
async def get_project_analytics(project_id: str):
    analytics = calculate_project_analytics(project_id)
    if not analytics:
        return {
            "qualityGate": { "testCases": 0, "passed": 0, "failed": 0 },
            "codeAnalysis": { "complexity": 1.0, "duplication": "0%", "grade": "N/A" },
            "requirements": { "total": 0, "linked": 0, "percent": 0 }
        }
    return analytics
