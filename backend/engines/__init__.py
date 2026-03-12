"""
AegisVee v2.0 Engines — ASPICE Compliance, Traceability, Consistency

- ComplianceEngine: ASPICE SYS.1-SYS.5 scorecard calculation
- TraceabilityEngine: Enhanced traceability matrix with NetworkX  
- ConsistencyEngine: Auto-detect traceability gaps and inconsistencies
- propagation_engine: Preserved from v1 (parameter template propagation)
"""

from .compliance_engine import ComplianceEngine
from .traceability_engine import TraceabilityEngine
from .consistency_engine import ConsistencyEngine
