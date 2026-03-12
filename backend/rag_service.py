# backend/rag_service.py
import os
import httpx
import shutil
import json
from typing import Type, TypeVar, List
from pydantic import BaseModel
from logging_service import LoggingService

try:
    from models import Requirement, TestScript, CodeGeneration, RAGResponse, RequirementAnalysis, ImpactAnalysis, AIRequirementList, AIRequirement
except ImportError as e:
    from .models import Requirement, TestScript, CodeGeneration, RAGResponse, RequirementAnalysis, ImpactAnalysis, AIRequirementList, AIRequirement

T = TypeVar("T", bound=BaseModel)


# Global flags
is_initialized = False
HAS_LLAMA_INDEX = False

# Lazy-loaded modules (placeholders)
VectorStoreIndex = None
SimpleDirectoryReader = None
StorageContext = None
LanceDBVectorStore = None
Ollama = None
OllamaEmbedding = None
lancedb = None

# ... (Previous constants remain)
DATA_DIR = "./data"
LANCE_DB_URI = "./lancedb" # Local persistent path
TABLE_NAME = "aegis_vee"

# ... (MockQueryEngine and check_ollama_status remain)
# Mock implementation (Defined globally for reuse)
class MockQueryEngine:
    async def aquery(self, prompt):
        class MockResponse:
            async def async_response_gen(self):
                yield "// [MOCK] Code Generation (Ollama not accessible)\n"
                yield "// Using fallback mock service.\n"
                yield "\n"
                yield "void generated_function(void) {\n"
                yield "    // Requirement: " + (prompt.split('Requirement: "')[1].split('"')[0] if 'Requirement: "' in prompt else "Generic Request") + "\n"
                yield "    // This is a placeholder response.\n"
                yield "}\n"
        return MockResponse()

def check_ollama_status(url="http://localhost:11434"):
    """Check if Ollama is running"""
    try:
        response = httpx.get(url, timeout=2)
        return response.status_code == 200
    except:
        return False

# Global variables
index = None
query_engine = None
vector_store = None
storage_context = None
llm_instance = None # Store LLM instance for direct calls

def initialize_rag():
    global index, query_engine, vector_store, storage_context, llm_instance, is_initialized, HAS_LLAMA_INDEX
    global VectorStoreIndex, SimpleDirectoryReader, StorageContext, LanceDBVectorStore, Ollama, OllamaEmbedding, lancedb
    
    logger = LoggingService.get_instance()

    if is_initialized:
        logger.info("rag", "RAG service already initialized.")
        return

    logger.info("rag", "Initializing RAG service...")
    
    try:
        from llama_index.core import VectorStoreIndex, SimpleDirectoryReader, StorageContext
        from llama_index.vector_stores.lancedb import LanceDBVectorStore
        from llama_index.llms.ollama import Ollama
        from llama_index.embeddings.ollama import OllamaEmbedding
        import lancedb
        HAS_LLAMA_INDEX = True
    except ImportError as e:
        HAS_LLAMA_INDEX = False
        logger.warn("rag", f"RAG dependencies not found ({e}). Using mock RAG service.")

    use_mock = True

    if HAS_LLAMA_INDEX:
        if check_ollama_status():
            logger.info("rag", "Ollama found. Initializing real RAG service with LanceDB...")
            try:
                # 1. 初始化模型 — use ProviderManager settings if available
                model_name = "gemma3:4b"  # default fallback
                try:
                    from ai_providers.provider_manager import ProviderManager
                    pm = ProviderManager.get_instance()
                    provider, pm_model = pm.get_provider_for_function("rag_query")
                    if pm_model:
                        model_name = pm_model
                        logger.info("rag", f"Using model from ProviderManager: {model_name}")
                except Exception as pm_err:
                    logger.warn("rag", f"ProviderManager not available, using default model: {pm_err}")

                llm = Ollama(
                    model=model_name,
                    request_timeout=60.0,
                    context_window=4096,
                    temperature=0.1,
                    additional_kwargs={"num_ctx": 4096}
                )
                llm_instance = llm # Save for structured calls
                
                embed_model = OllamaEmbedding(
                    model_name="nomic-embed-text",
                    base_url="http://localhost:11434",
                )
                
                # ... (Database init remains same)
                
                # 2. 初始化向量資料庫 (LanceDB)
                vector_store = LanceDBVectorStore(
                    uri=LANCE_DB_URI, 
                    table_name=TABLE_NAME,
                    nprobes=20 
                )
                storage_context = StorageContext.from_defaults(vector_store=vector_store)

                # Check if table exists to decide between loading or creating
                try:
                    db = lancedb.connect(LANCE_DB_URI)
                    table_exists = TABLE_NAME in db.table_names()
                except:
                    table_exists = False

                if table_exists:
                    logger.info("rag", f"Loading existing index from LanceDB ({LANCE_DB_URI})...")
                    index = VectorStoreIndex.from_vector_store(
                        vector_store,
                        storage_context=storage_context,
                        embed_model=embed_model
                    )
                else:
                    logger.info("rag", "Creating new index from ./data documents...")
                    if not os.path.exists(DATA_DIR):
                        os.makedirs(DATA_DIR)
                    documents = SimpleDirectoryReader(DATA_DIR).load_data()
                    index = VectorStoreIndex.from_documents(
                        documents,
                        storage_context=storage_context,
                        embed_model=embed_model
                    )
                
                query_engine = index.as_query_engine(llm=llm, streaming=True)
                use_mock = False
            except Exception as e:
                logger.error("rag", f"Error initializing RAG: {e}. Falling back to Mock.")
                import traceback
                traceback.print_exc()
        else:
            logger.warn("rag", "Ollama not running. Using Mock RAG service.")
    
    if use_mock:
        query_engine = MockQueryEngine()
        
    is_initialized = True
    logger.info("rag", "RAG service initialization completed.")

def get_index():
    return index

def query_structured(prompt: str, response_model: Type[T]) -> T:
    """
    Generate a structured response using the Pydantic model.
    Encapsulates the 'Structured Output' logic.
    """
    global llm_instance, is_initialized
    
    if not is_initialized:
        print("Warning: RAG not initialized yet. Returning fallback.")
        pass # Fall through to mock logic below
    
    if not llm_instance:
        # Fallback or error if mock
        print("Warning: LLM not initialized. Returning mock structured data.")
        # Simple mock fallback based on expected models
        if response_model.__name__ == 'TestScript':
            # Create dummy test script
            from models import TestStep
            return response_model(
                title="[MOCK] AI Generated Test Plan",
                steps=[
                    TestStep(step_number=1, action="Verify system initialization", expected_result="System starts without errors"),
                    TestStep(step_number=2, action="Inject simulated input", expected_result="System responds within 50ms"),
                    TestStep(step_number=3, action="Check safety constraints", expected_result="Safety locks active")
                ]
            )
        elif response_model.__name__ == 'Requirement':
             return response_model(id="MOCK-001", description="Mock requirement", verification_method="Test")
        elif response_model.__name__ == 'RequirementAnalysis':
             return response_model(
                 analysis="Mock analysis: Requirement is vague.",
                 score=50,
                 necessity_analysis="Mock necessity: Implementation seems standard.",
                 necessity_score=80,
                 issues=["Ambiguous terms", "No criteria"],
                 improved_version="The system shall [specific action] within [limit]ms."
             )
        elif response_model.__name__ == 'ImpactAnalysis':
             return response_model(
                 summary="Mock Impact Analysis: Potential conflict detected.",
                 conflicts=["Mock Conflict: Dimension mismatch"],
                 recommendation="Mock Recommendation: Review mechanical constraints.",
                 risk_level="Medium"
             )
        elif response_model.__name__ == 'AIRequirementList':
             from models import AIRequirement
             return response_model(
                 requirements=[
                     AIRequirement(
                         id="MOCK-REQ-001",
                         title="Mock Extracted Requirement",
                         description="The system shall provide a mock fallback when the LLM is offline.",
                         req_type="functional",
                         priority="high",
                         test_steps="1. Turn off LLM\n2. Trigger smart import\n3. Verify mock is returned",
                         expected_result="Mock requirement is successfully saved"
                     )
                 ]
             )
        
        raise RuntimeError("LLM not initialized for structured output")
        
    # Construct schema hint
    schema_json = json.dumps(response_model.model_json_schema(), indent=2)
    full_prompt = (
        f"{prompt}\n\n"
        f"--------------------------------------------------\n"
        f"REQUIREMENTS:\n"
        f"1. You MUST output a Valid JSON Object that matches the schema below.\n"
        f"2. Do NOT output the schema itself. Output the DATA instance.\n"
        f"3. Do NOT wrap in markdown code blocks if possible, or use ```json ... ```.\n"
        f"4. Ensure all required fields are present.\n"
        f"--------------------------------------------------\n"
        f"JSON SCHEMA:\n"
        f"{schema_json}\n\n"
        f"RESPONSE:"
    )
    
    # We use complete() specifically for this, maybe needing a separate instance if parameters conflict
    # Check if we can override output format
    response = llm_instance.complete(full_prompt, formatted=True) 
    
    text = response.text
    # Attempt to clean markdown json blocks
    if "```json" in text:
        text = text.split("```json")[1].split("```")[0]
    elif "```" in text:
        text = text.split("```")[1].split("```")[0]
        
    try:
        # Debug print to see what we got if it fails (will be caught by caller usually, but good for logs)
        print(f"[DEBUG] LLM Raw Output: {text[:200]}...") 
        return response_model.model_validate_json(text.strip())
    except Exception as e:
        print(f"Failed to parse structured JSON. Raw text:\n{text}")
        raise e

# ... (Keep refresh_index same)
def refresh_index():
    """強制重新建立索引"""
    global index, query_engine, vector_store, storage_context
    
    if isinstance(query_engine, MockQueryEngine):
        print("Cannot check index in Mock mode. Starting fresh init...")
        initialize_rag()
        if isinstance(query_engine, MockQueryEngine):
             print("Still in mock mode.")
             return True

    print("Refreshing index...")
    try:
        db = lancedb.connect(LANCE_DB_URI)
        if TABLE_NAME in db.table_names():
            db.drop_table(TABLE_NAME)
    except Exception as e:
        print(f"Error cleaning up table for refresh: {e}")

    initialize_rag()
    return True

def analyze_requirement_text(text: str) -> RequirementAnalysis:
    """
    Analyzes a single requirement text for quality and improvements.
    """
    prompt = (
        f"You are a Senior Systems Engineer (INCOSE CSEP). Analyze the following requirement text using ISO 29148 standards.\n"
        f"Requirement Text: \"{text}\"\n\n"
        f"Provide:\n"
        f"1. A general analysis of its quality (clarity, measurability, testability).\n"
        f"2. A quality score (0-100).\n"
        f"3. A 'Necessity Assessment'. Determine if this requirement is Essential, Value-Added, or Gold-Plating/Unnecessary.\n"
        f"   - Essential: Critical for system function or safety.\n"
        f"   - Value-Added: Useful but not critical.\n"
        f"   - Gold-Plating: purely aesthetic or unnecessary complexity without business value.\n"
        f"4. A necessity score (0-100). (0=Completely Useless, 100=Absolutely Mission Critical).\n"
        f"5. A list of specific issues (ambiguity, passive voice, etc.).\n"
        f"6. An improved, rewritten version following 'The [Actor] shall [Action] [Object] [Constraint]' pattern."
    )
    
    return query_structured(prompt, RequirementAnalysis)

def analyze_impact(target_element: str, change_description: str, related_contexts: List[str] = []) -> ImpactAnalysis:
    """
    Analyzes the impact of a proposed change on a system element.
    """
    context_str = "\n".join(related_contexts)
    prompt = (
        f"You are a Senior Systems Engineer. A change is proposed for the system.\n"
        f"Target Element: {target_element}\n"
        f"Proposed Change: {change_description}\n"
        f"--------------------------------------------------\n"
        f"RELATED CONTEXT & REQUIREMENTS:\n"
        f"{context_str}\n"
        f"--------------------------------------------------\n"
        f"Analyze the potential impact, conflicts, and risks of this change.\n"
        f"Consider mechanical, electrical, thermal, and software constraints.\n"
        f"Provide a structured analysis with summary, specific conflicts, recommendation, and overall risk level."
    )
    
    return query_structured(prompt, ImpactAnalysis)

# Initialize on module load
# Initialize on module load - REMOVED for lazy loading
# initialize_rag()
