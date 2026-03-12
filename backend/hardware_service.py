"""
Hardware Detection Service — detects GPU, VRAM, CPU, RAM for AI tier recommendation.

Tier recommendations:
- light:    < 8GB RAM, no GPU           → Qwen2.5 3B / Phi-3 Mini
- standard: 16GB+ RAM, 4GB+ VRAM       → Llama 3.1 8B / Mistral 7B
- full:     32GB+ RAM, 8GB+ VRAM       → Multiple models simultaneously
"""

import platform
import subprocess
import psutil
from typing import Optional
from models.hardware import HardwareInfo, GPUStats

# Cache hardware info (doesn't change during session)
_cached_hardware: Optional[HardwareInfo] = None


def detect_hardware() -> HardwareInfo:
    """Detect system hardware and recommend AI tier."""
    global _cached_hardware
    if _cached_hardware is not None:
        return _cached_hardware

    cpu_name = platform.processor() or "Unknown"
    cpu_cores = psutil.cpu_count(logical=False) or psutil.cpu_count() or 0
    mem = psutil.virtual_memory()
    ram_total_gb = round(mem.total / (1024 ** 3), 1)
    ram_available_gb = round(mem.available / (1024 ** 3), 1)

    # GPU detection
    gpu_name, gpu_vram_gb, cuda_available = _detect_gpu()

    # Compute recommended tier
    if ram_total_gb >= 32 and gpu_vram_gb >= 8:
        tier = "full"
    elif ram_total_gb >= 16 and gpu_vram_gb >= 4:
        tier = "standard"
    else:
        tier = "light"

    _cached_hardware = HardwareInfo(
        cpu_name=cpu_name,
        cpu_cores=cpu_cores,
        ram_total_gb=ram_total_gb,
        ram_available_gb=ram_available_gb,
        gpu_name=gpu_name,
        gpu_vram_gb=gpu_vram_gb,
        gpu_cuda_available=cuda_available,
        recommended_tier=tier,
    )
    return _cached_hardware


def _detect_gpu() -> tuple:
    """Detect NVIDIA GPU via nvidia-smi. Returns (name, vram_gb, cuda_available)."""
    try:
        result = subprocess.run(
            ["nvidia-smi", "--query-gpu=name,memory.total", "--format=csv,noheader,nounits"],
            capture_output=True,
            text=True,
            timeout=5,
        )
        if result.returncode == 0 and result.stdout.strip():
            line = result.stdout.strip().split("\n")[0]
            parts = [p.strip() for p in line.split(",")]
            if len(parts) >= 2:
                name = parts[0]
                vram_mb = float(parts[1])
                return name, round(vram_mb / 1024, 1), True
    except (FileNotFoundError, subprocess.TimeoutExpired, Exception):
        pass

    # Fallback: try WMI on Windows
    if platform.system() == "Windows":
        try:
            result = subprocess.run(
                ["wmic", "path", "win32_VideoController", "get", "name,AdapterRAM", "/format:csv"],
                capture_output=True,
                text=True,
                timeout=5,
            )
            if result.returncode == 0:
                for line in result.stdout.strip().split("\n"):
                    parts = [p.strip() for p in line.split(",")]
                    if len(parts) >= 3 and parts[1]:
                        try:
                            vram_bytes = int(parts[1])
                            name = parts[2]
                            if vram_bytes > 0:
                                return name, round(vram_bytes / (1024 ** 3), 1), False
                        except (ValueError, IndexError):
                            continue
        except Exception:
            pass

    return "None", 0.0, False


def get_gpu_stats() -> GPUStats:
    """Get real-time GPU stats via nvidia-smi."""
    try:
        result = subprocess.run(
            [
                "nvidia-smi",
                "--query-gpu=name,utilization.gpu,memory.used,memory.total,temperature.gpu",
                "--format=csv,noheader,nounits",
            ],
            capture_output=True,
            text=True,
            timeout=5,
        )
        if result.returncode == 0 and result.stdout.strip():
            line = result.stdout.strip().split("\n")[0]
            parts = [p.strip() for p in line.split(",")]
            if len(parts) >= 5:
                vram_used = float(parts[2])
                vram_total = float(parts[3])
                return GPUStats(
                    gpu_name=parts[0],
                    gpu_utilization_percent=float(parts[1]),
                    vram_used_gb=round(vram_used / 1024, 2),
                    vram_total_gb=round(vram_total / 1024, 2),
                    vram_percent=round((vram_used / vram_total) * 100, 1) if vram_total > 0 else 0,
                    temperature_c=float(parts[4]),
                )
    except Exception:
        pass

    return GPUStats()
