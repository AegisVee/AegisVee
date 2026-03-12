# PRD Gap Analysis — AegisVee vs. Flow + Valispace PRD (v1.0, 2026-03-11)

## Executive Summary

The PRD describes a unified **aerospace/defense requirements management platform** combining **Flow** (test orchestration + AI + compliance) and **Valispace** (data-driven system engineering with parametric "Valis"). The current AegisVee codebase is a solid **ASPICE-aligned automotive requirements tool** with requirement CRUD, AI-assisted generation, traceability, and test management. However, **large portions of the PRD—especially the Valispace block/parameter engine and advanced V&V rule automation—are not yet implemented**.

---

## Completed / Substantially Implemented  ✅

| PRD Area | PRD IDs | AegisVee Status |
|---|---|---|
| Requirement CRUD (create/edit/delete/list) | REQ-101, REQ-105 | ✅ `routers/requirements.py` — full CRUD + bulk import |
| CSV/XLSX import with column mapping | REQ-101, REQ-104 | ✅ `import-smart` endpoint + `RequirementTable.jsx` |
| Parent-child hierarchy (`parent_id`) | REQ-201 | ✅ `GET /requirements/tree` + `FlowTreeView.jsx` |
| Requirement states: Draft / In Review / Final | REQ-301 | ✅ Status field in data model; UI dropdown present |
| Version counter on each requirement | REQ-306 | ✅ `version` field incremented on update |
| Change history / audit log | REQ-303 | ✅ `traceability_engine.py` + `traceability.py` router |
| AI-powered requirement drafting (ValiAssistant) | REQ-103, REQ-1101 | ✅ `rag_service.py` + `rag.py` router; `KnowledgePanel.jsx` |
| AI inconsistency/duplicate detection | REQ-1002 | ✅ `consistency_engine.py` |
| Downstream impact analysis | REQ-1102 | ✅ `ImpactAnalysisModal.jsx` + `demo_impact_analysis.py` |
| Re-verification flag after upstream change | REQ-1202 | ✅ `propagation_engine.py` |
| V-cycle test management (steps, runs, pass/fail) | REQ-701–705 | ✅ `TestCasePanel.jsx` + `TestRunModal.jsx` |
| Evidence upload | REQ-803 | ✅ `routers/evidence.py` |
| V&V Activities (link to requirements) | REQ-801, REQ-802 | ✅ `VnVView.jsx` + `VnVRuleEditor.jsx` |
| Regulatory compliance tracking | REQ-1301, REQ-1302 | ✅ `compliance_engine.py` + `routers/compliance.py` |
| Full traceability matrix | NFR-401, NFR-402 | ✅ `traceability.py` + `CoveragePanel.jsx` |
| REST API | NFR-105 | ✅ FastAPI back-end with 18 routers |
| Customizable table views / filtering / sorting | NFR-201 | ✅ `RequirementTable.jsx` |
| Hierarchical system breakdown sidebar | REQ-401 | ✅ `FlowHierarchySidebar.jsx` + `BlocksView.jsx` (partial) |
| Connections graph | REQ-202, NFR-203 | ✅ `GraphCanvas.jsx` |
| Requirements-to-blocks linking | REQ-601, REQ-602 | ✅ `BlockPropertyEditor.jsx` |

---

## Gaps — Not Yet Implemented (or Skeleton Only) ❌

### 3.2 System Design & Architecture — Valispace "Valis" (CRITICAL GAP)

The entire parametric engineering layer is missing. This is the **biggest gap** vs. the PRD.

| REQ ID | Requirement | Gap Description |
|---|---|---|
| REQ-501 | Numeric Vali with unit + formula; Matrix; Textvali; Datevali; Dataset | No Vali type system. `parameters[]` on requirements is a flat untyped list. |
| REQ-502 | `$Block.Vali` reference formulas with auto-recalculation | No formula engine. No `$` notation. |
| REQ-503 | `soc()` — Sum of Children aggregation up the hierarchy | No rollup engine. |
| REQ-504 | Configurable Valitypes (Mass, DeltaV, Cost, Power, Length…) | No Valitype registry. |
| REQ-505 | Margin+ / Margin− (%) with worst-case propagation | No margin model. |
| REQ-506 | Budget view: mass/power breakdown table + pie chart per `soc()` Vali | No Budget view. `EngineeringValuesTable.jsx` is a skeleton. |
| REQ-507 | Display unit conversion (g ↔ kg, etc.) | Not implemented. |
| REQ-508 | Cross-project Vali referencing | Not implemented. |

**Root cause:** `BlocksView.jsx` and `EngineeringValuesTable.jsx` exist as UI shells, but the backend has no `/api/projects/{id}/blocks/{id}/valis` endpoints and no formula/aggregation engine.

---

### 3.4.2 Automated V&V Rules (CRITICAL GAP)

| REQ ID | Requirement | Gap Description |
|---|---|---|
| REQ-901 | Define boolean V&V rules using `$Block.Vali < $Req.vali` notation | `VnVRuleEditor.jsx` has a text input for rules, but no parser or evaluator exists in the backend. |
| REQ-902 | Continuous evaluation — rules auto-update when Vali values change | No reactive rule engine. |
| REQ-903 | Real-time resolved values shown under rule expression | No value resolution. |
| REQ-804 | Requirements table: V&V Activities col + V&V Status (X/Y) + V&V Rules col | V&V columns partially shown but Rule pass/fail count not computed. |

---

### 3.1.1 — Valify (Quantifiable Value Extraction)

| REQ ID | Requirement | Gap Description |
|---|---|---|
| REQ-102 | Valify: extract quantities (300g, 50dB, 50W) from text → Valis | AI import parses requirements but does not auto-create Vali entries for extracted numbers. |
| REQ-103 | ValiAssistant: "Valify Requirements" action | Listed in `rag_service.py` prompt templates is basic; dedicated Valify extraction + Vali creation flow absent. |

---

### 3.1.2 — Connections & Cross-Specification

| REQ ID | Requirement | Gap Description |
|---|---|---|
| REQ-203 | Multiple specifications per project (e.g., Stakeholder_requirements, Fan_Specs) | Single flat requirement list per project; no formal Specification entity. |
| REQ-204 | AI-powered requirement breakdown via ValiAssistant | AI can generate, but structured "break this into children" wizard is absent. |

---

### 3.1.3 — Lifecycle Management

| REQ ID | Requirement | Gap Description |
|---|---|---|
| REQ-302 | Bulk state updates with confirmation dialog | Bulk edit exists but confirmation dialog for state transitions is absent. |
| REQ-304 | Auto-transition to Draft/In Review when key fields edited | Not implemented. |
| REQ-305 | Change request workflow (proposed changes, approval, bypass review, AI review) | No formal change request entity or workflow; history is logged but no approval gate. |

---

### 3.2.1 — Block Hierarchy Enhancements

| REQ ID | Requirement | Gap Description |
|---|---|---|
| REQ-402 | Auto-inherit Valitypes on block creation | No Valitype inheritance. |
| REQ-403 | Drag-and-drop block reordering | `FlowHierarchySidebar.jsx` is a static tree; no DnD logic. |
| REQ-404 | Block Info / Properties / Requirements tabs | `BlockPropertyEditor.jsx` exists but is minimal; no tab switching between Info/Props/Reqs. |
| REQ-603 | New requirements in block context auto-link to that block | Not enforced. |

---

### 4.1 Integrations

| REQ ID | Requirement | Gap Description |
|---|---|---|
| NFR-101 | Python integration (link analysis scripts to requirements) | Basic plugin system exists (`plugin_service.py`) but no structured Python output → Vali link. |
| NFR-104 | Google Sheets / Excel integration for driving verification | Excel import works; live Google Sheets sync absent. |
| NFR-102 | GitHub integration | Not implemented. |
| NFR-103 | Matlab integration | Not implemented. |
| NFR-106 | Siemens NX integration | Not implemented (labelled "planned"). |
| NFR-107 | Ansys integration | Not implemented (labelled "planned"). |

---

### 4.2–4.3 UI & Collaboration

| REQ ID | Requirement | Gap Description |
|---|---|---|
| NFR-202 | Inline cell editing of Vali values in table | Inline edit works for requirement text; no Vali cell editing. |
| NFR-204 | Rich-text editor (bold, italic, color, alignment) in requirement text | Plain textarea; no rich text. |
| NFR-302 | Private vs. public saved views | Not implemented. |
| NFR-303 | Subscription notifications for requirement changes | Not implemented. |
| NFR-403 | Tags on Valis and blocks | Tags on requirements exist; Vali/block-level tags absent. |

---

## Priority Breakdown

| Priority | Count | Notes |
|---|---|---|
| **Must Have — Implemented** | ~22 | Core CRUD, AI, test management, traceability |
| **Must Have — GAP** | ~18 | Entire Vali engine, V&V rules engine, Valify, multi-spec, change requests |
| **Should Have — GAP** | ~8 | Auto state transitions, DnD blocks, rich text, subscriptions, saved views |
| **Could Have — GAP** | ~5 | Cross-project Valis, GitHub/Matlab/NX/Ansys integrations |

---

## Recommended Build Priority

```
Phase 1 — Vali Data Model & Engine (CRITICAL)
  ├── Backend: /blocks/{id}/valis CRUD + Valitype registry
  ├── Backend: Formula parser ($notation, soc())
  ├── Backend: Margin & worst-case propagation
  └── Frontend: Budget view (table + pie chart)

Phase 2 — V&V Rules Engine
  ├── Backend: Rule parser + evaluator against live Vali values
  ├── Backend: Reactive re-evaluation on Vali change
  └── Frontend: Rules column in requirements table with resolved values

Phase 3 — Valify + Multi-specification
  ├── Backend: NLP quantity extraction → auto-create Valis
  ├── Backend: Specification entity (multi-spec per project)
  └── Frontend: Specification switcher in requirements header

Phase 4 — Change Request Workflow
  ├── Backend: ChangeRequest entity + approval states
  └── Frontend: Proposed-change review panel

Phase 5 — Integrations & UX Polish
  ├── Google Sheets live sync
  ├── Rich text editor (Tiptap / Quill)
  ├── DnD block reordering
  └── Subscription notifications
```
