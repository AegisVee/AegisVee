"""
Provider Manager — Singleton managing AI providers and per-function model routing.

Loads configuration from ai_settings.json and instantiates the appropriate providers.
Supports function-level model assignment (e.g., use model A for requirement analysis,
model B for code generation).
"""

from typing import Dict, Optional
from .base import AIProvider
from .ollama_provider import OllamaProvider
from .llamacpp_provider import LlamaCppProvider
from .onnx_provider import ONNXProvider


# Provider registry
PROVIDER_CLASSES = {
    "ollama": OllamaProvider,
    "llamacpp": LlamaCppProvider,
    "onnxruntime": ONNXProvider,
}


class ProviderManager:
    """Singleton that manages AI provider instances and function-to-model routing."""

    _instance: Optional["ProviderManager"] = None
    _providers: Dict[str, AIProvider] = {}
    _active_provider_name: str = "ollama"
    _function_mappings: Dict[str, Dict] = {}  # {function_name: {model, provider}}

    @classmethod
    def initialize(cls, settings=None):
        """Initialize the provider manager with AI settings."""
        if cls._instance is None:
            cls._instance = cls()

        if settings is None:
            # Default: just Ollama
            cls._instance._providers = {
                "ollama": OllamaProvider(),
                "llamacpp": LlamaCppProvider(),
                "onnxruntime": ONNXProvider(),
            }
            cls._instance._active_provider_name = "ollama"
            return cls._instance

        # Initialize from AISettings
        cls._instance._active_provider_name = settings.active_provider

        for pc in settings.providers:
            provider_name = pc.provider
            if provider_name == "ollama":
                cls._instance._providers["ollama"] = OllamaProvider(
                    base_url=pc.base_url or "http://localhost:11434",
                    config=pc.config,
                )
            elif provider_name == "llamacpp":
                cls._instance._providers["llamacpp"] = LlamaCppProvider(config=pc.config)
            elif provider_name == "onnxruntime":
                cls._instance._providers["onnxruntime"] = ONNXProvider(config=pc.config)

        # Ensure all providers exist (even if not in settings)
        for name, cls_ref in PROVIDER_CLASSES.items():
            if name not in cls._instance._providers:
                cls._instance._providers[name] = cls_ref()

        # Load function mappings
        for fm in settings.function_mappings:
            cls._instance._function_mappings[fm.function_name] = {
                "model": fm.model_name,
                "provider": fm.provider,
            }

        return cls._instance

    @classmethod
    def get_instance(cls) -> "ProviderManager":
        if cls._instance is None:
            cls.initialize()
        return cls._instance

    def get_active_provider(self) -> AIProvider:
        """Get the currently active provider."""
        return self._providers.get(self._active_provider_name, OllamaProvider())

    def get_provider(self, name: str) -> Optional[AIProvider]:
        """Get a specific provider by name."""
        return self._providers.get(name)

    def get_all_providers(self) -> Dict[str, AIProvider]:
        """Get all registered providers."""
        return self._providers

    def get_provider_for_function(self, function_name: str) -> tuple:
        """Get the provider and model for a specific function.

        Returns:
            (provider: AIProvider, model_name: str)
        """
        mapping = self._function_mappings.get(function_name)
        if mapping:
            provider = self._providers.get(mapping["provider"], self.get_active_provider())
            return provider, mapping["model"]
        # Fallback to active provider with default model
        return self.get_active_provider(), ""

    def set_active_provider(self, name: str) -> bool:
        """Switch the active provider."""
        if name in self._providers:
            self._active_provider_name = name
            return True
        return False

    def update_function_mapping(self, function_name: str, model_name: str, provider: str):
        """Update the model assignment for a specific function."""
        self._function_mappings[function_name] = {
            "model": model_name,
            "provider": provider,
        }
