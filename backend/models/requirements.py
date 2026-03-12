"""
ASPICE Work Products for Requirements (SYS.1 + SYS.2)
- RequirementNode (WP 17-00)
- RequirementAttribute (WP 17-54)
- SignalParameter (legacy support)
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from .base import BaseEntity


class SignalParameter(BaseModel):
    """A named, typed signal parameter attached to a requirement.
    Preserved from v1 for backward compatibility and template propagation.
    """
    name: str = Field(..., description="Parameter name used as {{name}} in templates")
    type: str = Field(default="float", description="Data type: float, int, string, bool, uint8_t, uint16_t, etc.")
    value: str = Field(..., description="Current value as string")
    unit: str = Field(default="", description="Engineering unit, e.g. km/h, ms, mW")


class EngineeringValue(BaseModel):
    """Valispace-style engineering value (Vali).

    Named numeric parameters with formulas, units, auto-calculation through hierarchy.
    Supports margin calculations and value types (numeric, date, text, matrix).
    """
    id: str = Field(default="", description="Value ID, auto-generated if empty")
    name: str = Field(default="", description="Value name, e.g. 'maximum_fan_mass'")
    formula: str = Field(default="", description="Formula, e.g. '50' or '$Motor.Mass + $Propeller.Mass'")
    value: float = Field(default=0.0, description="Computed numeric value")
    unit: str = Field(default="", description="Engineering unit, e.g. 'g', 'W', 'dB'")
    display_unit: str = Field(default="", description="Optional display conversion unit")
    margin_percent: float = Field(default=0.0, description="Margin %, e.g. 10 → worst case = value * 1.1")
    worst_case: float = Field(default=0.0, description="Computed worst-case value with margin")
    tags: List[str] = Field(default_factory=list, description="Tags, e.g. ['measurement', 'review:approved']")
    vali_type: str = Field(default="vali", description="Value type: vali | datevali | textvali | matrix")


class RequirementNode(BaseEntity):
    """ASPICE WP 17-00 — System/Stakeholder Requirement.

    Covers both SYS.1 (stakeholder requirements) and SYS.2 (system requirements).
    Preserves all v1 fields (key, description, testSteps, expectedResult, linkedApis,
    parameters, linkedTestIds) for backward compatibility.
    """
    wp_id: str = Field(default="17-00", description="ASPICE work product ID")

    # Core fields
    title: str = Field(default="", description="Short title / summary")
    description: str = Field(default="", description="Full requirement text with {{param}} templates")
    req_type: str = Field(
        default="functional",
        description="Requirement type: functional | non_functional | interface | constraint | test_generation"
    )
    level: str = Field(
        default="system",
        description="Requirement level: stakeholder | system"
    )
    status: str = Field(
        default="Draft",
        description="Lifecycle status: Draft | Review | Approved | Verified | Rejected"
    )
    priority: str = Field(
        default="medium",
        description="Priority: critical | high | medium | low"
    )

    # v2.0: Formal requirements mode (DevelopAir-inspired)
    formal_mode: bool = Field(
        default=False,
        description="Enable formal requirement mode (restricted NL + FSM)"
    )
    formal_expression: str = Field(
        default="",
        description="Formal requirement expression (Rely-style restricted natural language)"
    )
    coverage_target: str = Field(
        default="",
        description="Coverage target: SC | DC | MC/DC | Boundary"
    )

    # BGB SYS.2.RL.4: Multi-dimensional classification
    functional_group: str = Field(default="", description="Functional grouping")
    variant: str = Field(default="", description="Product variant")
    release: str = Field(default="", description="Target release")

    # Verification hints (carried from v1)
    verification_method: Optional[str] = Field(
        None, description="How this requirement is verified: Test | Analysis | Inspection | Review"
    )
    test_steps: str = Field(default="", description="Test steps (v1 compat: testSteps)")
    expected_result: str = Field(default="", description="Expected result (v1 compat: expectedResult)")

    # Signal parameters for template propagation
    parameters: List[SignalParameter] = Field(default_factory=list)

    # v3.0: Hierarchy & metadata
    parent_id: Optional[str] = Field(None, description="Parent requirement ID for hierarchy")
    tags: List[str] = Field(default_factory=list, description="Tags: Released, Assumption, Stage 1, etc.")
    assignee: str = Field(default="", description="Assigned user name/email")
    assignee_avatar: str = Field(default="", description="Avatar URL or initials")
    specification_id: str = Field(default="", description="v3.0: Owning specification")
    level_label: str = Field(default="", description="e.g. 'Level 2 (Sub-System)'")

    # v3.0: Engineering Values (Valispace-style)
    engineering_values: List[EngineeringValue] = Field(default_factory=list, description="Valispace-style named engineering values with formulas")

    # v1 compatibility fields
    key: str = Field(default="", description="Legacy table row key")
    linked_apis: List[str] = Field(default_factory=list, description="Legacy: linked API IDs")
    linked_test_ids: List[str] = Field(default_factory=list, description="Legacy: linked test script IDs")


class RequirementAttribute(BaseEntity):
    """ASPICE WP 17-54 — Requirement Attribute.

    Records analysis results and metadata for a requirement.
    Supports BGB SYS.2.RL.7 (tool-based attribute recording).
    """
    wp_id: str = Field(default="17-54", description="ASPICE work product ID")
    requirement_id: str = Field(..., description="Parent RequirementNode ID")
    attribute_name: str = Field(
        ..., description="Attribute name: verifiability | clarity | completeness | consistency | feasibility | priority | risk"
    )
    attribute_value: str = Field(default="", description="Attribute value or assessment")
    analysis_notes: str = Field(default="", description="Analysis notes / rationale (BGB SYS.2.RL.7)")
    score: Optional[int] = Field(None, description="Numeric score (0-100) if applicable")

class AIRequirement(BaseModel):
    """Extracted requirement from unstructured text (AI Import)"""
    id: str = Field(..., description="Extracted or generated requirement ID")
    title: str = Field(..., description="Short title")
    description: str = Field(..., description="Detailed requirement description")
    req_type: str = Field(default="functional", description="functional, non-functional, safety, etc.")
    priority: str = Field(default="medium", description="high, medium, low")
    test_steps: str = Field(default="", description="Suggested test steps")
    expected_result: str = Field(default="", description="Expected verification result")

class AIRequirementList(BaseModel):
    """List of extracted requirements (AI Import)"""
    requirements: List[AIRequirement]
