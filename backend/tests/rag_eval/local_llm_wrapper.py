from typing import Any, List, Optional
from langchain_community.llms import Ollama
from langchain_core.language_models import BaseLLM
from langchain_core.outputs import LLMResult

class LocalOllamaWrapper(Ollama):
    """
    Wrapper for Ollama to be used with Ragas if needed, 
    or just re-using the community class directly if compatible.
    Ragas expects a LangChain LLM or specific Ragas LLM wrapper.
    """
    def __init__(self, model: str = "llama3"):
        super().__init__(model=model, base_url="http://localhost:11434")

# If Ragas requires specific 'generate' signatures or embeddings, we might need a Ragas-specific wrapper.
# For now, we assume Ragas can accept a LangChain BaseLLM.
