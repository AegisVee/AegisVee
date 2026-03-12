"""
Generic Entity Store — JSON-based CRUD for any ASPICE work product type.

Each entity type is stored in its own JSON file within a project directory:
  data/projects/{project_id}/{entity_type}.json
"""

import json
import os
from typing import List, Dict, Any, Optional
from datetime import datetime


def _ensure_dir(path: str):
    """Ensure the directory for a file path exists."""
    dirpath = os.path.dirname(path)
    if dirpath and not os.path.exists(dirpath):
        os.makedirs(dirpath)


class GenericEntityStore:
    """Generic JSON-file CRUD store for any ASPICE work product entity.

    Usage:
        store = GenericEntityStore("1", "architecture_elements")
        store.add({"id": "ARCH-001", "name": "Sensor Module", ...})
        all_elements = store.load_all()
        store.update("ARCH-001", {"name": "Updated Sensor Module"})
        store.delete("ARCH-001")
    """

    def __init__(self, project_id: str, entity_type: str):
        self.project_id = str(project_id)
        self.entity_type = entity_type
        self.path = os.path.join("data", "projects", self.project_id, f"{entity_type}.json")
        # Ensure directory exists
        _ensure_dir(self.path)

    def load_all(self) -> List[Dict[str, Any]]:
        """Load all entities from the JSON file."""
        if not os.path.exists(self.path):
            return []
        try:
            with open(self.path, "r", encoding="utf-8") as f:
                data = json.load(f)
            return data if isinstance(data, list) else []
        except (json.JSONDecodeError, IOError):
            return []

    def save_all(self, entities: List[Dict[str, Any]]) -> bool:
        """Save all entities to the JSON file (full overwrite)."""
        _ensure_dir(self.path)
        with open(self.path, "w", encoding="utf-8") as f:
            json.dump(entities, f, indent=4, ensure_ascii=False)
        return True

    def get_by_id(self, entity_id: str) -> Optional[Dict[str, Any]]:
        """Get a single entity by its ID."""
        entities = self.load_all()
        return next((e for e in entities if e.get("id") == entity_id), None)

    def add(self, entity: Dict[str, Any]) -> Dict[str, Any]:
        """Add a new entity. Sets created_at/updated_at if not present."""
        now = datetime.now().isoformat()
        entity.setdefault("created_at", now)
        entity.setdefault("updated_at", now)
        entity.setdefault("version", 1)

        entities = self.load_all()
        entities.append(entity)
        self.save_all(entities)
        return entity

    def update(self, entity_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update an entity by ID. Increments version and sets updated_at."""
        entities = self.load_all()
        for i, e in enumerate(entities):
            if e.get("id") == entity_id:
                # Merge updates, preserving id
                entities[i] = {**e, **updates, "id": entity_id}
                entities[i]["updated_at"] = datetime.now().isoformat()
                entities[i]["version"] = e.get("version", 1) + 1
                self.save_all(entities)
                return entities[i]
        return None

    def delete(self, entity_id: str) -> bool:
        """Delete an entity by ID. Returns True if found and deleted."""
        entities = self.load_all()
        original_len = len(entities)
        entities = [e for e in entities if e.get("id") != entity_id]
        if len(entities) < original_len:
            self.save_all(entities)
            return True
        return False

    def count(self) -> int:
        """Return the number of entities."""
        return len(self.load_all())

    def find(self, **kwargs) -> List[Dict[str, Any]]:
        """Find entities matching all given field=value conditions."""
        entities = self.load_all()
        results = []
        for e in entities:
            if all(e.get(k) == v for k, v in kwargs.items()):
                results.append(e)
        return results
