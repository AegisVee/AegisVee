"""
ASPICE Compliance Engine — SYS.1 through SYS.5 scorecard calculation.

Evaluates project data against ASPICE process requirements:
- BP (Base Practice) completion per process
- Work product coverage (13 ASPICE WP types)
- Traceability completeness
- Consistency issue count
"""

from typing import Dict, Any, List
from storage.base import GenericEntityStore
from storage.traceability_store import TraceabilityStore


# ASPICE Work Product IDs and their entity types
WORK_PRODUCT_MAP = {
    "17-00": {"name": "System Requirements", "entity_type": "requirements"},
    "17-54": {"name": "Requirement Attributes", "entity_type": "requirement_attributes"},
    "04-06": {"name": "System Architecture", "entity_type": "architecture_elements"},
    "17-57": {"name": "Special Characteristics", "entity_type": "special_characteristics"},
    "08-60": {"name": "Verification Measures", "entity_type": "verification_measures"},
    "08-58": {"name": "Verification Selection Sets", "entity_type": "verification_selection_sets"},
    "06-50": {"name": "Integration Instructions", "entity_type": "integration_instructions"},
    "11-06": {"name": "Integrated Systems", "entity_type": "integrated_systems"},
    "03-50": {"name": "Verification Data", "entity_type": "verification_data"},
    "15-52": {"name": "Verification Results", "entity_type": "verification_results"},
    "15-51": {"name": "Analysis Results", "entity_type": "analysis_results"},
    "13-51": {"name": "Consistency Evidence", "entity_type": "consistency_evidence"},
    "13-52": {"name": "Communication Evidence", "entity_type": "communication_evidence"},
}


class ComplianceEngine:
    """Calculates ASPICE SYS.1-SYS.5 compliance scorecard for a project."""

    def __init__(self, project_id: str):
        self.project_id = str(project_id)
        self.trace_store = TraceabilityStore(self.project_id)

    def _store(self, entity_type: str) -> GenericEntityStore:
        return GenericEntityStore(self.project_id, entity_type)

    def _count(self, entity_type: str) -> int:
        return self._store(entity_type).count()

    def _has_any(self, entity_type: str) -> bool:
        return self._count(entity_type) > 0

    def _has_comm_type(self, comm_type: str) -> bool:
        store = self._store("communication_evidence")
        return len(store.find(comm_type=comm_type)) > 0

    def _has_analysis_type(self, analysis_type: str) -> bool:
        store = self._store("analysis_results")
        return len(store.find(analysis_type=analysis_type)) > 0

    # ----------------------------------------------------------------
    # SYS.1: Requirements Elicitation
    # ----------------------------------------------------------------
    def _score_sys1(self) -> Dict[str, Any]:
        reqs = self._store("requirements").load_all()
        stakeholder_reqs = [r for r in reqs if r.get("level") == "stakeholder"]

        bp_completion = {
            "BP1_stakeholder_elicitation": len(stakeholder_reqs) > 0,
            "BP2_requirement_agreement": self._has_comm_type("approval"),
            "BP3_change_analysis": self._has_analysis_type("impact"),
            "BP4_status_communication": self._has_comm_type("notification"),
        }

        completed = sum(1 for v in bp_completion.values() if v)
        total = len(bp_completion)

        return {
            "process": "SYS.1",
            "name": "Requirements Elicitation",
            "bp_completion": bp_completion,
            "bp_score": f"{completed}/{total}",
            "bp_percent": int(completed / total * 100) if total > 0 else 0,
            "work_products": ["17-00", "13-52", "15-51"],
        }

    # ----------------------------------------------------------------
    # SYS.2: System Requirements Analysis
    # ----------------------------------------------------------------
    def _score_sys2(self) -> Dict[str, Any]:
        reqs = self._store("requirements").load_all()
        system_reqs = [r for r in reqs if r.get("level") == "system"]
        attrs = self._store("requirement_attributes").load_all()

        # BGB SYS.2.RL.4: multi-dimensional classification
        has_classification = any(
            r.get("functional_group") or r.get("variant") or r.get("release")
            for r in system_reqs
        )

        # BGB SYS.2.RL.7: tool-managed attributes
        has_attributes = len(attrs) > 0

        bp_completion = {
            "BP1_system_requirements": len(system_reqs) > 0,
            "BP2_structured_requirements": has_classification,
            "BP3_requirement_attributes": has_attributes,
            "BP4_impact_analysis": self._has_analysis_type("impact"),
            "BP5_consistency_check": self._has_any("consistency_evidence"),
            "BP6_communication": self._has_comm_type("approval"),
        }

        completed = sum(1 for v in bp_completion.values() if v)
        total = len(bp_completion)

        return {
            "process": "SYS.2",
            "name": "System Requirements Analysis",
            "bp_completion": bp_completion,
            "bp_score": f"{completed}/{total}",
            "bp_percent": int(completed / total * 100) if total > 0 else 0,
            "work_products": ["17-00", "17-54", "13-51", "13-52", "15-51"],
        }

    # ----------------------------------------------------------------
    # SYS.3: System Architectural Design
    # ----------------------------------------------------------------
    def _score_sys3(self) -> Dict[str, Any]:
        arch = self._store("architecture_elements").load_all()
        special = self._store("special_characteristics").load_all()

        has_dynamic = any(e.get("aspect") == "dynamic" for e in arch)
        has_interfaces = any(e.get("interfaces") for e in arch)

        bp_completion = {
            "BP1_architecture_elements": len(arch) > 0,
            "BP2_allocation": self._check_arch_allocation(),
            "BP3_interfaces": has_interfaces,
            "BP4_dynamic_behavior": has_dynamic,
            "BP5_special_characteristics": len(special) > 0,
            "BP6_consistency": self._has_any("consistency_evidence"),
            "BP7_communication": self._has_comm_type("approval"),
        }

        completed = sum(1 for v in bp_completion.values() if v)
        total = len(bp_completion)

        return {
            "process": "SYS.3",
            "name": "System Architectural Design",
            "bp_completion": bp_completion,
            "bp_score": f"{completed}/{total}",
            "bp_percent": int(completed / total * 100) if total > 0 else 0,
            "work_products": ["04-06", "17-57", "13-51", "13-52"],
        }

    def _check_arch_allocation(self) -> bool:
        links = self.trace_store.load_all_links()
        return any(
            link.get("source_type") == "architecture" or link.get("target_type") == "architecture"
            for link in links
        )

    # ----------------------------------------------------------------
    # SYS.4: System Integration & Integration Verification
    # ----------------------------------------------------------------
    def _score_sys4(self) -> Dict[str, Any]:
        instructions = self._store("integration_instructions").load_all()
        integrated = self._store("integrated_systems").load_all()
        measures = self._store("verification_measures").load_all()
        selection_sets = self._store("verification_selection_sets").load_all()
        results = self._store("verification_results").load_all()

        integration_measures = [m for m in measures if m.get("measure_type") == "integration"]

        # BGB SYS.4.RL.1: entry/exit criteria
        has_criteria = any(
            s.get("entry_criteria") or s.get("exit_criteria") for s in selection_sets
        )

        bp_completion = {
            "BP1_integration_strategy": len(instructions) > 0,
            "BP2_integration_execution": len(integrated) > 0,
            "BP3_verification_measures": len(integration_measures) > 0,
            "BP4_selection_set": len(selection_sets) > 0 and has_criteria,
            "BP5_verification_execution": len(results) > 0,
            "BP6_consistency": self._has_any("consistency_evidence"),
            "BP7_communication": self._has_comm_type("baseline_report"),
        }

        completed = sum(1 for v in bp_completion.values() if v)
        total = len(bp_completion)

        return {
            "process": "SYS.4",
            "name": "System Integration & Integration Verification",
            "bp_completion": bp_completion,
            "bp_score": f"{completed}/{total}",
            "bp_percent": int(completed / total * 100) if total > 0 else 0,
            "work_products": ["06-50", "11-06", "08-60", "08-58", "15-52", "03-50", "13-51", "13-52"],
        }

    # ----------------------------------------------------------------
    # SYS.5: System Verification
    # ----------------------------------------------------------------
    def _score_sys5(self) -> Dict[str, Any]:
        measures = self._store("verification_measures").load_all()
        selection_sets = self._store("verification_selection_sets").load_all()
        results = self._store("verification_results").load_all()
        data = self._store("verification_data").load_all()

        system_measures = [m for m in measures if m.get("measure_type") == "system"]
        has_regression = any(s.get("regression_strategy") for s in selection_sets)

        bp_completion = {
            "BP1_verification_measures": len(system_measures) > 0,
            "BP2_selection_set": len(selection_sets) > 0,
            "BP3_verification_execution": len(results) > 0,
            "BP4_measurement_data": len(data) > 0,
            "BP5_regression_strategy": has_regression,
            "BP6_consistency": self._has_any("consistency_evidence"),
            "BP7_communication": self._has_comm_type("baseline_report"),
        }

        completed = sum(1 for v in bp_completion.values() if v)
        total = len(bp_completion)

        return {
            "process": "SYS.5",
            "name": "System Verification",
            "bp_completion": bp_completion,
            "bp_score": f"{completed}/{total}",
            "bp_percent": int(completed / total * 100) if total > 0 else 0,
            "work_products": ["08-60", "08-58", "15-52", "03-50", "15-51", "13-51", "13-52"],
        }

    # ================================================================
    # Public API
    # ================================================================

    def calculate_scorecard(self) -> Dict[str, Any]:
        """Calculate full ASPICE SYS.1-SYS.5 compliance scorecard."""
        processes = {
            "SYS.1": self._score_sys1(),
            "SYS.2": self._score_sys2(),
            "SYS.3": self._score_sys3(),
            "SYS.4": self._score_sys4(),
            "SYS.5": self._score_sys5(),
        }

        total_bp = sum(len(p["bp_completion"]) for p in processes.values())
        completed_bp = sum(
            sum(1 for v in p["bp_completion"].values() if v)
            for p in processes.values()
        )
        overall_percent = int(completed_bp / total_bp * 100) if total_bp > 0 else 0

        return {
            "project_id": self.project_id,
            "processes": processes,
            "overall": {
                "total_bp": total_bp,
                "completed_bp": completed_bp,
                "percent": overall_percent,
            },
            "traceability_coverage": self.trace_store.calculate_coverage(),
            "consistency_gaps": len(self.trace_store.find_gaps()),
        }

    def get_work_product_status(self) -> List[Dict[str, Any]]:
        """Get status of all 13 ASPICE work product types."""
        result = []
        for wp_id, info in WORK_PRODUCT_MAP.items():
            count = self._count(info["entity_type"])
            result.append({
                "wp_id": wp_id,
                "name": info["name"],
                "entity_type": info["entity_type"],
                "count": count,
                "status": "populated" if count > 0 else "empty",
            })
        return result

    def check_bgb_rules(self) -> Dict[str, Any]:
        """Check BGB Rating Rules compliance."""
        reqs = self._store("requirements").load_all()
        system_reqs = [r for r in reqs if r.get("level") == "system"]
        attrs = self._store("requirement_attributes").load_all()
        selection_sets = self._store("verification_selection_sets").load_all()
        measures = self._store("verification_measures").load_all()

        checks = {
            "SYS.2.RL.4_multi_dimensional_classification": {
                "description": "Requirements have functional_group, variant, or release classification",
                "passed": any(
                    r.get("functional_group") or r.get("variant") or r.get("release")
                    for r in system_reqs
                ) if system_reqs else False,
            },
            "SYS.2.RL.7_tool_attributes": {
                "description": "Requirements have associated attributes managed in tool",
                "passed": len(attrs) > 0,
            },
            "SYS.4.RL.1_entry_exit_criteria": {
                "description": "Verification selection sets define entry and exit criteria",
                "passed": any(
                    s.get("entry_criteria") and s.get("exit_criteria")
                    for s in selection_sets
                ) if selection_sets else False,
            },
            "SYS.4.RL.3_exploratory_testing": {
                "description": "Verification measures include exploratory testing technique",
                "passed": any(
                    m.get("script_type") == "exploratory"
                    for m in measures
                ),
            },
        }

        passed = sum(1 for c in checks.values() if c["passed"])
        total = len(checks)

        return {
            "checks": checks,
            "passed": passed,
            "total": total,
            "percent": int(passed / total * 100) if total > 0 else 0,
        }
