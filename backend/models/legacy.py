"""
Legacy models preserved for backward compatibility.
These are the original v1 models from models.py.
New code should use the ASPICE-aligned models instead.
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict


class Requirement(BaseModel):
    """Legacy: Represents a system requirement (v1 format)."""
    id: str = Field(..., description="Unique identifier for the requirement (e.g., REQ-001)")
    description: str = Field(..., description="The textual description of the requirement")
    verification_method: Optional[str] = Field(None, description="How this requirement is verified")


class TestStep(BaseModel):
    """Represents a single step in a manual test case."""
    step_number: int = Field(..., description="Sequence number of the step")
    action: str = Field(..., description="Action to be performed by the tester")
    expected_result: str = Field(..., description="Expected behavior after the action")


class TestScript(BaseModel):
    """Represents a complete test case (legacy v1 format)."""
    title: str = Field(..., description="Title of the test case")
    steps: List[TestStep] = Field(..., description="List of test steps")


class StoredTestScript(BaseModel):
    """Legacy: A test script stored with parameter snapshot for propagation."""
    id: str = Field(..., description="Unique test script ID, e.g. TEST-001")
    requirement_id: str = Field(..., description="Parent requirement ID")
    type: str = Field(default="manual", description="Script type: hil | manual | ai_generated")
    title: str = Field(..., description="Title of this test script")
    content: str = Field(default="", description="Script content with {{param}} template placeholders")
    parameters_snapshot: Dict[str, str] = Field(
        default_factory=dict,
        description="Last known param values at time of creation/propagation"
    )


class CodeGeneration(BaseModel):
    """Represents generated code."""
    language: str = Field(..., description="Programming language (e.g., c, python)")
    code: str = Field(..., description="The verified code snippet")
    explanation: Optional[str] = Field(None, description="Explanation of the code logic")


class RAGResponse(BaseModel):
    """Generic structured response wrapper."""
    answer: str = Field(..., description="Direct answer to the user query")
    sources: List[str] = Field(default_factory=list, description="List of source documents used")


class RequirementAnalysis(BaseModel):
    """Analysis result of a requirement."""
    analysis: str = Field(..., description="General analysis of the requirement quality")
    score: int = Field(..., description="Quality score from 0 to 100")
    necessity_analysis: str = Field(..., description="Analysis of whether this requirement is necessary")
    necessity_score: int = Field(..., description="Necessity score from 0 to 100")
    issues: List[str] = Field(default_factory=list, description="List of specific issues found")
    improved_version: str = Field(..., description="A rewritten, improved version of the requirement")


class ImpactAnalysis(BaseModel):
    """Analysis of impact from a proposed change."""
    summary: str = Field(..., description="High-level summary of the impact")
    conflicts: List[str] = Field(..., description="List of specific conflicts")
    recommendation: str = Field(..., description="Recommendation on whether to proceed")
    risk_level: str = Field(..., description="Risk level: Low, Medium, High, Critical")
