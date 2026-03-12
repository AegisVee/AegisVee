"""
AegisVee v2.0 Data Models — ASPICE SYS.1–SYS.5 Work Product Entities

This package contains 13 ASPICE work product entity models plus a generic
TraceabilityLink model. Legacy v1 models are preserved in legacy.py.

Work Product Mapping:
    WP 17-00  RequirementNode           (requirements.py)
    WP 17-54  RequirementAttribute      (requirements.py)
    WP 04-06  ArchitectureElement       (architecture.py)
    WP 17-57  SpecialCharacteristic     (architecture.py)
    WP 08-60  VerificationMeasure       (verification.py)
    WP 08-58  VerificationMeasureSelectionSet (verification.py)
    WP 06-50  IntegrationSequenceInstruction (integration.py)
    WP 11-06  IntegratedSystem          (integration.py)
    WP 03-50  VerificationMeasureData   (results.py)
    WP 15-52  VerificationResult        (results.py)
    WP 15-51  AnalysisResult            (results.py)
    WP 13-51  ConsistencyEvidence       (evidence.py)
    WP 13-52  CommunicationEvidence     (evidence.py)
    ---       TraceabilityLink          (traceability.py)
"""

# Base
from .base import BaseEntity

# SYS.1 + SYS.2: Requirements
from .requirements import SignalParameter, RequirementNode, RequirementAttribute, AIRequirement, AIRequirementList

# SYS.3: Architecture
from .architecture import ArchitectureElement, SpecialCharacteristic

# SYS.4 + SYS.5: Verification
from .verification import VerificationMeasure, VerificationMeasureSelectionSet

# SYS.4: Integration
from .integration import IntegrationSequenceInstruction, IntegratedSystem

# Results & Analysis
from .results import VerificationMeasureData, VerificationResult, AnalysisResult

# Evidence
from .evidence import ConsistencyEvidence, CommunicationEvidence

# Traceability
from .traceability import TraceabilityLink

# v2.0: AI Plugin Architecture
from .ai_plugin import AIPlugin
from .ai_settings import AIProviderConfig, FunctionModelMapping, AISettings
from .hardware import HardwareInfo, GPUStats

# Legacy (backward compatibility) — re-export all v1 models
from .legacy import (
    Requirement,
    TestStep,
    TestScript,
    StoredTestScript,
    CodeGeneration,
    RAGResponse,
    RequirementAnalysis,
    ImpactAnalysis,
)

__all__ = [
    # Base
    "BaseEntity",
    # ASPICE entities
    "SignalParameter",
    "RequirementNode",
    "RequirementAttribute",
    "AIRequirement",
    "AIRequirementList",
    "ArchitectureElement",
    "SpecialCharacteristic",
    "VerificationMeasure",
    "VerificationMeasureSelectionSet",
    "IntegrationSequenceInstruction",
    "IntegratedSystem",
    "VerificationMeasureData",
    "VerificationResult",
    "AnalysisResult",
    "ConsistencyEvidence",
    "CommunicationEvidence",
    "TraceabilityLink",
    # v2.0: AI Plugin Architecture
    "AIPlugin",
    "AIProviderConfig",
    "FunctionModelMapping",
    "AISettings",
    "HardwareInfo",
    "GPUStats",
    # Legacy
    "Requirement",
    "TestStep",
    "TestScript",
    "StoredTestScript",
    "CodeGeneration",
    "RAGResponse",
    "RequirementAnalysis",
    "ImpactAnalysis",
]
