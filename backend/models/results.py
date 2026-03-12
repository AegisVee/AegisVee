"""
ASPICE Work Products for Verification Results & Analysis
- VerificationMeasureData (WP 03-50)
- VerificationResult (WP 15-52)
- AnalysisResult (WP 15-51)
"""

from pydantic import Field
from typing import List, Dict, Any, Optional
from .base import BaseEntity


class VerificationMeasureData(BaseEntity):
    """ASPICE WP 03-50 — Verification Measure Data.

    Records raw measurement data captured during verification execution.
    """
    wp_id: str = Field(default="03-50", description="ASPICE work product ID")

    measure_id: str = Field(..., description="Parent VerificationMeasure ID")
    execution_date: str = Field(default="", description="ISO 8601 execution timestamp")
    executor: str = Field(default="", description="Person or system that executed the measure")
    environment_config: str = Field(
        default="",
        description="Environment configuration at time of execution"
    )
    raw_data: Dict[str, Any] = Field(
        default_factory=dict,
        description="Raw measurement data (flexible structure)"
    )
    notes: str = Field(default="", description="Execution notes")
    attachments: List[str] = Field(
        default_factory=list,
        description="Paths to attached evidence files"
    )


class VerificationResult(BaseEntity):
    """ASPICE WP 15-52 — Verification Result.

    Records the outcome of a verification measure execution.
    Used for both integration verification (SYS.4) and system verification (SYS.5).
    """
    wp_id: str = Field(default="15-52", description="ASPICE work product ID")

    measure_id: str = Field(..., description="Parent VerificationMeasure ID")
    data_id: str = Field(default="", description="Associated VerificationMeasureData ID")
    result: str = Field(
        default="pending",
        description="Result: pass | fail | blocked | pending | inconclusive"
    )
    result_type: str = Field(
        default="integration",
        description="Result level: integration (SYS.4) | system (SYS.5)"
    )
    summary: str = Field(default="", description="Result summary")
    defects: List[str] = Field(
        default_factory=list,
        description="List of defect IDs or descriptions found"
    )
    deviation_notes: str = Field(
        default="",
        description="Notes on any deviations from expected results"
    )
    reviewed_by: str = Field(default="", description="Reviewer identifier")
    review_date: str = Field(default="", description="ISO 8601 review date")


class AnalysisResult(BaseEntity):
    """ASPICE WP 15-51 — Analysis Result.

    Records the result of an analysis activity (consistency, feasibility,
    impact, boundary analysis). Supports SYS.1 BP3, SYS.2 BP3/BP4, SYS.3 BP3.
    """
    wp_id: str = Field(default="15-51", description="ASPICE work product ID")

    source_id: str = Field(..., description="Source entity ID being analyzed")
    source_type: str = Field(
        default="requirement",
        description="Source type: requirement | architecture | system"
    )
    analysis_type: str = Field(
        ...,
        description="Analysis type: consistency | feasibility | impact | boundary | completeness | verifiability"
    )
    result: str = Field(default="", description="Analysis result text")
    score: Optional[int] = Field(None, description="Numeric score (0-100) if applicable")
    issues: List[str] = Field(
        default_factory=list,
        description="Specific issues identified during analysis"
    )
    recommendations: List[str] = Field(
        default_factory=list,
        description="Recommendations for improvement"
    )
    risk_level: str = Field(
        default="",
        description="Risk level: low | medium | high | critical"
    )
