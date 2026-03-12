"""
Valitype Registry — Predefined engineering value types with unit conversions.

Each Valitype defines a base unit and conversion factors for related units.
"""

from typing import Dict, Any


VALITYPES: Dict[str, Dict[str, Any]] = {
    "Mass": {
        "base_unit": "kg",
        "description": "Mass measurement",
        "conversions": {
            "mg": 0.000001,
            "g": 0.001,
            "kg": 1.0,
            "lb": 0.453592,
            "oz": 0.0283495,
        },
    },
    "Power": {
        "base_unit": "W",
        "description": "Power measurement",
        "conversions": {
            "mW": 0.001,
            "W": 1.0,
            "kW": 1000.0,
            "MW": 1000000.0,
            "hp": 745.7,
        },
    },
    "Length": {
        "base_unit": "m",
        "description": "Length/distance measurement",
        "conversions": {
            "mm": 0.001,
            "cm": 0.01,
            "m": 1.0,
            "km": 1000.0,
            "in": 0.0254,
            "ft": 0.3048,
        },
    },
    "Voltage": {
        "base_unit": "V",
        "description": "Electrical voltage",
        "conversions": {
            "mV": 0.001,
            "V": 1.0,
            "kV": 1000.0,
        },
    },
    "Current": {
        "base_unit": "A",
        "description": "Electrical current",
        "conversions": {
            "uA": 0.000001,
            "mA": 0.001,
            "A": 1.0,
        },
    },
    "Temperature": {
        "base_unit": "K",
        "description": "Temperature (linear conversions only — offset-based C/F handled separately)",
        "conversions": {
            "K": 1.0,
        },
    },
    "Frequency": {
        "base_unit": "Hz",
        "description": "Frequency measurement",
        "conversions": {
            "Hz": 1.0,
            "kHz": 1000.0,
            "MHz": 1000000.0,
            "GHz": 1000000000.0,
        },
    },
    "Time": {
        "base_unit": "s",
        "description": "Time duration",
        "conversions": {
            "us": 0.000001,
            "ms": 0.001,
            "s": 1.0,
            "min": 60.0,
            "h": 3600.0,
        },
    },
    "Cost": {
        "base_unit": "USD",
        "description": "Cost/price (nominal exchange rates)",
        "conversions": {
            "USD": 1.0,
            "EUR": 1.08,
            "GBP": 1.27,
            "JPY": 0.0067,
        },
    },
    "DeltaV": {
        "base_unit": "m/s",
        "description": "Velocity change (aerospace)",
        "conversions": {
            "m/s": 1.0,
            "km/s": 1000.0,
            "ft/s": 0.3048,
        },
    },
    "Pressure": {
        "base_unit": "Pa",
        "description": "Pressure measurement",
        "conversions": {
            "Pa": 1.0,
            "kPa": 1000.0,
            "MPa": 1000000.0,
            "bar": 100000.0,
            "psi": 6894.76,
            "atm": 101325.0,
        },
    },
    "DataRate": {
        "base_unit": "bps",
        "description": "Data transfer rate",
        "conversions": {
            "bps": 1.0,
            "kbps": 1000.0,
            "Mbps": 1000000.0,
            "Gbps": 1000000000.0,
        },
    },
}


def convert_unit(value: float, from_unit: str, to_unit: str, valitype: str) -> float:
    """Convert a value between units within the same Valitype.

    Args:
        value: The numeric value to convert
        from_unit: Source unit string (must exist in the valitype's conversions)
        to_unit: Target unit string (must exist in the valitype's conversions)
        valitype: The Valitype name (e.g., "Mass", "Power")

    Returns:
        Converted value in the target unit

    Raises:
        ValueError: If valitype or units are not found
    """
    if valitype not in VALITYPES:
        raise ValueError(f"Unknown Valitype: {valitype}")

    conversions = VALITYPES[valitype]["conversions"]

    if from_unit not in conversions:
        raise ValueError(f"Unknown unit '{from_unit}' for Valitype '{valitype}'")
    if to_unit not in conversions:
        raise ValueError(f"Unknown unit '{to_unit}' for Valitype '{valitype}'")

    # Convert to base unit, then to target unit
    base_value = value * conversions[from_unit]
    return base_value / conversions[to_unit]


def get_units_for_valitype(valitype: str) -> list:
    """Get available unit strings for a Valitype."""
    if valitype not in VALITYPES:
        return []
    return list(VALITYPES[valitype]["conversions"].keys())
