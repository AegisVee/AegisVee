"""
Ollama AI Provider — wraps the Ollama REST API for model management and inference.
Default and recommended provider for new users.
"""

import httpx
import json
from typing import List, AsyncIterator, Optional, Dict, Any
from .base import AIProvider, ModelInfo


class OllamaProvider(AIProvider):
    """Ollama inference provider using the Ollama REST API."""

    name = "ollama"
    display_name = "Ollama"

    def __init__(self, base_url: str = "http://localhost:11434", config: Dict = None):
        self.base_url = base_url.rstrip("/")
        self.config = config or {}

    async def check_status(self) -> bool:
        """Check if Ollama is running."""
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                resp = await client.get(self.base_url)
                return resp.status_code == 200
        except Exception:
            return False

    async def list_models(self) -> List[ModelInfo]:
        """List models via Ollama API GET /api/tags."""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(f"{self.base_url}/api/tags")
                if resp.status_code != 200:
                    return []
                data = resp.json()
                models = []
                for m in data.get("models", []):
                    size_bytes = m.get("size", 0)
                    details = m.get("details", {})
                    models.append(ModelInfo(
                        name=m.get("name", ""),
                        size_mb=round(size_bytes / (1024 * 1024), 1),
                        parameter_size=details.get("parameter_size", ""),
                        quantization=details.get("quantization_level", ""),
                        modified_at=m.get("modified_at", ""),
                        digest=m.get("digest", "")[:12],
                        family=details.get("family", ""),
                    ))
                return models
        except Exception as e:
            print(f"[OllamaProvider] Failed to list models: {e}")
            return []

    async def pull_model(self, model_name: str) -> bool:
        """Pull a model via Ollama API POST /api/pull."""
        try:
            async with httpx.AsyncClient(timeout=None) as client:
                resp = await client.post(
                    f"{self.base_url}/api/pull",
                    json={"name": model_name, "stream": False},
                    timeout=None,
                )
                return resp.status_code == 200
        except Exception as e:
            print(f"[OllamaProvider] Failed to pull model {model_name}: {e}")
            return False

    async def delete_model(self, model_name: str) -> bool:
        """Delete a model via Ollama API DELETE /api/delete."""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.request(
                    "DELETE",
                    f"{self.base_url}/api/delete",
                    json={"name": model_name},
                )
                return resp.status_code == 200
        except Exception as e:
            print(f"[OllamaProvider] Failed to delete model {model_name}: {e}")
            return False

    async def complete(self, prompt: str, model: str = "", **kwargs) -> str:
        """Generate completion via Ollama API POST /api/generate."""
        model = model or self.config.get("default_model", "gemma3:4b")
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                resp = await client.post(
                    f"{self.base_url}/api/generate",
                    json={
                        "model": model,
                        "prompt": prompt,
                        "stream": False,
                        **kwargs,
                    },
                )
                if resp.status_code == 200:
                    return resp.json().get("response", "")
                return f"[Error] Ollama returned status {resp.status_code}"
        except Exception as e:
            return f"[Error] Ollama completion failed: {e}"

    async def stream(self, prompt: str, model: str = "", **kwargs) -> AsyncIterator[str]:
        """Stream completion via Ollama API POST /api/generate with stream=true."""
        model = model or self.config.get("default_model", "gemma3:4b")
        try:
            async with httpx.AsyncClient(timeout=None) as client:
                async with client.stream(
                    "POST",
                    f"{self.base_url}/api/generate",
                    json={
                        "model": model,
                        "prompt": prompt,
                        "stream": True,
                        **kwargs,
                    },
                ) as resp:
                    async for line in resp.aiter_lines():
                        if line:
                            try:
                                data = json.loads(line)
                                token = data.get("response", "")
                                if token:
                                    yield token
                            except json.JSONDecodeError:
                                continue
        except Exception as e:
            yield f"[Error] Ollama streaming failed: {e}"

    def get_status_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "display_name": self.display_name,
            "base_url": self.base_url,
            "available": False,  # Will be updated by async check
        }
