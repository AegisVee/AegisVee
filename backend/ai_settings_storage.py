"""
AI Settings Persistence — Load/save AI settings to data/ai_settings.json.
"""

import os
import json
from models.ai_settings import AISettings

SETTINGS_FILE = os.path.join("data", "ai_settings.json")


def load_ai_settings() -> AISettings:
    """Load AI settings from disk, or return defaults."""
    if os.path.exists(SETTINGS_FILE):
        try:
            with open(SETTINGS_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
            return AISettings(**data)
        except Exception as e:
            print(f"[AISettings] Failed to load settings: {e}. Using defaults.")
    return AISettings()


def save_ai_settings(settings: AISettings):
    """Save AI settings to disk."""
    os.makedirs(os.path.dirname(SETTINGS_FILE), exist_ok=True)
    with open(SETTINGS_FILE, "w", encoding="utf-8") as f:
        json.dump(settings.model_dump(), f, indent=2, ensure_ascii=False)


def reset_ai_settings() -> AISettings:
    """Reset to default settings."""
    settings = AISettings()
    save_ai_settings(settings)
    return settings
