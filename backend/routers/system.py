import psutil
import os
import requests
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from storage import save_projects, save_project_requirements

router = APIRouter(prefix="/api/system", tags=["System"])

class SystemStats(BaseModel):
    cpu_percent: float
    memory_percent: float
    memory_used_gb: float
    memory_total_gb: float

class ModelInfo(BaseModel):
    name: str
    size_mb: float
    modified: float

MODELS_DIR = "./data/models"

# --- BE-006: Resource Monitoring ---
@router.get("/stats", response_model=SystemStats)
def get_system_stats():
    mem = psutil.virtual_memory()
    return {
        "cpu_percent": psutil.cpu_percent(interval=None),
        "memory_percent": mem.percent,
        "memory_used_gb": round(mem.used / (1024**3), 2),
        "memory_total_gb": round(mem.total / (1024**3), 2)
    }

# --- INF-001: Model Management ---
@router.get("/models", response_model=List[ModelInfo])
def list_models():
    if not os.path.exists(MODELS_DIR):
        return []
    
    models = []
    for f in os.listdir(MODELS_DIR):
        if f.endswith(".gguf") or f.endswith(".bin"): # Simple filter
            path = os.path.join(MODELS_DIR, f)
            stat = os.stat(path)
            models.append({
                "name": f,
                "size_mb": round(stat.st_size / (1024**2), 2),
                "modified": stat.st_mtime
            })
    return models

@router.post("/models/download")
async def download_model_stub(model_name: str, background_tasks: BackgroundTasks):
    """
    Stub for model download. Real implementation would probably use huggingface_hub or similar.
    For MVP, we just create a dummy file or log it.
    """
    # TODO: Implement actual download logic (resumable)
    print(f"Requested download for {model_name}")
    return {"status": "Download queued (Stub)"}

@router.get("/edition")
def get_edition_info():
    """Returns edition based on cloud sync capability (v3.0).
    Edition is no longer AI-based. All editions include AI features.
    Split is: core (local-only) vs team/enterprise (cloud sync).
    """
    import json
    settings_path = os.path.join("data", "app_settings.json")
    has_cloud_sync = False
    if os.path.exists(settings_path):
        try:
            with open(settings_path, "r", encoding="utf-8") as f:
                settings = json.load(f)
                has_cloud_sync = settings.get("cloud_sync_enabled", False)
        except Exception:
            pass

    edition = os.environ.get("AEGISVEE_EDITION", "core").lower()
    return {
        "edition": edition,
        "cloud_sync": has_cloud_sync,
        "plan": edition,
    }

@router.get("/ai-status")
def get_ai_status():
    """Checks if the local AI service (Ollama) is responding.
    v3.0: AI is always available regardless of edition.
    """
    from rag_service import check_ollama_status, HAS_LLAMA_INDEX
    if not HAS_LLAMA_INDEX:
        return {"online": False, "reason": "AI dependencies not installed"}
    is_online = check_ollama_status()
    return {"online": is_online}

# --- v2.0: Hardware Detection & GPU Monitoring ---
@router.get("/hardware")
def get_hardware_info():
    """Full hardware detection: CPU, RAM, GPU, VRAM, recommended AI tier."""
    from hardware_service import detect_hardware
    return detect_hardware().model_dump()


@router.get("/gpu-stats")
def get_gpu_stats():
    """Real-time GPU/VRAM usage stats (requires NVIDIA GPU)."""
    from hardware_service import get_gpu_stats
    return get_gpu_stats().model_dump()


class SyncPayload(BaseModel):
    projects: List[Dict[str, Any]]
    requirements: List[Dict[str, Any]]

@router.post("/sync")
async def sync_system_data(payload: SyncPayload):
    """
    Overwrites the backend state with the provided projects and requirements.
    Used for importing .aegis files.
    """
    try:
        if payload.projects:
            save_projects(payload.projects)
        # Requirements in sync payload are not project-scoped; skip for now.
        # Project-scoped requirements should be managed via /api/projects/{id}/requirements.
        return {"status": "synced", "projects": len(payload.projects), "requirements": 0}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
