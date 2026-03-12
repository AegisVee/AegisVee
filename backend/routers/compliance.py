"""
Compliance Router — ASPICE SYS.1-SYS.5 compliance scorecard.

Handles:
- ASPICE compliance scorecard per project
- Work product status (13 WP types)
- BGB Rating Rules check
- Consistency check via ConsistencyEngine
- Auto-generate consistency evidence
"""

from fastapi import APIRouter, HTTPException
from engines.compliance_engine import ComplianceEngine
from engines.consistency_engine import ConsistencyEngine

router = APIRouter(prefix="/api/projects/{project_id}/compliance", tags=["compliance"])


@router.get("/scorecard")
async def get_compliance_scorecard(project_id: str):
    """Get the full ASPICE SYS.1-SYS.5 compliance scorecard.

    Returns:
    - Per-process BP completion rates
    - Overall compliance percentage
    - Traceability coverage
    - Count of consistency gaps
    """
    engine = ComplianceEngine(str(project_id))
    return engine.calculate_scorecard()


@router.get("/work-products")
async def get_work_product_status(project_id: str):
    """Get status of all 13 ASPICE work product types.

    Returns each WP type with its entity count and populated/empty status.
    """
    engine = ComplianceEngine(str(project_id))
    return engine.get_work_product_status()


@router.get("/bgb-check")
async def check_bgb_rules(project_id: str):
    """Check BGB Rating Rules compliance.

    Verifies:
    - SYS.2.RL.4: Multi-dimensional classification
    - SYS.2.RL.7: Tool-managed requirement attributes
    - SYS.4.RL.1: Entry/exit criteria in selection sets
    - SYS.4.RL.3: Exploratory testing measures
    """
    engine = ComplianceEngine(str(project_id))
    return engine.check_bgb_rules()


@router.get("/consistency")
async def run_consistency_checks(project_id: str):
    """Run all automated consistency checks.

    Detects:
    - Traceability gaps
    - Status conflicts (e.g., verified requirement with no passing test)
    - Version mismatches (requirement updated after linked verification measure)
    """
    engine = ConsistencyEngine(str(project_id))
    return engine.run_all_checks()


@router.post("/consistency/generate-evidence")
async def generate_consistency_evidence(project_id: str):
    """Auto-generate ConsistencyEvidence (WP 13-51) records from detected issues.

    Creates open evidence records for all detected consistency issues.
    Returns the newly created evidence records.
    """
    engine = ConsistencyEngine(str(project_id))
    new_evidence = engine.auto_generate_evidence()
    return {
        "generated": len(new_evidence),
        "evidence": new_evidence,
    }


@router.get("/summary")
async def get_compliance_summary(project_id: str):
    """Get a high-level compliance summary combining all checks.

    Returns a single object with:
    - Overall ASPICE score
    - BGB rules status
    - Work product coverage
    - Open consistency issues
    """
    compliance_engine = ComplianceEngine(str(project_id))
    consistency_engine = ConsistencyEngine(str(project_id))

    scorecard = compliance_engine.calculate_scorecard()
    bgb = compliance_engine.check_bgb_rules()
    wp_status = compliance_engine.get_work_product_status()
    consistency = consistency_engine.run_all_checks()

    populated_wps = sum(1 for wp in wp_status if wp["status"] == "populated")
    total_wps = len(wp_status)

    return {
        "project_id": project_id,
        "aspice_overall_percent": scorecard["overall"]["percent"],
        "aspice_completed_bp": scorecard["overall"]["completed_bp"],
        "aspice_total_bp": scorecard["overall"]["total_bp"],
        "bgb_passed": bgb["passed"],
        "bgb_total": bgb["total"],
        "bgb_percent": bgb["percent"],
        "work_products_populated": populated_wps,
        "work_products_total": total_wps,
        "open_consistency_issues": consistency["total_issues"],
        "issues_by_severity": consistency["by_severity"],
    }
