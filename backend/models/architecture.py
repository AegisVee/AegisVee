"""
ASPICE Work Products for System Architecture (SYS.3)
- ArchitectureElement (WP 04-06)
- SpecialCharacteristic (WP 17-57)
"""

from pydantic import BaseModel, Field
from typing import List, Dict, Any
from .base import BaseEntity


class BlockProperty(BaseModel):
    """A named engineering property on a system block (Valispace-style).

    Properties can have formulas that reference child block properties,
    enabling roll-up calculations (e.g., parent Mass = sum of children Mass).
    """
    id: str = Field(default="", description="Property ID")
    name: str = Field(default="", description="Property name, e.g. 'Mass'")
    formula: str = Field(default="", description="Formula or fixed value, e.g. '110' or 'SUM(children.Mass)'")
    value: float = Field(default=0.0, description="Computed numeric value")
    unit: str = Field(default="", description="Engineering unit, e.g. 'g', 'W'")
    margin_percent: float = Field(default=0.0, description="Margin percentage")
    worst_case: float = Field(default=0.0, description="Worst-case value with margin")
    tags: List[str] = Field(default_factory=list, description="Tags for categorization")


class ArchitectureElement(BaseEntity):
    """ASPICE WP 04-06 — System Architecture Element.

    Represents a component in the system architecture, supporting both
    static aspects (structure, interfaces) and dynamic aspects
    (behavior, timing, state machines).
    """
    wp_id: str = Field(default="04-06", description="ASPICE work product ID")

    # Core fields
    name: str = Field(..., description="Element name")
    element_type: str = Field(
        default="component",
        description="Element type: component | subsystem | interface | module | external"
    )
    description: str = Field(default="", description="Detailed description")

    # Static aspect (SYS.3 BP1)
    aspect: str = Field(default="static", description="Aspect: static | dynamic")
    interfaces: List[str] = Field(
        default_factory=list,
        description="List of interface element IDs this element connects to"
    )
    parent_id: str = Field(default="", description="Parent element ID for hierarchy")

    # Dynamic aspect (SYS.3 BP2)
    behavior_type: str = Field(
        default="",
        description="Dynamic behavior type: sequence | state_machine | timing | mode_interaction"
    )
    behavior_data: Dict[str, Any] = Field(
        default_factory=dict,
        description="Structured data for dynamic behavior (sequence diagrams, state machines, timing)"
    )

    # Lifecycle technical aspects (SYS.3 BP3)
    lifecycle_aspects: List[str] = Field(
        default_factory=list,
        description="Lifecycle considerations: manufacturability | serviceability | disposability"
    )
    design_rationale: str = Field(default="", description="Design decision rationale")

    # v3.0: Block properties (Valispace-style engineering values)
    properties: List[BlockProperty] = Field(
        default_factory=list,
        description="Engineering properties on this block (mass, power, etc.)"
    )
    # v3.0: Linked requirement IDs
    linked_requirement_ids: List[str] = Field(
        default_factory=list,
        description="Requirement IDs linked to this block"
    )

    # Visual Blueprint canvas positioning (for @xyflow/react)
    canvas_position: Dict[str, Any] = Field(
        default_factory=dict,
        description="Canvas position: {x, y} for @xyflow/react"
    )
    canvas_style: Dict[str, Any] = Field(
        default_factory=dict,
        description="Visual style overrides for canvas rendering"
    )


class SpecialCharacteristic(BaseEntity):
    """ASPICE WP 17-57 — Special Characteristic.

    Identifies special characteristics (safety, performance, reliability)
    associated with architecture elements or requirements.
    """
    wp_id: str = Field(default="17-57", description="ASPICE work product ID")
    source_id: str = Field(..., description="Source element ID (architecture element or requirement)")
    source_type: str = Field(
        default="architecture",
        description="Source type: architecture | requirement"
    )
    characteristic_type: str = Field(
        ..., description="Type: safety | performance | reliability | security | environmental"
    )
    description: str = Field(default="", description="Description of the special characteristic")
    rationale: str = Field(default="", description="Rationale for identifying as special")
    classification: str = Field(default="", description="Classification level or severity")
