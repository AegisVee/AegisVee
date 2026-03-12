from fastapi import APIRouter, Request, UploadFile, File, BackgroundTasks, HTTPException
from sse_starlette.sse import EventSourceResponse
import rag_service
from rag_service import refresh_index, analyze_requirement_text
from storage import (
    load_project_requirements, save_project_requirements, add_requirement,
    load_project_test_scripts, save_project_test_scripts
)
from propagation_engine import propagate_change
from pydantic import BaseModel
from typing import List, Dict, Any
import shutil
import os
import json

router = APIRouter(prefix="/api", tags=["RAG"])


# ============================================================
# RAG / AI endpoints (global, not project-scoped)
# ============================================================

@router.post("/rag/stream")
async def stream_rag(request: Request):
    try:
        body = await request.json()
        query_text = body.get("query", "")
    except Exception:
        return {"error": "Invalid body"}

    if not query_text:
        return {"error": "Query is required"}

    try:
        streaming_response = await rag_service.query_engine.aquery(query_text)
    except Exception as e:
        print(f"Query engine error: {e}")
        async def err_gen():
            yield {"event": "error", "data": "Backend error: " + str(e)}
        return EventSourceResponse(err_gen())

    async def event_generator():
        try:
            async for token in streaming_response.async_response_gen():
                if await request.is_disconnected():
                    break
                yield {"event": "message", "data": json.dumps(token)}
            yield {"event": "end", "data": ""}
        except Exception as e:
            print(f"Streaming error: {e}")
            yield {"event": "error", "data": str(e)}

    return EventSourceResponse(event_generator())


class RequirementPayload(BaseModel):
    text: str

@router.post("/rag/analyze")
async def analyze_requirement(payload: RequirementPayload):
    try:
        result = analyze_requirement_text(payload.text)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ingest")
async def ingest_file(file: UploadFile = File(...)):
    file_location = f"./data/{file.filename}"
    if not os.path.exists("./data"):
        os.makedirs("./data")
    with open(file_location, "wb+") as file_object:
        shutil.copyfileobj(file.file, file_object)
    return {"info": f"File '{file.filename}' saved. Please restart backend or trigger train to index."}


@router.post("/train")
async def train_model(background_tasks: BackgroundTasks):
    background_tasks.add_task(refresh_index)
    return {"status": "Training started", "message": "The model is learning from new documents..."}


# ============================================================
# Legacy global requirement endpoints (kept for backward compat)
# ============================================================

@router.get("/rag/requirements")
async def get_requirements_legacy():
    """Legacy: returns empty list. Use /api/projects/{id}/requirements instead."""
    return []


@router.post("/rag/requirements")
async def update_requirements_legacy(request: Request):
    """Legacy: no-op. Use project-scoped endpoints instead."""
    return {"error": "Deprecated. Use /api/projects/{project_id}/requirements"}


# ============================================================
# Project-scoped Requirements endpoints
# ============================================================

@router.get("/projects/{project_id}/requirements")
async def get_project_requirements(project_id: str):
    return load_project_requirements(project_id)


@router.post("/projects/{project_id}/requirements")
async def save_project_requirements_endpoint(project_id: str, request: Request):
    try:
        reqs = await request.json()
        save_project_requirements(project_id, reqs)
        return {"status": "success"}
    except Exception as e:
        return {"error": str(e)}


@router.post("/projects/{project_id}/requirements/add")
async def create_project_requirement(project_id: str, request: Request):
    try:
        body = await request.json()
        new_req = add_requirement(body, project_id)
        return new_req
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/projects/{project_id}/requirements/import")
async def import_project_requirements(project_id: str, file: UploadFile = File(...)):
    try:
        import pandas as pd
        import io

        contents = await file.read()
        df = pd.read_excel(io.BytesIO(contents))

        required_columns = ["id", "description", "testSteps", "expectedResult", "status"]
        if not all(col in df.columns for col in required_columns):
            return {"error": f"Missing required columns. Expected: {required_columns}"}

        current_reqs = load_project_requirements(project_id)
        current_map = {r["id"]: r for r in current_reqs}

        count = 0
        for _, row in df.iterrows():
            req_id = str(row["id"])
            if pd.isna(req_id):
                continue

            new_req = {
                "key": str(len(current_map) + 1) if req_id not in current_map else current_map[req_id]["key"],
                "id": req_id,
                "description": str(row["description"]) if not pd.isna(row["description"]) else "",
                "testSteps": str(row["testSteps"]) if not pd.isna(row["testSteps"]) else "",
                "expectedResult": str(row["expectedResult"]) if not pd.isna(row["expectedResult"]) else "",
                "status": str(row["status"]) if not pd.isna(row["status"]) else "Pending",
                "linkedApis": current_map.get(req_id, {}).get("linkedApis", []),
                "parameters": current_map.get(req_id, {}).get("parameters", []),
                "linkedTestIds": current_map.get(req_id, {}).get("linkedTestIds", [])
            }
            current_map[req_id] = new_req
            count += 1

        save_project_requirements(project_id, list(current_map.values()))
        return {"status": "success", "imported_count": count}

    except Exception as e:
        print(f"Import error: {e}")
        return {"error": str(e)}


@router.get("/projects/{project_id}/requirements/export")
async def export_project_requirements(project_id: str):
    try:
        import pandas as pd
        from fastapi.responses import StreamingResponse
        import io

        reqs = load_project_requirements(project_id)
        df = pd.DataFrame(reqs)

        export_columns = ["id", "description", "testSteps", "expectedResult", "status"]
        final_cols = [c for c in export_columns if c in df.columns]
        df = df[final_cols] if final_cols else df

        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False)
        output.seek(0)

        headers = {'Content-Disposition': f'attachment; filename="requirements_project_{project_id}.xlsx"'}
        return StreamingResponse(output, headers=headers, media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')

    except Exception as e:
        print(f"Export error: {e}")
        return {"error": str(e)}


# ============================================================
# Project-scoped Propagation
# ============================================================

class PropagatePayload(BaseModel):
    parameters: List[Dict[str, Any]]

@router.post("/projects/{project_id}/requirements/{req_id}/propagate")
async def propagate_project_requirement(project_id: str, req_id: str, payload: PropagatePayload):
    try:
        requirements = load_project_requirements(project_id)
        test_scripts = load_project_test_scripts(project_id)

        result = propagate_change(
            req_id=req_id,
            new_param_list=payload.parameters,
            requirements=requirements,
            test_scripts=test_scripts
        )

        save_project_requirements(project_id, requirements)
        if result["updated_test_scripts"]:
            save_project_test_scripts(project_id, test_scripts)

        return {
            "status": "success",
            "summary": result["summary"],
            "updated_requirement_fields": [r["id"] for r in result["updated_requirements"]],
            "updated_test_scripts": [s["id"] for s in result["updated_test_scripts"]]
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
