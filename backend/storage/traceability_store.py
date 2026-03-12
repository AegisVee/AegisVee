"""
Traceability Store — Graph-like queries for traceability links.
Builds on GenericEntityStore for link persistence, adds graph traversal.
"""

from typing import List, Dict, Any, Set, Optional
from .base import GenericEntityStore


class TraceabilityStore:
    """Provides graph-like query operations on traceability links."""

    def __init__(self, project_id: str):
        self.project_id = str(project_id)
        self.store = GenericEntityStore(project_id, "traceability_links")

    def load_all_links(self) -> List[Dict[str, Any]]:
        return self.store.load_all()

    def add_link(self, link: Dict[str, Any]) -> Dict[str, Any]:
        return self.store.add(link)

    def delete_link(self, link_id: str) -> bool:
        return self.store.delete(link_id)

    def get_links_for_entity(self, entity_id: str) -> List[Dict[str, Any]]:
        """Get all traceability links where entity is source or target."""
        links = self.load_all_links()
        return [
            link for link in links
            if link.get("source_id") == entity_id or link.get("target_id") == entity_id
        ]

    def get_outgoing_links(self, entity_id: str) -> List[Dict[str, Any]]:
        """Get links where entity is the source."""
        links = self.load_all_links()
        return [link for link in links if link.get("source_id") == entity_id]

    def get_incoming_links(self, entity_id: str) -> List[Dict[str, Any]]:
        """Get links where entity is the target."""
        links = self.load_all_links()
        return [link for link in links if link.get("target_id") == entity_id]

    def get_linked_entity_ids(self, entity_id: str) -> Set[str]:
        """Get all entity IDs connected to the given entity (in any direction)."""
        links = self.get_links_for_entity(entity_id)
        ids = set()
        for link in links:
            if link.get("source_id") == entity_id:
                ids.add(link["target_id"])
            else:
                ids.add(link["source_id"])
        return ids

    def get_traceability_chain(self, entity_id: str, max_depth: int = 10) -> List[Dict[str, Any]]:
        """BFS traversal to find all entities reachable from the given entity.
        Returns a list of dicts: [{id, type, depth, link_type}, ...]
        """
        links = self.load_all_links()
        visited: Set[str] = {entity_id}
        queue = [(entity_id, 0)]
        chain = []

        while queue:
            current_id, depth = queue.pop(0)
            if depth >= max_depth:
                continue

            for link in links:
                neighbor_id = None
                neighbor_type = None
                link_type = link.get("link_type", "traces_to")

                if link.get("source_id") == current_id:
                    neighbor_id = link["target_id"]
                    neighbor_type = link.get("target_type", "")
                elif link.get("target_id") == current_id:
                    neighbor_id = link["source_id"]
                    neighbor_type = link.get("source_type", "")

                if neighbor_id and neighbor_id not in visited:
                    visited.add(neighbor_id)
                    chain.append({
                        "id": neighbor_id,
                        "type": neighbor_type,
                        "depth": depth + 1,
                        "link_type": link_type,
                        "link_id": link.get("id", ""),
                    })
                    queue.append((neighbor_id, depth + 1))

        return chain

    def calculate_coverage(self) -> Dict[str, Any]:
        """Calculate traceability coverage across all entity types.
        Returns coverage stats per entity type.
        """
        links = self.load_all_links()

        # Collect all source/target types and IDs
        source_entities: Dict[str, Set[str]] = {}
        target_entities: Dict[str, Set[str]] = {}

        for link in links:
            s_type = link.get("source_type", "unknown")
            t_type = link.get("target_type", "unknown")
            source_entities.setdefault(s_type, set()).add(link["source_id"])
            target_entities.setdefault(t_type, set()).add(link["target_id"])

        # Load entity counts from stores
        entity_types_map = {
            "requirement": "requirements",
            "architecture": "architecture_elements",
            "verification_measure": "verification_measures",
            "verification_result": "verification_results",
        }

        coverage = {}
        for entity_type, store_name in entity_types_map.items():
            store = GenericEntityStore(self.project_id, store_name)
            total = store.count()
            traced = len(
                source_entities.get(entity_type, set()) |
                target_entities.get(entity_type, set())
            )
            coverage[entity_type] = {
                "total": total,
                "traced": min(traced, total),  # Can't exceed total
                "percent": int((min(traced, total) / total * 100) if total > 0 else 0),
            }

        return coverage

    def find_gaps(self) -> List[Dict[str, Any]]:
        """Find entities that lack required traceability links.
        Returns a list of {entity_id, entity_type, missing_link_to} dicts.
        """
        links = self.load_all_links()
        gaps = []

        # Check: all requirements should trace to architecture or verification
        req_store = GenericEntityStore(self.project_id, "requirements")
        requirements = req_store.load_all()

        linked_req_ids = set()
        for link in links:
            if link.get("source_type") == "requirement":
                linked_req_ids.add(link["source_id"])
            if link.get("target_type") == "requirement":
                linked_req_ids.add(link["target_id"])

        for req in requirements:
            req_id = req.get("id", "")
            # Also check legacy linkedTestIds
            has_legacy_links = bool(req.get("linkedTestIds") or req.get("linked_test_ids"))
            if req_id not in linked_req_ids and not has_legacy_links:
                gaps.append({
                    "entity_id": req_id,
                    "entity_type": "requirement",
                    "title": req.get("title", req.get("description", "")[:50]),
                    "missing": "No traceability links (should trace to architecture or verification)"
                })

        # Check: all architecture elements should trace to requirements
        arch_store = GenericEntityStore(self.project_id, "architecture_elements")
        arch_elements = arch_store.load_all()

        linked_arch_ids = set()
        for link in links:
            if link.get("source_type") == "architecture":
                linked_arch_ids.add(link["source_id"])
            if link.get("target_type") == "architecture":
                linked_arch_ids.add(link["target_id"])

        for elem in arch_elements:
            elem_id = elem.get("id", "")
            if elem_id not in linked_arch_ids:
                gaps.append({
                    "entity_id": elem_id,
                    "entity_type": "architecture",
                    "title": elem.get("name", ""),
                    "missing": "No traceability links (should trace to requirements)"
                })

        # Check: all verification measures should trace to architecture or requirements
        vm_store = GenericEntityStore(self.project_id, "verification_measures")
        measures = vm_store.load_all()

        linked_vm_ids = set()
        for link in links:
            if link.get("source_type") == "verification_measure":
                linked_vm_ids.add(link["source_id"])
            if link.get("target_type") == "verification_measure":
                linked_vm_ids.add(link["target_id"])

        for vm in measures:
            vm_id = vm.get("id", "")
            # Also check legacy requirement_id
            has_legacy_link = bool(vm.get("requirement_id"))
            if vm_id not in linked_vm_ids and not has_legacy_link:
                gaps.append({
                    "entity_id": vm_id,
                    "entity_type": "verification_measure",
                    "title": vm.get("title", ""),
                    "missing": "No traceability links (should trace to architecture or requirements)"
                })

        return gaps
