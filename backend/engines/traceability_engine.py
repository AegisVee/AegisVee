"""
Traceability Engine — Enhanced traceability matrix generation and impact analysis.

Uses TraceabilityStore for graph queries and generates:
- Full traceability matrix (requirements → architecture → verification → results)
- Impact analysis via BFS traversal
- Coverage statistics per entity type
"""

from typing import Dict, Any, List, Optional
from storage.base import GenericEntityStore
from storage.traceability_store import TraceabilityStore


# Entity type to store name mapping
ENTITY_STORE_MAP = {
    "requirement": "requirements",
    "architecture": "architecture_elements",
    "verification_measure": "verification_measures",
    "verification_result": "verification_results",
    "integration_instruction": "integration_instructions",
    "integrated_system": "integrated_systems",
    "analysis_result": "analysis_results",
}


class TraceabilityEngine:
    """Enhanced traceability matrix generation and impact analysis."""

    def __init__(self, project_id: str):
        self.project_id = str(project_id)
        self.trace_store = TraceabilityStore(self.project_id)

    def _store(self, entity_type: str) -> GenericEntityStore:
        return GenericEntityStore(self.project_id, entity_type)

    def _load_entity(self, entity_id: str, entity_type: str) -> Optional[Dict[str, Any]]:
        """Load a single entity by its type and ID."""
        store_name = ENTITY_STORE_MAP.get(entity_type, entity_type)
        store = self._store(store_name)
        return store.get_by_id(entity_id)

    def generate_traceability_matrix(self) -> Dict[str, Any]:
        """Generate a full traceability matrix across all entity types.

        Returns a matrix showing relationships between:
        Requirements → Architecture → Verification Measures → Verification Results
        """
        links = self.trace_store.load_all_links()
        requirements = self._store("requirements").load_all()
        architecture = self._store("architecture_elements").load_all()
        measures = self._store("verification_measures").load_all()
        results = self._store("verification_results").load_all()

        # Build adjacency map: entity_id → list of connections
        adjacency: Dict[str, List[Dict[str, str]]] = {}
        for link in links:
            src = link.get("source_id", "")
            tgt = link.get("target_id", "")
            link_type = link.get("link_type", "traces_to")
            link_id = link.get("id", "")

            adjacency.setdefault(src, []).append({
                "target_id": tgt,
                "target_type": link.get("target_type", ""),
                "link_type": link_type,
                "link_id": link_id,
            })
            adjacency.setdefault(tgt, []).append({
                "target_id": src,
                "target_type": link.get("source_type", ""),
                "link_type": link_type,
                "link_id": link_id,
            })

        # Build matrix rows (one per requirement)
        matrix_rows = []
        for req in requirements:
            req_id = req.get("id", "")
            row = {
                "requirement": {
                    "id": req_id,
                    "title": req.get("title", req.get("description", "")[:60]),
                    "level": req.get("level", ""),
                    "status": req.get("status", ""),
                    "req_type": req.get("req_type", ""),
                },
                "architecture_elements": [],
                "verification_measures": [],
                "verification_results": [],
                "is_fully_traced": False,
            }

            # Find linked entities via TraceabilityLinks
            linked = adjacency.get(req_id, [])
            for connection in linked:
                target_type = connection["target_type"]
                target_id = connection["target_id"]

                if target_type == "architecture":
                    elem = next((a for a in architecture if a.get("id") == target_id), None)
                    if elem:
                        row["architecture_elements"].append({
                            "id": target_id,
                            "name": elem.get("name", ""),
                            "element_type": elem.get("element_type", ""),
                            "link_id": connection["link_id"],
                        })

                elif target_type == "verification_measure":
                    measure = next((m for m in measures if m.get("id") == target_id), None)
                    if measure:
                        row["verification_measures"].append({
                            "id": target_id,
                            "title": measure.get("title", ""),
                            "technique": measure.get("technique", ""),
                            "script_type": measure.get("script_type", ""),
                            "link_id": connection["link_id"],
                        })

                elif target_type == "verification_result":
                    result = next((r for r in results if r.get("id") == target_id), None)
                    if result:
                        row["verification_results"].append({
                            "id": target_id,
                            "result": result.get("result", ""),
                            "summary": result.get("summary", "")[:80],
                            "link_id": connection["link_id"],
                        })

            # Also check legacy linkedTestIds
            legacy_test_ids = req.get("linkedTestIds", []) or req.get("linked_test_ids", [])
            for test_id in legacy_test_ids:
                if not any(vm["id"] == test_id for vm in row["verification_measures"]):
                    measure = next((m for m in measures if m.get("id") == test_id), None)
                    if measure:
                        row["verification_measures"].append({
                            "id": test_id,
                            "title": measure.get("title", ""),
                            "technique": measure.get("technique", "test"),
                            "script_type": measure.get("script_type", "manual"),
                            "link_id": "legacy",
                        })

            # Determine traceability completeness
            row["is_fully_traced"] = bool(
                row["verification_measures"] and
                (row["architecture_elements"] or row["verification_results"])
            )

            matrix_rows.append(row)

        # Summary stats
        total_reqs = len(requirements)
        fully_traced = sum(1 for r in matrix_rows if r["is_fully_traced"])
        partially_traced = sum(
            1 for r in matrix_rows
            if (r["architecture_elements"] or r["verification_measures"] or r["verification_results"])
            and not r["is_fully_traced"]
        )
        untraced = total_reqs - fully_traced - partially_traced

        return {
            "matrix": matrix_rows,
            "summary": {
                "total_requirements": total_reqs,
                "fully_traced": fully_traced,
                "partially_traced": partially_traced,
                "untraced": untraced,
                "traceability_percent": int(fully_traced / total_reqs * 100) if total_reqs > 0 else 0,
            },
            "entity_counts": {
                "requirements": total_reqs,
                "architecture_elements": len(architecture),
                "verification_measures": len(measures),
                "verification_results": len(results),
                "traceability_links": len(links),
            },
        }

    def analyze_impact(self, entity_id: str, entity_type: str = "") -> Dict[str, Any]:
        """Analyze the impact of changing a specific entity via BFS traversal."""
        chain = self.trace_store.get_traceability_chain(entity_id, max_depth=5)

        # Enrich chain items with entity details
        enriched_chain = []
        for item in chain:
            entity = self._load_entity(item["id"], item["type"])
            if entity:
                title = (entity.get("title") or
                         entity.get("name") or
                         entity.get("description", "")[:60])
                status = entity.get("status", "")
            else:
                title = "Unknown"
                status = ""

            enriched_chain.append({
                "id": item["id"],
                "type": item["type"],
                "depth": item["depth"],
                "link_type": item["link_type"],
                "link_id": item.get("link_id", ""),
                "title": title,
                "status": status,
            })

        # Group by entity type
        by_type: Dict[str, List] = {}
        for item in enriched_chain:
            by_type.setdefault(item["type"], []).append(item)

        return {
            "source_entity": {
                "id": entity_id,
                "type": entity_type,
            },
            "impact_chain": enriched_chain,
            "total_affected": len(enriched_chain),
            "affected_by_type": {k: len(v) for k, v in by_type.items()},
            "max_depth": max((item["depth"] for item in enriched_chain), default=0),
        }

    def get_coverage(self) -> Dict[str, Any]:
        """Get traceability coverage statistics per entity type."""
        return self.trace_store.calculate_coverage()

    def get_gaps(self) -> List[Dict[str, Any]]:
        """Get traceability gaps (entities missing required links)."""
        return self.trace_store.find_gaps()
