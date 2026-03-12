from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
import rag_service
from drawio_parser import parse_drawio, build_requirement_prompt, enrich_connections_with_labels
from storage import add_requirement

router = APIRouter(prefix="/api/projects/{project_id}/import", tags=["Import"])


class DrawioConfirmPayload(BaseModel):
    requirements: List[Dict[str, Any]]


@router.post("/drawio")
async def import_drawio(project_id: str, file: UploadFile = File(...)):
    """
    Parse a .drawio file and return AI-generated requirement drafts for each block.
    The frontend should display these for user review before calling /confirm.
    """
    if not file.filename.endswith(".drawio"):
        raise HTTPException(status_code=400, detail="Only .drawio files are accepted")

    try:
        xml_content = (await file.read()).decode("utf-8")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read file: {e}")

    try:
        parsed = parse_drawio(xml_content)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    blocks = parsed["blocks"]
    connections = enrich_connections_with_labels(blocks, parsed["connections"])

    if not blocks:
        return {"blocks": [], "connections": connections, "requirements_preview": []}

    requirements_preview = []

    for block in blocks:
        prompt = build_requirement_prompt(block, connections)

        try:
            response = await rag_service.query_engine.aquery(prompt)
            req_text = ""
            async for token in response.async_response_gen():
                req_text += token
            req_text = req_text.strip()
        except Exception:
            req_text = f"The {block['label']} shall perform its designated function."

        requirements_preview.append({
            "block_id": block["id"],
            "block_label": block["label"],
            "description": req_text,
            "testSteps": "",
            "expectedResult": "",
            "status": "Draft",
            "parameters": [],
            "linkedTestIds": [],
            "linkedApis": []
        })

    return {
        "blocks": blocks,
        "connections": connections,
        "requirements_preview": requirements_preview
    }


@router.post("/drawio/confirm")
async def confirm_drawio_import(project_id: str, payload: DrawioConfirmPayload):
    """
    Batch-import requirements confirmed by the user after draw.io parsing.
    """
    created = []
    for req_data in payload.requirements:
        if not req_data.get("description", "").strip():
            continue
        new_req = add_requirement(req_data, project_id)
        created.append(new_req)

    return {"status": "success", "imported_count": len(created), "requirements": created}
