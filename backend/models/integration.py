"""
ASPICE Work Products for System Integration (SYS.4)
- IntegrationSequenceInstruction (WP 06-50)
- IntegratedSystem (WP 11-06)
"""

from pydantic import Field
from typing import List, Dict, Any
from .base import BaseEntity


class IntegrationSequenceInstruction(BaseEntity):
    """ASPICE WP 06-50 — Integration Sequence Instruction.

    Defines the order and instructions for integrating architecture elements
    into the system. Used during SYS.4 integration verification.
    """
    wp_id: str = Field(default="06-50", description="ASPICE work product ID")

    title: str = Field(..., description="Integration step title")
    sequence_order: int = Field(default=0, description="Order in integration sequence (0-based)")
    instruction: str = Field(default="", description="Detailed integration instructions")
    architecture_element_ids: List[str] = Field(
        default_factory=list,
        description="Architecture element IDs involved in this integration step"
    )
    prerequisites: List[str] = Field(
        default_factory=list,
        description="IDs of IntegrationSequenceInstructions that must complete first"
    )
    expected_outcome: str = Field(default="", description="Expected outcome after integration")


class IntegratedSystem(BaseEntity):
    """ASPICE WP 11-06 — Integrated System.

    Represents the result of integrating architecture elements according
    to integration sequence instructions.
    """
    wp_id: str = Field(default="11-06", description="ASPICE work product ID")

    title: str = Field(..., description="Integrated system name")
    element_ids: List[str] = Field(
        default_factory=list,
        description="Architecture element IDs that form this integrated system"
    )
    integration_instruction_ids: List[str] = Field(
        default_factory=list,
        description="IntegrationSequenceInstruction IDs followed during integration"
    )
    integration_status: str = Field(
        default="pending",
        description="Integration status: pending | in_progress | completed | failed"
    )
    integration_notes: str = Field(default="", description="Notes from integration process")
    integration_date: str = Field(default="", description="ISO 8601 date of integration")
