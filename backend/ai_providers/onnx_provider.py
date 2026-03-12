"""
ONNX Runtime AI Provider — Stub for future implementation.
Microsoft's inference engine, optimized for Windows + GPU acceleration.
"""

from typing import List, AsyncIterator, Dict, Any
from .base import AIProvider, ModelInfo


class ONNXProvider(AIProvider):
    """ONNX Runtime inference provider (stub — P1 implementation)."""

    name = "onnxruntime"
    display_name = "ONNX Runtime"

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
        return "[ONNX Runtime] Provider not yet implemented. Install and configure in P1."

    async def stream(self, prompt: str, model: str = "", **kwargs) -> AsyncIterator[str]:
        yield "[ONNX Runtime] Provider not yet implemented."

    def get_status_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "display_name": self.display_name,
            "available": False,
            "note": "Coming in P1 — optimized for Windows/GPU environments",
        }
