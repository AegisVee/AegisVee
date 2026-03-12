from pydantic import BaseModel, Field
from typing import List, Optional, Dict

class SignalParameter(BaseModel):
    """A named, typed signal parameter attached to a requirement"""
    name: str = Field(..., description="Parameter name used as {{name}} in templates")
    type: str = Field(default="float", description="Data type: float, int, string, bool, uint8_t, uint16_t, etc.")
    value: str = Field(..., description="Current value as string")
    unit: str = Field(default="", description="Engineering unit, e.g. km/h, ms, mW")

class StoredTestScript(BaseModel):
    """A test script stored with parameter snapshot for propagation"""
    id: str = Field(..., description="Unique test script ID, e.g. TEST-001")
    requirement_id: str = Field(..., description="Parent requirement ID")
    type: str = Field(default="manual", description="Script type: hil | manual | ai_generated")
    title: str = Field(..., description="Title of this test script")
    content: str = Field(default="", description="Script content with {{param}} template placeholders")
    parameters_snapshot: Dict[str, str] = Field(default_factory=dict, description="Last known param values at time of creation/propagation")

class Requirement(BaseModel):
    """Represents a system requirement"""
    id: str = Field(..., description="Unique identifier for the requirement (e.g., REQ-001)")
    description: str = Field(..., description="The textual description of the requirement")
    verification_method: Optional[str] = Field(None, description="How this requirement is verified (e.g., Test, Analysis)")

class TestStep(BaseModel):
    """Represents a single step in a manual test case"""
    step_number: int = Field(..., description="Sequence number of the step")
    action: str = Field(..., description="Action to be performed by the tester")
    expected_result: str = Field(..., description="Expected behavior after the action")

class TestScript(BaseModel):
    """Represents a complete test case"""
    title: str = Field(..., description="Title of the test case")
    steps: List[TestStep] = Field(..., description="List of test steps")

class CodeGeneration(BaseModel):
    """Represents generated code"""
    language: str = Field(..., description="Programming language (e.g., c, python)")
    code: str = Field(..., description="The verified code snippet")
    explanation: Optional[str] = Field(None, description="Explanation of the code logic")

class RAGResponse(BaseModel):
    """Generic structured response wrapper"""
    answer: str = Field(..., description="Direct answer to the user query")
    sources: List[str] = Field(default_factory=list, description="List of source documents used")

class RequirementAnalysis(BaseModel):
    """Analysis result of a requirement"""
    analysis: str = Field(..., description="General analysis of the requirement quality")
    score: int = Field(..., description="Quality score from 0 to 100")
    necessity_analysis: str = Field(..., description="Analysis of whether this requirement is necessary or gold-plating")
    necessity_score: int = Field(..., description="Necessity score from 0 to 100 (100 = Absolutely Essential)")
    issues: List[str] = Field(default_factory=list, description="List of specific issues found")
    improved_version: str = Field(..., description="A rewritten, improved version of the requirement")

class ImpactAnalysis(BaseModel):
    """Analysis of impact from a proposed change"""
    summary: str = Field(..., description="High-level summary of the impact and potential conflicts")
    conflicts: List[str] = Field(..., description="List of specific conflicts (e.g., Dimension mismatch, Electrical rating exceeded)")
    recommendation: str = Field(..., description="Recommendation on whether to proceed or what mitigation is needed")
    risk_level: str = Field(..., description="Risk level: Low, Medium, High, Critical")

class AIRequirement(BaseModel):
    """Extracted requirement from unstructured text"""
    id: str = Field(..., description="Extracted or generated requirement ID")
    title: str = Field(..., description="Short title")
    description: str = Field(..., description="Detailed requirement description")
    req_type: str = Field(default="functional", description="functional, non-functional, safety, etc.")
    priority: str = Field(default="medium", description="high, medium, low")
    test_steps: str = Field(default="", description="Suggested test steps")
    expected_result: str = Field(default="", description="Expected verification result")

class AIRequirementList(BaseModel):
    """List of extracted requirements"""
    requirements: List[AIRequirement]
