"""
Abstract base class for AI inference providers.
All providers must implement this interface.
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, AsyncIterator, Optional
from pydantic import BaseModel


class ModelInfo(BaseModel):
    """Information about a model available from a provider."""
    name: str
    size_mb: float = 0
    parameter_size: str = ""
    quantization: str = ""
    modified_at: str = ""
    digest: str = ""
    family: str = ""


class AIProvider(ABC):
    """Abstract base for AI inference providers."""

    name: str = "base"
    display_name: str = "Base Provider"

    @abstractmethod
    async def check_status(self) -> bool:
        """Check if the provider is running and accessible."""
        ...

    @abstractmethod
    async def list_models(self) -> List[ModelInfo]:
        """List all models available from this provider."""
        ...

    @abstractmethod
    async def pull_model(self, model_name: str) -> bool:
        """Download/pull a model. Returns True on success."""
        ...

    @abstractmethod
    async def delete_model(self, model_name: str) -> bool:
        """Delete a model. Returns True on success."""
        ...

    @abstractmethod
    async def complete(self, prompt: str, model: str = "", **kwargs) -> str:
        """Generate a completion (non-streaming)."""
        ...

    @abstractmethod
    async def stream(self, prompt: str, model: str = "", **kwargs) -> AsyncIterator[str]:
        """Generate a streaming completion."""
        ...

    async def get_model_info(self, model_name: str) -> Optional[ModelInfo]:
        """Get details about a specific model."""
        models = await self.list_models()
        for m in models:
            if m.name == model_name:
                return m
        return None

    def get_status_dict(self) -> Dict[str, Any]:
        """Return provider status as a dict for API responses."""
        return {
            "name": self.name,
            "display_name": self.display_name,
            "available": False,
        }
