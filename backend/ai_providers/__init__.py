"""
v2.0 AI Provider Abstraction Layer

Supports multiple inference backends:
- Ollama (default, recommended for new users)
- llama.cpp (advanced users, GGUF models)
- ONNX Runtime (enterprise, Windows optimization)
"""

from .provider_manager import ProviderManager

__all__ = ["ProviderManager"]
