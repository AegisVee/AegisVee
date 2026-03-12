# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**AegisVee MVP** is a local-first Engineering Operating System for embedded systems requirement management, AI-assisted analysis, and Hardware-in-the-Loop (HIL) testing. It is packaged as an Electron desktop app with a FastAPI backend and React + Vite frontend.

---

## Development Commands

### Full Dev Startup (Windows)
```powershell
./start_aegisvee.ps1   # Launches backend (port 8000) + frontend (port 5173) in separate windows
```

### Frontend (`frontend/`)
```bash
npm run dev             # Vite dev server at localhost:5173
npm run build           # Production build
npm run lint            # ESLint
npm run electron:dev    # Launch Electron app in dev mode
npm run electron:build  # Build distributable .exe
```

### Backend (`backend/`)
```bash
python -m venv .venv
source .venv/Scripts/activate       # Windows: .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

### Testing

**Frontend (Vitest unit tests):**
```bash
cd frontend
npm test                # Run all Vitest tests
npm test -- <file>      # Run a single test file
```

**Frontend (Cypress E2E/BDD):**
```bash
cd frontend
npx cypress open        # Interactive Cypress UI
npx cypress run         # Headless Cypress run
```

**Backend (pytest):**
```bash
cd backend
pytest                  # Run all backend tests
pytest tests/<file>.py  # Run a single test file
pytest -k "test_name"   # Run a specific test by name
```

### Production Release
```powershell
# Package standalone executable
python -m PyInstaller build_backend.spec   # Bundle backend as backend.exe
npm run electron:build                      # Bundle Electron + frontend
./package_release.ps1                      # Package final zip release
```

---

## Architecture

### System Topology (v2.0)

```
Frontend (Electron/React @ port 5173)
        ↕ HTTP + SSE
Backend (FastAPI @ port 8000)
  ├── AI Provider Manager → Ollama / llama.cpp / ONNX Runtime (pluggable)
  ├── Plugin Service → AI plugin lifecycle (install/uninstall/status)
  ├── RAG Service → LanceDB/ChromaDB + Provider Manager
  ├── Hardware Service → GPU/VRAM/RAM detection (nvidia-smi / psutil)
  ├── AI Settings Storage → data/ai_settings.json
  ├── Storage Service → JSON files (data/)
  ├── Logic Engine → Traceability & test plan generation
  ├── STM32 UART Driver → Serial/UART ↔ STM32 hardware
  └── System Monitor → psutil
```

### Backend (`backend/`)

- **`main.py`** — FastAPI app entry point: CORS config, lifespan, router registration, ProviderManager + RAG init
- **`rag_service.py`** — LlamaIndex pipeline: lazy-loads HuggingFace embeddings → LanceDB vector store → Ollama LLM. Falls back to mock responses when Ollama is unavailable.
- **`models/`** — Pydantic models (ASPICE v2 entities + v2.0 AI plugin models):
  - `requirements.py` — `RequirementNode` (with `formal_mode`, `formal_expression`, `coverage_target`), `SignalParameter`
  - `ai_plugin.py` — `AIPlugin` (runtime / model / vector_store / connector)
  - `ai_settings.py` — `AISettings`, `AIProviderConfig`, `FunctionModelMapping`
  - `hardware.py` — `HardwareInfo`, `GPUStats`
  - Plus: `architecture.py`, `verification.py`, `traceability.py`, `evidence.py`, `integration.py`, `results.py`, `legacy.py`
- **`ai_providers/`** — Pluggable AI inference providers:
  - `base.py` — Abstract `AIProvider` class
  - `ollama_provider.py` — Full Ollama API integration (list/pull/delete models, complete, stream)
  - `llamacpp_provider.py` — llama.cpp stub (P1)
  - `onnx_provider.py` — ONNX Runtime stub (P1)
  - `provider_manager.py` — Singleton managing providers + per-function model routing
- **`plugin_service.py`** — Plugin lifecycle management (list/install/uninstall)
- **`hardware_service.py`** — GPU/VRAM/RAM detection via nvidia-smi + psutil
- **`ai_settings_storage.py`** — Load/save `data/ai_settings.json`
- **`storage.py`** — JSON file persistence for requirements, projects, test scripts
- **`propagation_engine.py`** — Change propagation for `{{param}}` placeholders
- **`drawio_parser.py`** — Parses uncompressed `.drawio` (mxGraph XML)
- **`stm32_uart_driver.py`** — Serial/UART communication with STM32
- **`hil_framework.py`** — Hardware-in-the-Loop test orchestration
- **`routers/`** — One router per domain:
  - v1: `rag.py`, `projects.py`, `logic.py`, `hil.py`, `sdk.py`, `system.py`, `tests.py`, `drawio.py`
  - v2 ASPICE: `requirements.py`, `architecture.py`, `verification.py`, `traceability.py`, `compliance.py`, `evidence.py`
  - v2.0 AI: `ai_settings.py` (model/provider/mapping CRUD), `plugins.py` (plugin lifecycle)

### Frontend (`frontend/src/`)

- **`App.jsx`** — Root component: multi-view layout with left sidebar, top header, right chat panel, setup wizard
- **`hooks/useAppState.js`** — Central state hook (projects, requirements, active view, UI flags)
- **`hooks/useRAGStream.js`** — Streaming hook for SSE-based RAG responses
- **`services/api.js`** — Fetch API client for all backend calls (includes AI settings, plugins, hardware APIs)
- **`components/AISettings/`** — v2.0 AI Settings Center (AnythingLLM-style):
  - `AISettingsPage.jsx` — Main layout: left nav + right content
  - `ModelMarketplace.jsx` — Browse & install models (card grid with hardware compatibility)
  - `InstalledModels.jsx` — Manage downloaded models (table with delete)
  - `InferenceSettings.jsx` — Provider selection (Ollama / llama.cpp / ONNX Runtime)
  - `FunctionMapping.jsx` — Per-feature model assignment
  - `PerformanceMonitor.jsx` — GPU/VRAM/RAM gauges (auto-refresh)
- **`components/PluginManager/PluginManagerPage.jsx`** — Plugin management (install/uninstall AI packages)
- **`components/SetupWizard/SetupWizard.jsx`** — First-run wizard (hardware detection → AI tier → ready)
- **`components/EngineeringOS/GraphCanvas.jsx`** — Visual requirement node graph using `@xyflow/react`
- **`components/EngineeringOS/ThreeDViz.jsx`** — Three.js 3D visualization
- **`components/RequirementTable.jsx`** — Tabular requirement editor with signal parameters
- **`components/DrawioImportModal.jsx`** — draw.io import
- **`components/VModelView.jsx`** — V-Model engineering diagram
- **`components/layout/`** — `AppHeader`, `AppSidebar`, `ChatSidebar`
- **`components/templates/`** — `DashboardTemplate`, `ProjectDetailTemplate`
- **`components/atoms/`, `molecules/`, `organisms/`** — Atomic design component hierarchy

### Electron (`frontend/electron/`)

- **`main.cjs`** — Electron main process: spawns Python backend subprocess, manages app lifecycle
- **`preload.js`** — IPC bridge between renderer and system

---

## Key Conventions & Patterns

### API Layer
- All backend endpoints are under `/api/<domain>/`
- AI features use **Server-Sent Events (SSE)** for streaming responses; non-streaming endpoints use standard JSON
- The RAG service initializes lazily on first request; `main.py` starts it in a background thread on startup

### State Management
- Frontend uses a single custom hook (`useAppState`) for global state — no Redux or Zustand
- Components receive state and callbacks via props from `App.jsx`

### Data Persistence
- Requirements: `backend/data/requirements.json` — each entry may include `parameters` (list of `SignalParameter`) and `linkedTestIds`
- Projects: `backend/data/projects.json`
- Test scripts: `backend/data/test_scripts.json` — stored separately, linked to requirements via `requirement_id` and `linkedTestIds`
- AI settings: `backend/data/ai_settings.json` — active provider, function-to-model mappings, GPU allocation
- Plugin registry: `backend/data/ai_plugins_registry.json` — built-in plugin catalog (runtimes, models, vector stores)
- Vector embeddings: `backend/lancedb/` and `backend/chroma_db/`

### Mock/Fallback Mode
- When no AI provider is available, `rag_service.py` returns clearly-labeled mock responses via `MockQueryEngine`
- The `ProviderManager` selects the active provider from `ai_settings.json`; if the provider is offline, RAG falls back to mock
- The app is fully functional without any AI provider; only AI features degrade

### UI Framework
- Primary UI: **Ant Design (antd 5.x)** — use `antd` components before reaching for custom HTML
- Graph: **@xyflow/react** for node/edge diagrams
- Code editor: **@monaco-editor/react**

### Signal Parameter Propagation

Requirements support named signal parameters (name / type / value / unit). Use `{{param_name}}` in `description`, `testSteps`, `expectedResult`, and test script `content`. When any parameter changes:

1. Call `POST /api/requirements/{id}/propagate` with the updated `parameters` list
2. `propagation_engine.propagate_change()` replaces all `{{placeholders}}` in the requirement's text fields and in every linked test script's `content`
3. `parameters_snapshot` on each test script is updated to record the applied values

Link a test script to a requirement by setting `requirement_id` on the script and adding its ID to `linkedTestIds` on the requirement (done automatically by `storage.add_test_script()`).

### draw.io Import

Only **uncompressed** `.drawio` files are supported (File → Export as → XML with "Uncompressed XML" checked in draw.io desktop). The parser reads `mxCell[vertex=1]` as blocks and `mxCell[edge=1]` as connections; blocks without a label are ignored.

---

## External Services

| Service | Port | Purpose | Required? |
|---------|------|---------|-----------|
| FastAPI backend | 8000 | All API calls | Yes (dev) |
| Vite dev server | 5173 | Frontend | Yes (dev) |
| Ollama | 11434 | Local LLM inference | No (falls back to mock) |

To install an Ollama model:
```bash
ollama pull llama3.2   # Recommended (lightweight)
ollama pull llama3.1   # Larger, needs 16 GB+ RAM
```
