"""
ASPICE Work Products for Consistency & Communication Evidence
- ConsistencyEvidence (WP 13-51)
- CommunicationEvidence (WP 13-52)
"""

from pydantic import Field
from typing import List
from .base import BaseEntity


class ConsistencyEvidence(BaseEntity):
    """ASPICE WP 13-51 — Consistency Evidence.

    Records evidence of consistency between related work products.
    Types: tool links, review records, revision histories, change comments.
    Supports BGB SYS.2.RL.12 (consistency deviation tracking).
    """
    wp_id: str = Field(default="13-51", description="ASPICE work product ID")

    evidence_type: str = Field(
        ...,
        description="Evidence type: tool_link | review_record | revision_history | change_comment"
    )
    source_id: str = Field(..., description="Source entity ID")
    source_type: str = Field(default="", description="Source entity type")
    target_id: str = Field(..., description="Target entity ID")
    target_type: str = Field(default="", description="Target entity type")
    description: str = Field(default="", description="Description of the consistency evidence")
    status: str = Field(
        default="open",
        description="Status: open | resolved | accepted | deviation"
    )
    deviation_rationale: str = Field(
        default="",
        description="Rationale for accepted deviations (BGB SYS.2.RL.12)"
    )
    resolution: str = Field(default="", description="How the inconsistency was resolved")


class CommunicationEvidence(BaseEntity):
    """ASPICE WP 13-52 — Communication Evidence.

    Records communication activities: approvals, notifications, baseline reports,
    review sign-offs. Supports SYS.1 BP2/BP4, SYS.2 BP6, SYS.3 BP5,
    SYS.4 BP5, SYS.5 BP5.
    """
    wp_id: str = Field(default="13-52", description="ASPICE work product ID")

    comm_type: str = Field(
        ...,
        description="Communication type: approval | notification | baseline_report | review_sign_off | status_update"
    )
    subject: str = Field(default="", description="Communication subject")
    content: str = Field(default="", description="Communication content / details")
    participants: List[str] = Field(
        default_factory=list,
        description="List of participant identifiers"
    )
    decision: str = Field(default="", description="Decision or outcome recorded")
    related_entity_ids: List[str] = Field(
        default_factory=list,
        description="IDs of related entities (requirements, architecture, etc.)"
    )
    comm_date: str = Field(default="", description="ISO 8601 communication date")
