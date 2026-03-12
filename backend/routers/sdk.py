from fastapi import APIRouter, Request
import rag_service
import os
import json

router = APIRouter(prefix="/api", tags=["SDK"])

@router.get("/sdk/metadata")
async def get_sdk_metadata():
    metadata_path = "./data/sdk_metadata.json"
    if not os.path.exists(metadata_path):
        return {"error": "SDK metadata not found. Please run parsing first."}
    
    with open(metadata_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data

@router.post("/generate-code")
async def generate_code(request: Request):
    try:
        body = await request.json()
        requirement = body.get("requirement", "")
        linked_apis = body.get("linked_apis", [])
        
        if not requirement:
            return {"error": "Requirement is required"}

        metadata_path = "./data/sdk_metadata.json"
        api_context = ""
        if os.path.exists(metadata_path) and linked_apis:
            with open(metadata_path, "r", encoding="utf-8") as f:
                all_apis = json.load(f)
                relevant_apis = [api for api in all_apis if api['name'] in linked_apis]
                
                if relevant_apis:
                    api_context = "You must use the following SDK APIs:\n"
                    for api in relevant_apis:
                        api_context += f"- {api['signature']}\n  Description: {api['description']}\n"

        prompt = f"""
You are an expert embedded C developer for the EnduroSat OBC platform (STM32H7 + FreeRTOS).
Your task is to write a C function (and necessary includes) to implement the following requirement.

Requirement: "{requirement}"

{api_context}

Rules:
1. Use FreeRTOS conventions if needed (e.g., vTaskDelay).
2. Include necessary headers based on the APIs used.
3. Provide ONLY the C code. Do not include markdown formatting like ```c ... ```.
4. Add comments explaining the logic.
"""

        response = await rag_service.query_engine.aquery(prompt)
        
        full_response = ""
        async for token in response.async_response_gen():
            full_response += token
            
        return {"code": full_response}

    except Exception as e:
        print(f"Code generation error: {e}")
        return {"error": str(e)}
