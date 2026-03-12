"""
AI Settings Router — Model management, provider configuration, function mapping.

Endpoints:
  GET    /api/ai/settings           — Get current AI settings
  PUT    /api/ai/settings           — Update AI settings
  GET    /api/ai/providers          — List providers with live status
  POST   /api/ai/providers/test     — Test a provider connection
  GET    /api/ai/models             — List models from active provider
  POST   /api/ai/models/pull        — Pull/download a model
  DELETE /api/ai/models/{name}      — Delete a model
  GET    /api/ai/models/{name}/info — Get model details
  GET    /api/ai/function-mappings  — Get function-to-model mappings
  PUT    /api/ai/function-mappings  — Update function-to-model mappings
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional

from ai_settings_storage import load_ai_settings, save_ai_settings
from ai_providers.provider_manager import ProviderManager
from models.ai_settings import AISettings, FunctionModelMapping

router = APIRouter(prefix="/api/ai", tags=["AI Settings"])


# ── Settings ──────────────────────────────────────────

@router.get("/settings")
def get_ai_settings():
    """Get current AI configuration."""
    settings = load_ai_settings()
    return settings.model_dump()


@router.put("/settings")
def update_ai_settings(settings: AISettings):
    """Update and persist AI settings."""
    save_ai_settings(settings)
    # Re-initialize provider manager with new settings
    ProviderManager.initialize(settings)
    return {"status": "updated", "settings": settings.model_dump()}


# ── Providers ─────────────────────────────────────────

@router.get("/providers")
async def list_providers():
    """List all available providers with live status check."""
    pm = ProviderManager.get_instance()
    providers = pm.get_all_providers()
    result = []
    for name, provider in providers.items():
        status = provider.get_status_dict()
        status["available"] = await provider.check_status()
        result.append(status)
    return result


class ProviderTestRequest(BaseModel):
    provider: str
    base_url: Optional[str] = None


@router.post("/providers/test")
async def test_provider(req: ProviderTestRequest):
    """Test connectivity to a specific provider."""
    pm = ProviderManager.get_instance()
    provider = pm.get_provider(req.provider)
    if not provider:
        raise HTTPException(status_code=404, detail=f"Provider '{req.provider}' not found")

    # If custom base_url, temporarily update
    if req.base_url and hasattr(provider, "base_url"):
        original_url = provider.base_url
        provider.base_url = req.base_url
        available = await provider.check_status()
        provider.base_url = original_url
    else:
        available = await provider.check_status()

    return {"provider": req.provider, "available": available}


# ── Models ────────────────────────────────────────────

@router.get("/models")
async def list_models():
    """List all models from the active provider."""
    pm = ProviderManager.get_instance()
    provider = pm.get_active_provider()
    models = await provider.list_models()
    return [m.model_dump() for m in models]


class PullModelRequest(BaseModel):
    model_name: str


@router.post("/models/pull")
async def pull_model(req: PullModelRequest):
    """Pull/download a model from the active provider."""
    pm = ProviderManager.get_instance()
    provider = pm.get_active_provider()
    success = await provider.pull_model(req.model_name)
    if success:
        return {"status": "success", "model": req.model_name}
    raise HTTPException(status_code=500, detail=f"Failed to pull model '{req.model_name}'")


@router.delete("/models/{model_name:path}")
async def delete_model(model_name: str):
    """Delete a model from the active provider."""
    pm = ProviderManager.get_instance()
    provider = pm.get_active_provider()
    success = await provider.delete_model(model_name)
    if success:
        return {"status": "deleted", "model": model_name}
    raise HTTPException(status_code=500, detail=f"Failed to delete model '{model_name}'")


@router.get("/models/{model_name:path}/info")
async def get_model_info(model_name: str):
    """Get details about a specific model."""
    pm = ProviderManager.get_instance()
    provider = pm.get_active_provider()
    info = await provider.get_model_info(model_name)
    if info:
        return info.model_dump()
    raise HTTPException(status_code=404, detail=f"Model '{model_name}' not found")


# ── Function Mappings ─────────────────────────────────

@router.get("/function-mappings")
def get_function_mappings():
    """Get current function-to-model mappings."""
    settings = load_ai_settings()
    return [fm.model_dump() for fm in settings.function_mappings]


@router.put("/function-mappings")
def update_function_mappings(mappings: List[FunctionModelMapping]):
    """Update function-to-model mappings."""
    settings = load_ai_settings()
    settings.function_mappings = mappings
    save_ai_settings(settings)
    # Update runtime manager
    pm = ProviderManager.get_instance()
    for fm in mappings:
        pm.update_function_mapping(fm.function_name, fm.model_name, fm.provider)
    return {"status": "updated", "mappings": [fm.model_dump() for fm in mappings]}
