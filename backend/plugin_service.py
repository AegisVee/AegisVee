"""
Plugin Service — Manages AI plugin packages (install, uninstall, status tracking).

Plugin lifecycle:
  available → downloading → installed
                           → error
"""

import os
import json
from typing import List, Optional
from models.ai_plugin import AIPlugin
from ai_providers.provider_manager import ProviderManager

PLUGINS_STATE_FILE = os.path.join("data", "ai_plugins.json")
REGISTRY_FILE = os.path.join("data", "ai_plugins_registry.json")


def _load_registry() -> List[dict]:
    """Load the built-in plugin registry."""
    if os.path.exists(REGISTRY_FILE):
        try:
            with open(REGISTRY_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return _default_registry()


def _load_plugin_state() -> dict:
    """Load installed plugin state."""
    if os.path.exists(PLUGINS_STATE_FILE):
        try:
            with open(PLUGINS_STATE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {}


def _save_plugin_state(state: dict):
    """Save plugin state to disk."""
    os.makedirs(os.path.dirname(PLUGINS_STATE_FILE), exist_ok=True)
    with open(PLUGINS_STATE_FILE, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2, ensure_ascii=False)


def _default_registry() -> List[dict]:
    """Built-in plugin catalog shipped with the app."""
    return [
        {
            "id": "ai-base-ollama",
            "name": "ai-base-ollama",
            "display_name": "Ollama Runtime",
            "type": "runtime",
            "version": "0.5.x",
            "size_mb": 200,
            "description": "Local model management with Ollama. Simplest setup for new users.",
            "hardware_requirements": {"min_ram_gb": 4, "min_vram_gb": 0, "gpu_required": False},
            "provider": "ollama",
        },
        {
            "id": "model-gemma3-4b",
            "name": "model-gemma3-4b",
            "display_name": "Gemma 3 4B",
            "type": "model",
            "version": "latest",
            "size_mb": 2500,
            "description": "Google's Gemma 3 4B — lightweight, fast, good for requirement analysis.",
            "hardware_requirements": {"min_ram_gb": 8, "min_vram_gb": 3, "gpu_required": False},
            "provider": "ollama",
        },
        {
            "id": "model-qwen25-3b",
            "name": "model-qwen25-3b",
            "display_name": "Qwen 2.5 3B",
            "type": "model",
            "version": "latest",
            "size_mb": 2000,
            "description": "Alibaba's Qwen 2.5 3B — excellent multilingual support, compact.",
            "hardware_requirements": {"min_ram_gb": 6, "min_vram_gb": 2, "gpu_required": False},
            "provider": "ollama",
        },
        {
            "id": "model-phi3-mini",
            "name": "model-phi3-mini",
            "display_name": "Phi-3 Mini",
            "type": "model",
            "version": "latest",
            "size_mb": 2300,
            "description": "Microsoft's Phi-3 Mini — strong reasoning, small footprint.",
            "hardware_requirements": {"min_ram_gb": 6, "min_vram_gb": 2, "gpu_required": False},
            "provider": "ollama",
        },
        {
            "id": "model-llama31-8b",
            "name": "model-llama31-8b",
            "display_name": "Llama 3.1 8B",
            "type": "model",
            "version": "latest",
            "size_mb": 4700,
            "description": "Meta's Llama 3.1 8B — versatile, strong coding & analysis.",
            "hardware_requirements": {"min_ram_gb": 16, "min_vram_gb": 6, "gpu_required": False},
            "provider": "ollama",
        },
        {
            "id": "model-mistral-7b",
            "name": "model-mistral-7b",
            "display_name": "Mistral 7B",
            "type": "model",
            "version": "latest",
            "size_mb": 4100,
            "description": "Mistral AI's 7B — balanced performance and speed.",
            "hardware_requirements": {"min_ram_gb": 16, "min_vram_gb": 5, "gpu_required": False},
            "provider": "ollama",
        },
        {
            "id": "vectorstore-chromadb",
            "name": "vectorstore-chromadb",
            "display_name": "ChromaDB",
            "type": "vector_store",
            "version": "0.5.x",
            "size_mb": 50,
            "description": "Local vector database for RAG — semantic document search.",
            "hardware_requirements": {"min_ram_gb": 4, "min_vram_gb": 0, "gpu_required": False},
            "provider": "",
        },
    ]


# ──────── Public API ────────

def list_plugins() -> List[dict]:
    """List all plugins with their current status (merges registry + state)."""
    registry = _load_registry()
    state = _load_plugin_state()

    plugins = []
    for entry in registry:
        plugin_id = entry["id"]
        saved = state.get(plugin_id, {})
        plugins.append({
            **entry,
            "status": saved.get("status", "available"),
            "download_progress": saved.get("download_progress", 0.0),
            "config": saved.get("config", {}),
        })
    return plugins


def get_plugin(plugin_id: str) -> Optional[dict]:
    """Get a single plugin by ID."""
    for p in list_plugins():
        if p["id"] == plugin_id:
            return p
    return None


async def install_plugin(plugin_id: str) -> dict:
    """Install a plugin. For model plugins, triggers Ollama pull."""
    state = _load_plugin_state()
    registry = {p["id"]: p for p in _load_registry()}

    if plugin_id not in registry:
        return {"error": f"Plugin {plugin_id} not found in registry"}

    entry = registry[plugin_id]

    if entry["type"] == "model" and entry.get("provider") == "ollama":
        # Map plugin ID to Ollama model name
        model_map = {
            "model-gemma3-4b": "gemma3:4b",
            "model-qwen25-3b": "qwen2.5:3b",
            "model-phi3-mini": "phi3:mini",
            "model-llama31-8b": "llama3.1:8b",
            "model-mistral-7b": "mistral:7b",
        }
        ollama_name = model_map.get(plugin_id, plugin_id)

        state[plugin_id] = {"status": "downloading", "download_progress": 0.0}
        _save_plugin_state(state)

        pm = ProviderManager.get_instance()
        provider = pm.get_provider("ollama")
        if provider:
            success = await provider.pull_model(ollama_name)
            state[plugin_id] = {
                "status": "installed" if success else "error",
                "download_progress": 1.0 if success else 0.0,
            }
        else:
            state[plugin_id] = {"status": "error", "download_progress": 0.0}
    elif entry["type"] == "runtime":
        # Runtime plugins: check if available
        state[plugin_id] = {"status": "installed", "download_progress": 1.0}
    else:
        state[plugin_id] = {"status": "installed", "download_progress": 1.0}

    _save_plugin_state(state)
    return get_plugin(plugin_id)


async def uninstall_plugin(plugin_id: str) -> dict:
    """Uninstall a plugin. For model plugins, delete from Ollama."""
    state = _load_plugin_state()
    registry = {p["id"]: p for p in _load_registry()}

    if plugin_id not in registry:
        return {"error": f"Plugin {plugin_id} not found"}

    entry = registry[plugin_id]

    if entry["type"] == "model" and entry.get("provider") == "ollama":
        model_map = {
            "model-gemma3-4b": "gemma3:4b",
            "model-qwen25-3b": "qwen2.5:3b",
            "model-phi3-mini": "phi3:mini",
            "model-llama31-8b": "llama3.1:8b",
            "model-mistral-7b": "mistral:7b",
        }
        ollama_name = model_map.get(plugin_id, plugin_id)

        pm = ProviderManager.get_instance()
        provider = pm.get_provider("ollama")
        if provider:
            await provider.delete_model(ollama_name)

    state.pop(plugin_id, None)
    _save_plugin_state(state)
    return get_plugin(plugin_id) or {"id": plugin_id, "status": "available"}
