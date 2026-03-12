"""
v2.0 AI Settings Models — Configuration for modular AI architecture.

Supports multiple inference providers (Ollama, llama.cpp, ONNX Runtime)
and per-function model assignment.
"""

from pydantic import BaseModel, Field
from typing import List, Dict, Optional


class AIProviderConfig(BaseModel):
    """Configuration for an AI inference provider."""

    provider: str = Field(..., description="Provider name: ollama | llamacpp | onnxruntime")
    enabled: bool = Field(default=True, description="Whether this provider is active")
    base_url: str = Field(default="", description="Provider endpoint URL")
    config: Dict = Field(
        default_factory=dict,
        description="Provider-specific settings (e.g., gpu_layers, threads)"
    )


class FunctionModelMapping(BaseModel):
    """Maps an AegisVee feature to a specific model and provider."""

    function_name: str = Field(
        ...,
        description="Feature name: requirement_analysis | test_generation | rag_query | impact_analysis | code_generation"
    )
    model_name: str = Field(..., description="Model name, e.g. gemma3:4b, qwen2.5:3b")
    provider: str = Field(default="ollama", description="Provider to use for this function")


class AISettings(BaseModel):
    """Global AI settings persisted to data/ai_settings.json."""

    active_provider: str = Field(
        default="ollama",
        description="Currently active inference provider"
    )
    providers: List[AIProviderConfig] = Field(
        default_factory=lambda: [
            AIProviderConfig(
                provider="ollama",
                enabled=True,
                base_url="http://localhost:11434",
                config={}
            ),
            AIProviderConfig(
                provider="llamacpp",
                enabled=False,
                base_url="",
                config={}
            ),
            AIProviderConfig(
                provider="onnxruntime",
                enabled=False,
                base_url="",
                config={}
            ),
        ],
        description="Available inference providers"
    )
    function_mappings: List[FunctionModelMapping] = Field(
        default_factory=lambda: [
            FunctionModelMapping(function_name="requirement_analysis", model_name="gemma3:4b", provider="ollama"),
            FunctionModelMapping(function_name="test_generation", model_name="gemma3:4b", provider="ollama"),
            FunctionModelMapping(function_name="rag_query", model_name="gemma3:4b", provider="ollama"),
            FunctionModelMapping(function_name="impact_analysis", model_name="gemma3:4b", provider="ollama"),
            FunctionModelMapping(function_name="code_generation", model_name="gemma3:4b", provider="ollama"),
        ],
        description="Per-function model assignments"
    )
    models_directory: str = Field(
        default="",
        description="Custom path for model storage (empty = provider default)"
    )
    gpu_allocation: Dict = Field(
        default_factory=lambda: {"max_vram_percent": 80, "cuda_visible_devices": ""},
        description="GPU allocation settings"
    )
