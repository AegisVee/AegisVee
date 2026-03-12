"""
ASPICE Work Products for Verification (SYS.4 + SYS.5)
- VerificationMeasure (WP 08-60)
- VerificationMeasureSelectionSet (WP 08-58)
"""

from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from .base import BaseEntity


class VerificationMeasure(BaseEntity):
    """ASPICE WP 08-60 — Verification Measure.

    Defines a verification activity (test, analysis, inspection, review, simulation).
    Unifies the legacy TestScript concept with ASPICE verification structure.
    Supports both SYS.4 (integration verification) and SYS.5 (system verification).
    """
    wp_id: str = Field(default="08-60", description="ASPICE work product ID")

    # Core fields
    title: str = Field(..., description="Verification measure title")
    technique: str = Field(
        default="test",
        description="Verification technique: test | analysis | inspection | review | simulation"
    )
    pass_criteria: str = Field(default="", description="Pass/fail criteria")
    conditions: str = Field(default="", description="Pre-conditions and constraints")
    environment: str = Field(
        default="",
        description="Execution environment: HIL | SIL | bench | field | desktop"
    )

    # SYS.4 vs SYS.5 distinction
    measure_type: str = Field(
        default="integration",
        description="Verification level: integration (SYS.4) | system (SYS.5)"
    )

    # Script content (legacy TestScript compatibility)
    script_type: str = Field(
        default="manual",
        description="Script type: manual | hil | automated | exploratory (BGB SYS.4.RL.3)"
    )
    content: str = Field(
        default="",
        description="Script content with {{param}} template placeholders"
    )
    parameters_snapshot: Dict[str, str] = Field(
        default_factory=dict,
        description="Last known param values at time of creation/propagation"
    )

    # Legacy compatibility fields
    requirement_id: str = Field(default="", description="Legacy: parent requirement ID")


class VerificationMeasureSelectionSet(BaseEntity):
    """ASPICE WP 08-58 — Verification Measure Selection Set.

    Groups verification measures for a specific release or regression cycle.
    Supports BGB SYS.4.RL.1 (entry/exit criteria for selection sets).
    """
    wp_id: str = Field(default="08-58", description="ASPICE work product ID")

    title: str = Field(..., description="Selection set title")
    measure_ids: List[str] = Field(
        default_factory=list,
        description="List of VerificationMeasure IDs in this set"
    )

    # BGB SYS.4.RL.1: Entry/Exit criteria
    entry_criteria: str = Field(default="", description="Conditions that must be met before execution")
    exit_criteria: str = Field(default="", description="Conditions that define completion")

    # Selection context
    release_scope: str = Field(default="", description="Target release scope")
    regression_strategy: str = Field(
        default="",
        description="Regression testing strategy for this set"
    )
    selection_rationale: str = Field(default="", description="Rationale for measure selection")


# ============================================================
# v3.0: Test Run & Test Step (Flow-style test execution)
# ============================================================

class TestStep(BaseModel):
    """A single step within a test run execution."""
    id: str = Field(default="", description="Step ID")
    title: str = Field(default="", description="Step title / instruction")
    expected_result: str = Field(default="", description="Expected outcome")
    status: str = Field(default="pending", description="Step status: pending | pass | fail | na")
    actual_result: str = Field(default="", description="Actual result observed")
    notes: str = Field(default="", description="Additional notes")


class TestRun(BaseModel):
    """A test run execution record (Flow-style).

    Records a single execution of a test case / verification measure,
    with step-by-step results and overall status.
    """
    id: str = Field(default="", description="Test run ID, e.g. 'TR-0001'")
    test_case_id: str = Field(default="", description="Parent test case / verification measure ID")
    run_number: int = Field(default=1, description="Sequential run number")
    owner: str = Field(default="", description="Person executing the test")
    status: str = Field(default="pending", description="Overall status: pending | pass | fail | partial | blocked")
    steps: List[TestStep] = Field(default_factory=list, description="Step-by-step execution results")
    notes: str = Field(default="", description="Overall run notes")
    created_at: str = Field(default="", description="ISO timestamp when run was created")
    completed_at: str = Field(default="", description="ISO timestamp when run was completed")
    progress: float = Field(default=0.0, description="Completion percentage 0-100")


# ============================================================
# v3.0: V&V Rules (Valispace-style automated verification)
# ============================================================

class VnVRule(BaseModel):
    """Valispace-style V&V verification rule.

    Compares requirement engineering values against system block values
    using formula-based rules. Automatically evaluates to verified/not_verified.
    """
    id: str = Field(default="", description="Rule ID, e.g. 'VVR-0001'")
    requirement_id: str = Field(default="", description="Linked requirement ID")
    block_id: str = Field(default="", description="Linked system block / architecture element ID")
    title: str = Field(default="", description="Rule title / description")
    formula: str = Field(default="", description="Verification formula, e.g. '$Valifan.Mass < $REQ.maximum_fan_mass'")
    operator: str = Field(default="<", description="Comparison operator: < | > | <= | >= | == | !=")
    left_value: float = Field(default=0.0, description="Left side (actual / block value)")
    left_label: str = Field(default="", description="Label for left value, e.g. 'Valifan.Mass'")
    right_value: float = Field(default=0.0, description="Right side (requirement value)")
    right_label: str = Field(default="", description="Label for right value, e.g. 'maximum_fan_mass'")
    status: str = Field(default="not_verified", description="Rule status: verified | not_verified | error | na")
    last_checked: str = Field(default="", description="ISO timestamp of last evaluation")
    method: str = Field(default="analysis", description="V&V method: test | analysis | inspection | review | simulation")
