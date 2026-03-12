"""
Traceability Link model for bidirectional tracing between any ASPICE entities.
Supports the full traceability chain:
  Stakeholder Requirements → System Requirements → Architecture → Verification Measures → Verification Results
"""

from pydantic import BaseModel, Field
from datetime import datetime


class TraceabilityLink(BaseModel):
    """Generic bidirectional traceability link between any two ASPICE entities.

    Supports multiple traceability directions defined in the product report:
    - Requirement ↔ Requirement (stakeholder → system)
    - Requirement ↔ ArchitectureElement (system req → architecture)
    - ArchitectureElement ↔ VerificationMeasure (architecture → verification)
    - VerificationMeasure ↔ VerificationResult (measure → result)
    """
    id: str = Field(..., description="Unique link identifier")
    source_id: str = Field(..., description="Source entity ID")
    source_type: str = Field(
        ...,
        description="Source entity type: requirement | architecture | verification_measure | verification_result | integrated_system"
    )
    target_id: str = Field(..., description="Target entity ID")
    target_type: str = Field(
        ...,
        description="Target entity type: requirement | architecture | verification_measure | verification_result | integrated_system"
    )
    link_type: str = Field(
        default="traces_to",
        description="Link semantics: traces_to | satisfies | verifies | derived_from | implements | allocated_to"
    )
    rationale: str = Field(default="", description="Rationale for this traceability link")
    created_at: str = Field(
        default_factory=lambda: datetime.now().isoformat(),
        description="ISO 8601 creation timestamp"
    )
    created_by: str = Field(default="", description="Creator identifier")
