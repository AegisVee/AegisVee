# AegisVee User Manual (v3.0.0)

AegisVee is a local-first Engineering Operating System for embedded systems requirement management, AI-assisted analysis, and Hardware-in-the-Loop (HIL) testing.

---

## 1. System Overview

AegisVee consists of:

- Electron desktop shell (Windows)
- React + Vite frontend
- FastAPI backend
- Optional local AI runtime (Ollama, llama.cpp, or ONNX Runtime)

Core architecture path:

- Frontend: `frontend/`
- Backend: `backend/`
- Packaging script: `package_release.ps1`

---

## 2. System Requirements

Minimum:

- Windows 10/11 (64-bit)
- 8 GB RAM
- Python 3.10+
- Node.js 18+

Recommended for local AI:

- 16 GB RAM or more
- NVIDIA GPU with sufficient VRAM
- Ollama installed and running on `http://localhost:11434`

---

## 3. Installation

### 3.1 Install from Release ZIP

1. Download the latest release package from GitHub Releases.
2. Extract the ZIP to a writable folder.
3. Run `AegisVee.exe`.

### 3.2 Build from Source

Backend:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

Frontend:

```powershell
cd frontend
npm install
npm run dev
```

All-in-one startup (Windows):

```powershell
./start_aegisvee.ps1
```

---

## 4. First Launch and Setup Wizard

On first launch, Setup Wizard guides you through:

1. Hardware detection (CPU, RAM, GPU, VRAM)
2. AI tier recommendation
3. Ready state

If no AI provider is available, AegisVee still works in fallback mock mode for AI functions.

---

## 5. Main UI Areas

AegisVee layout includes:

- Top header: project context, controls, assistant/console toggles
- Left sidebar: view navigation and quick module switching
- Main workspace: active module content
- Right panel: AI Assistant chat or Console panel

---

## 6. Dashboard and Project Management

Dashboard provides project-level visibility and health tracking.

Typical actions:

- Create a project
- Open project detail
- Import/export project requirement data
- Review status and quality indicators

Data files:

- Projects: `backend/data/projects.json`
- Requirements: `backend/data/requirements.json`

---

## 7. Engineering OS (Canvas)

Engineering OS provides a graph-based view for requirement and architecture relationships.

Capabilities:

- Add and edit nodes
- Connect nodes with typed relations
- Save/load graph snapshots
- Export graph views
- Switch 2D canvas and 3D visualization

Key frontend files:

- `frontend/src/components/EngineeringOS/GraphCanvas.jsx`
- `frontend/src/components/EngineeringOS/ThreeDViz.jsx`

---

## 8. Requirements Management

Requirements view supports structured requirement editing and traceability.

Key fields include:

- Requirement ID
- Description
- Test steps
- Expected result
- Status
- Optional signal parameters

### 8.1 Parameter Placeholder Propagation

You can define placeholders such as `{{brake_pressure}}` in requirement text and linked test script content.

When parameter values change:

1. Frontend calls `POST /api/requirements/{id}/propagate`
2. Backend propagation engine updates all placeholders
3. Linked test script `parameters_snapshot` is refreshed

Related backend components:

- `backend/propagation_engine.py`
- `backend/storage.py`

---

## 9. Draw.io Import

AegisVee supports **uncompressed** `.drawio` XML import.

Flow:

1. Export from draw.io as XML with "Uncompressed XML" enabled
2. Import in AegisVee
3. Vertices become blocks/nodes, edges become graph links

Parser file:

- `backend/drawio_parser.py`

---

## 10. V-Model and Verification

V-Model view aligns requirements and verification stages.

You can:

- Check mapping from requirements to tests
- Track coverage progression
- Review verification readiness in project lifecycle

---

## 11. AI Assistant and RAG

AI features use SSE streaming for responses.

Behavior:

- If active provider is available, responses come from configured model/runtime
- If provider is unavailable, AegisVee returns clearly-labeled mock responses

Backend components:

- `backend/rag_service.py`
- `backend/ai_providers/provider_manager.py`
- `backend/routers/rag.py`

---

## 12. AI Settings Center

AI Settings module includes:

- Model Marketplace
- Installed Models
- Inference Settings
- Function Mapping
- Performance Monitor

You can:

- Select active provider (`Ollama`, `llama.cpp`, `ONNX Runtime`)
- Assign per-function model routing
- Monitor resource usage

Settings storage:

- `backend/data/ai_settings.json`

---

## 13. Plugin Manager

Plugin Manager handles install/uninstall/status of AI extensions.

Storage:

- Registry: `backend/data/ai_plugins_registry.json`

Service layer:

- `backend/plugin_service.py`
- `backend/routers/plugins.py`

---

## 14. Console Panel

Console shows backend and system events in real time.

Use it to:

- Inspect API request flow
- Observe warnings/errors
- Debug runtime behavior while testing

---

## 15. Hardware-in-the-Loop (HIL)

AegisVee includes HIL-oriented backend components for embedded validation.

Related files:

- `backend/stm32_uart_driver.py`
- `backend/hil_framework.py`
- `backend/routers/hil.py`

Use HIL to connect requirements and executable verification in hardware-connected scenarios.

---

## 16. Packaging and Release

### 16.1 Build backend executable

```powershell
cd backend
python -m PyInstaller build_backend.spec --clean -y
```

### 16.2 Build Electron app

```powershell
cd frontend
npm run electron:build
```

### 16.3 Create release ZIP

```powershell
cd ..
.\package_release.ps1 -Edition Core
```

Optional Team package:

```powershell
.\package_release.ps1 -Edition Team
```

Output folder:

- `release/`

---

## 17. Troubleshooting

### Backend is not reachable

- Check port `8000` occupancy:

```powershell
netstat -ano | findstr :8000
```

- Restart backend service.

### Frontend cannot connect to backend

- Confirm backend is listening on `http://localhost:8000`
- Check firewall/security policy

### AI returns mock responses

- Confirm Ollama is running
- Confirm selected provider in AI Settings
- Confirm model is installed

### Draw.io import has no nodes

- Re-export as uncompressed XML

### Packaging fails

- Confirm backend executable exists in expected `dist` path
- Confirm Electron build completed and `win-unpacked` was generated
- Close running `AegisVee.exe` before zipping

---

## 18. Data and Persistence Summary

Primary local data files:

- `backend/data/projects.json`
- `backend/data/requirements.json`
- `backend/data/test_scripts.json`
- `backend/data/ai_settings.json`
- `backend/data/ai_plugins_registry.json`

Vector stores:

- `backend/lancedb/`
- `backend/chroma_db/`

---

## 19. Version

This manual corresponds to:

- AegisVee `v3.0.0`
- Windows packaged distribution naming:
  - `AegisVee-Core-v3.0.0-win-x64.zip`
  - `AegisVee-Team-v3.0.0-win-x64.zip`

---

## 20. Fan Project Import (v3.0.0 EXE)

Repository includes:

- `fan_project_v3.0.0.aegis`

Import steps in AegisVee v3.0.0:

1. Open AegisVee.
2. Go to **Dashboard**.
3. Click **Import System**.
4. Select `fan_project_v3.0.0.aegis`.
5. Wait for success message, then refresh/open the imported project.
