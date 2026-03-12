"""
Base entity model for all ASPICE work products.
Provides common fields: id, timestamps, version, created_by.
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class BaseEntity(BaseModel):
    """Base class for all ASPICE work product entities."""
    id: str = Field(..., description="Unique identifier")
    created_at: str = Field(
        default_factory=lambda: datetime.now().isoformat(),
        description="ISO 8601 creation timestamp"
    )
    updated_at: str = Field(
        default_factory=lambda: datetime.now().isoformat(),
        description="ISO 8601 last update timestamp"
    )
    version: int = Field(default=1, description="Version number for change tracking")
    created_by: str = Field(default="", description="Author / creator identifier")
