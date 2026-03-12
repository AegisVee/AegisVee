"""
v2.0 AI Plugin Model — Represents a modular AI plugin package.

Plugin types:
- runtime: AI inference engine (Ollama, llama.cpp, ONNX Runtime)
- model: Language model package (Qwen2.5 3B, Phi-3 Mini, etc.)
- vector_store: Vector database (ChromaDB, Qdrant Local)
- connector: Tool integration (IBM DOORS, Jira, Simulink)
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict
from .base import BaseEntity


class AIPlugin(BaseEntity):
    """Represents an AI plugin package that can be installed/removed independently."""

    name: str = Field(..., description="Plugin identifier, e.g. ai-base-ollama, model-qwen25-3b")
    display_name: str = Field(default="", description="Human-readable plugin name")
    type: str = Field(
        ...,
        description="Plugin type: runtime | model | vector_store | connector"
    )
    version: str = Field(default="1.0.0", description="Plugin version")
    size_mb: int = Field(default=0, description="Download size in MB")
    status: str = Field(
        default="available",
        description="Plugin status: available | downloading | installed | error"
    )
    config: Dict = Field(
        default_factory=dict,
        description="Plugin-specific settings (GPU allocation, memory limits, etc.)"
    )
    description: str = Field(default="", description="Plugin description")
    hardware_requirements: Dict = Field(
        default_factory=lambda: {"min_ram_gb": 4, "min_vram_gb": 0, "gpu_required": False},
        description="Minimum hardware requirements"
    )
    download_progress: float = Field(
        default=0.0,
        description="Download progress 0.0 - 1.0"
    )
    provider: str = Field(
        default="",
        description="Associated provider name (for model plugins)"
    )
