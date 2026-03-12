import pytest
from pydantic import ValidationError
from pydantic import ValidationError
from backend.models import Requirement, TestStep as TestStepModel, TestScript as TestScriptModel, RAGResponse

def test_requirement_valid():
    """Test creating a valid Requirement."""
    req = Requirement(id="REQ-001", description="System shall be safe")
    assert req.id == "REQ-001"
    assert req.description == "System shall be safe"
    assert req.verification_method is None

def test_requirement_invalid_missing_fields():
    """Test that missing required fields raises ValidationError."""
    with pytest.raises(ValidationError):
        Requirement(id="REQ-002")

def test_test_script_valid():
    """Test creating a valid TestScript with nested TestSteps."""
    steps = [
        TestStepModel(step_number=1, action="Press Button", expected_result="Light On"),
        TestStepModel(step_number=2, action="Release Button", expected_result="Light Off")
    ]
    script = TestScriptModel(title="Button Test", steps=steps)
    assert len(script.steps) == 2
    assert script.steps[0].action == "Press Button"

def test_rag_response_valid():
    """Test valid RAGResponse."""
    resp = RAGResponse(answer="Yes", sources=["doc1.txt"])
    assert resp.answer == "Yes"
    assert len(resp.sources) == 1

def test_llm_hallucination_prevention():
    """Simulate LLM returning extra fields (should be ignored or handled depending on config, 
    but mainly checking valid fields are enforced)."""
    # By default Pydantic V2 might ignore extra, V1 might error depending on config.
    # We just want to ensure required fields are checked.
    payload = {"id": "REQ-003", "description": "Test", "extra_field": "hallucinated"}
    req = Requirement(**payload)
    assert req.id == "REQ-003"
    assert not hasattr(req, "extra_field")
