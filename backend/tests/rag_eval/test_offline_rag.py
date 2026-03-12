import pytest
import json
import os
from backend.rag_service import initialize_rag, get_index
from backend.tests.rag_eval.local_llm_wrapper import LocalOllamaWrapper
try:
    from ragas import evaluate
    from ragas.metrics import faithfulness, context_recall
    from datasets import Dataset
except ImportError:
    evaluate = None

@pytest.fixture(scope="module")
def rag_setup():
    initialize_rag()
    return get_index()

def test_rag_faithfulness(rag_setup):
    if not evaluate:
        pytest.skip("Ragas not installed")
        
    # Load Golden Dataset
    with open("backend/tests/rag_eval/golden_dataset.json", "r") as f:
        golden_data = json.load(f)
        
    questions = [item["question"] for item in golden_data]
    ground_truths = [[item["ground_truth"]] for item in golden_data]
    
    contexts = []
    answers = []
    
    query_engine = rag_setup.as_query_engine()
    
    for q in questions:
        response = query_engine.query(q)
        answers.append(response.response)
        # Extract contexts from source nodes
        ctxs = [node.node.get_content() for node in response.source_nodes]
        contexts.append(ctxs)
        
    data_dict = {
        "question": questions,
        "answer": answers,
        "contexts": contexts,
        "ground_truth": ground_truths
    }
    
    dataset = Dataset.from_dict(data_dict)
    
    # Configure Ragas to use Local LLM
    # Note: Ragas metrics often require an LLM. We pass our wrapper.
    llm = LocalOllamaWrapper()
    
    result = evaluate(
        dataset=dataset,
        metrics=[faithfulness, context_recall],
        llm=llm,
        embeddings=None # Or pass local embedding model if needed
    )
    
    print(result)
    assert result["faithfulness"] >= 0.8
    assert result["context_recall"] >= 0.8
