"""
Consistency Engine — Auto-detect traceability gaps and inconsistencies.

Performs automated consistency checks across all ASPICE work products:
- Version inconsistencies between linked entities
- Traceability gaps (missing required links)
- Status conflicts (e.g., requirement verified but no passing test)
- Auto-generates ConsistencyEvidence (13-51) records
"""

from typing import Dict, Any, List
from datetime import datetime
from storage.base import GenericEntityStore
from storage.traceability_store import TraceabilityStore


class ConsistencyEngine:
    """Automated consistency checking across ASPICE work products."""

    def __init__(self, project_id: str):
        self.project_id = str(project_id)
        self.trace_store = TraceabilityStore(self.project_id)

    def _store(self, entity_type: str) -> GenericEntityStore:
        return GenericEntityStore(self.project_id, entity_type)

    def check_traceability_gaps(self) -> List[Dict[str, Any]]:
        """Find entities missing required traceability links."""
        return self.trace_store.find_gaps()

    def check_status_conflicts(self) -> List[Dict[str, Any]]:
        """Find status conflicts between linked entities.

        Detects:
        - Requirements marked 'Verified' with no linked passing verification result
        - Verification measures with no recorded results
        """
        issues = []
        links = self.trace_store.load_all_links()
        requirements = self._store("requirements").load_all()
        measures = self._store("verification_measures").load_all()
        results = self._store("verification_results").load_all()

        # Build measure → results lookup
        result_by_measure: Dict[str, List] = {}
        for r in results:
            mid = r.get("measure_id", "")
            if mid:
                result_by_measure.setdefault(mid, []).append(r)

        for req in requirements:
            req_id = req.get("id", "")
            req_status = req.get("status", "")

            if req_status in ("Verified", "verified"):
                # Find all linked verification measures
                linked_measure_ids = set()
                for link in links:
                    if (link.get("source_id") == req_id and
                            link.get("target_type") == "verification_measure"):
                        linked_measure_ids.add(link["target_id"])
                    elif (link.get("target_id") == req_id and
                          link.get("source_type") == "verification_measure"):
                        linked_measure_ids.add(link["source_id"])

                # Also check legacy linkedTestIds
                legacy_ids = req.get("linkedTestIds") or req.get("linked_test_ids") or []
                linked_measure_ids.update(legacy_ids)

                if not linked_measure_ids:
                    issues.append({
                        "type": "status_conflict",
                        "severity": "high",
                        "entity_id": req_id,
                        "entity_type": "requirement",
                        "title": req.get("title", req.get("description", "")[:50]),
                        "message": (
                            f"Requirement '{req_id}' is marked 'Verified' "
                            "but has no linked verification measures"
                        ),
                    })
                else:
                    has_pass = any(
                        any(r.get("result") == "pass" for r in result_by_measure.get(mid, []))
                        for mid in linked_measure_ids
                    )
                    if not has_pass:
                        issues.append({
                            "type": "status_conflict",
                            "severity": "medium",
                            "entity_id": req_id,
                            "entity_type": "requirement",
                            "title": req.get("title", req.get("description", "")[:50]),
                            "message": (
                                f"Requirement '{req_id}' is marked 'Verified' "
                                "but no linked verification measure has a passing result"
                            ),
                        })

        # Verification measures without any results
        for measure in measures:
            measure_id = measure.get("id", "")
            if measure_id not in result_by_measure:
                issues.append({
                    "type": "missing_result",
                    "severity": "low",
                    "entity_id": measure_id,
                    "entity_type": "verification_measure",
                    "title": measure.get("title", ""),
                    "message": (
                        f"Verification measure '{measure_id}' has no recorded results"
                    ),
                })

        return issues

    def check_version_inconsistencies(self) -> List[Dict[str, Any]]:
        """Detect requirements updated after their linked verification measures.

        If a requirement's updated_at > linked measure's updated_at,
        the measure may no longer reflect the current requirement.
        """
        issues = []
        links = self.trace_store.load_all_links()
        requirements = self._store("requirements").load_all()
        measures = self._store("verification_measures").load_all()

        req_map = {r.get("id", ""): r for r in requirements}
        measure_map = {m.get("id", ""): m for m in measures}

        for link in links:
            src_id = link.get("source_id", "")
            tgt_id = link.get("target_id", "")
            src_type = link.get("source_type", "")
            tgt_type = link.get("target_type", "")

            src_entity = req_map.get(src_id) if src_type == "requirement" else None
            tgt_entity = measure_map.get(tgt_id) if tgt_type == "verification_measure" else None

            if src_entity and tgt_entity:
                src_updated = src_entity.get("updated_at", "")
                tgt_updated = tgt_entity.get("updated_at", "")

                if src_updated and tgt_updated and src_updated > tgt_updated:
                    issues.append({
                        "type": "version_mismatch",
                        "severity": "medium",
                        "source_id": src_id,
                        "source_type": src_type,
                        "target_id": tgt_id,
                        "target_type": tgt_type,
                        "entity_id": src_id,
                        "entity_type": src_type,
                        "title": src_entity.get("title", src_entity.get("description", "")[:50]),
                        "message": (
                            f"Requirement '{src_id}' was updated after verification measure "
                            f"'{tgt_id}' — measure may be outdated"
                        ),
                        "source_updated": src_updated,
                        "target_updated": tgt_updated,
                    })

        return issues

    def run_all_checks(self) -> Dict[str, Any]:
        """Run all consistency checks and return a comprehensive report."""
        traceability_gaps = self.check_traceability_gaps()
        status_conflicts = self.check_status_conflicts()
        version_issues = self.check_version_inconsistencies()

        all_issues = traceability_gaps + status_conflicts + version_issues

        by_severity: Dict[str, int] = {"high": 0, "medium": 0, "low": 0}
        by_type: Dict[str, int] = {}
        for issue in all_issues:
            sev = issue.get("severity", "low")
            by_severity[sev] = by_severity.get(sev, 0) + 1
            t = issue.get("type", "unknown")
            by_type[t] = by_type.get(t, 0) + 1

        return {
            "project_id": self.project_id,
            "total_issues": len(all_issues),
            "by_severity": by_severity,
            "by_type": by_type,
            "issues": all_issues,
        }

    def auto_generate_evidence(self) -> List[Dict[str, Any]]:
        """Auto-generate ConsistencyEvidence (WP 13-51) records from detected issues.

        Creates open evidence records for unresolved consistency issues
        so they can be tracked and closed as part of the ASPICE workflow.
        Returns the list of newly created evidence records.
        """
        report = self.run_all_checks()
        evidence_store = self._store("consistency_evidence")
        existing = evidence_store.load_all()

        existing_pairs = set()
        for e in existing:
            existing_pairs.add((e.get("source_id", ""), e.get("target_id", "")))

        new_evidence = []
        now = datetime.now().isoformat()
        counter = len(existing)

        for issue in report["issues"]:
            source_id = issue.get("entity_id", issue.get("source_id", ""))
            target_id = issue.get("target_id", issue.get("entity_id", ""))

            pair = (source_id, target_id)
            if pair in existing_pairs:
                continue

            counter += 1
            evidence = {
                "id": f"CE-{counter:04d}",
                "wp_id": "13-51",
                "evidence_type": "tool_link",
                "source_id": source_id,
                "target_id": target_id,
                "description": issue.get("message", ""),
                "status": "open",
                "created_at": now,
                "updated_at": now,
                "version": 1,
                "created_by": "consistency_engine",
            }
            new_evidence.append(evidence)
            existing_pairs.add(pair)

        if new_evidence:
            evidence_store.save_all(existing + new_evidence)

        return new_evidence
