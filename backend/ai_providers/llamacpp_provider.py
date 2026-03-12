"""
llama.cpp AI Provider — Stub for future implementation.
High-performance C++ inference engine supporting GGUF models.
"""

from typing import List, AsyncIterator, Dict, Any
from .base import AIProvider, ModelInfo


class LlamaCppProvider(AIProvider):
    """llama.cpp inference provider (stub — P1 implementation)."""

    name = "llamacpp"
    display_name = "llama.cpp"

    def __init__(self, config: Dict = None):
        self.config = config or {}

    async def check_status(self) -> bool:
        return False

    async def list_models(self) -> List[ModelInfo]:
        return []

    async def pull_model(self, model_name: str) -> bool:
        return False

    async def delete_model(self, model_name: str) -> bool:
        return False

    async def complete(self, prompt: str, model: str = "", **kwargs) -> str:
        return "[llama.cpp] Provider not yet implemented. Install and configure in P1."

    async def stream(self, prompt: str, model: str = "", **kwargs) -> AsyncIterator[str]:
        yield "[llama.cpp] Provider not yet implemented."

    def get_status_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "display_name": self.display_name,
            "available": False,
            "note": "Coming in P1 — high-performance GGUF model support",
        }
