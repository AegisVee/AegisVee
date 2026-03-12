"""
v2.0 Hardware Info Model — System hardware detection results.

Used for recommending AI configuration tiers and monitoring GPU/VRAM usage.
"""

from pydantic import BaseModel, Field


class HardwareInfo(BaseModel):
    """System hardware detection result for AI tier recommendation."""

    cpu_name: str = Field(default="Unknown", description="CPU model name")
    cpu_cores: int = Field(default=0, description="Number of CPU cores")
    ram_total_gb: float = Field(default=0.0, description="Total system RAM in GB")
    ram_available_gb: float = Field(default=0.0, description="Available system RAM in GB")
    gpu_name: str = Field(default="None", description="GPU model name or 'None'")
    gpu_vram_gb: float = Field(default=0.0, description="GPU VRAM in GB")
    gpu_cuda_available: bool = Field(default=False, description="Whether CUDA is available")
    recommended_tier: str = Field(
        default="light",
        description="Recommended AI tier: light | standard | full"
    )


class GPUStats(BaseModel):
    """Real-time GPU usage statistics."""

    gpu_name: str = Field(default="None", description="GPU model name")
    gpu_utilization_percent: float = Field(default=0.0, description="GPU utilization %")
    vram_used_gb: float = Field(default=0.0, description="VRAM used in GB")
    vram_total_gb: float = Field(default=0.0, description="VRAM total in GB")
    vram_percent: float = Field(default=0.0, description="VRAM usage %")
    temperature_c: float = Field(default=0.0, description="GPU temperature in Celsius")
