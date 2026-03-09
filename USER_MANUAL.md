# AegisVee User Manual

AegisVee is a local-first Engineering Operating System for embedded systems requirement management, AI-assisted analysis, and Hardware-in-the-Loop (HIL) testing. It runs as an Electron desktop app with a FastAPI backend and React frontend.

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Application Layout](#2-application-layout)
3. [Dashboard](#3-dashboard)
4. [Engineering OS (Canvas View)](#4-engineering-os-canvas-view)
5. [Requirements Management](#5-requirements-management)
6. [V-Model Validation](#6-v-model-validation)
7. [Knowledge Base](#7-knowledge-base)
8. [AI Settings](#8-ai-settings)
9. [Plugin Manager](#9-plugin-manager)
10. [Console Panel](#10-console-panel)
11. [AI Assistant (Chat)](#11-ai-assistant-chat)
12. [Setup Wizard](#12-setup-wizard)
13. [Keyboard Shortcuts](#13-keyboard-shortcuts)
14. [Troubleshooting](#14-troubleshooting)

---

## 1. Getting Started

### System Requirements

- **OS:** Windows 10/11 (64-bit)
- **Runtime:** Node.js 18+, Python 3.10+
- **RAM:** 8 GB minimum (16 GB+ recommended for AI features)
- **Optional:** NVIDIA GPU with CUDA support for local LLM inference

### Installation from Release

1. Download the latest release ZIP from the releases page.
2. Extract to a folder of your choice.
3. Run `AegisVee.exe` to launch.

### Installation from Source

```bash
# Clone the repository
git clone <repo-url>
cd aegis-vee-mvp

# Backend setup
cd backend
python -m venv .venv
source .venv/Scripts/activate   # Windows: .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Frontend setup
cd ../frontend
npm install

# Start both (Windows PowerShell)
cd ..
./start_aegisvee.ps1
```

### First Launch

On first launch, the **Setup Wizard** guides you through:
1. **Hardware Detection** -- Detects your GPU, VRAM, and RAM
2. **AI Tier Recommendation** -- Suggests an AI configuration based on your hardware
3. **Ready** -- You're all set to begin

![Getting Started](docs/gifs/getting-started.gif)

### Connecting Ollama (Optional)

AegisVee works fully without AI, but for AI-powered features:

```bash
# Install Ollama from https://ollama.ai
ollama pull llama3.2     # Lightweight model (~4 GB)
ollama pull gemma3:4b    # Alternative
```

AegisVee auto-detects Ollama on port 11434. If unavailable, AI features return clearly-labeled mock responses.

---

## 2. Application Layout

![App Layout](docs/gifs/app-layout.gif)

The AegisVee interface consists of five main areas:

```
+------------------------------------------------------------------+
|  [Logo] AegisVee  |  Project Name  |  Search  | ? | N | C | AI | A |
+------+-----------------------------------------------------------+
|      |                                                    |      |
| Side |              Main Content Area                     | Chat |
| bar  |                                                    |  or  |
|      |              (changes per view)                    |Console|
|      |                                                    |      |
+------+-----------------------------------------------------------+
```

| Area | Description |
|------|-------------|
| **Header** | Logo, project name, search bar, help, notifications, console, AI assistant, user avatar |
| **Left Sidebar** | Customizable navigation icons. Click `+` at the bottom to add more features |
| **Main Content** | Changes based on selected view (Dashboard, Engineering OS, Requirements, etc.) |
| **Right Panel** | Either the AI Chat sidebar or the Console panel (mutually exclusive) |
| **Performance Overlay** | Bottom-right corner showing FPS and API latency |

### Customizing the Sidebar

The left sidebar starts with **Dashboard** and **Engineering OS**. To add more views:

1. Click the `+` button at the bottom of the sidebar
2. Select a feature from the dropdown (Requirements, Validation, Knowledge Base, AI Settings, etc.)
3. Right-click a sidebar item to remove it

---

## 3. Dashboard

The Dashboard provides a bird's-eye view of all your projects using **traffic light cards**.

![Dashboard](docs/gifs/dashboard.gif)

### Project Cards

Each card displays:
- **Project name** (e.g., "Braking System (ABS)")
- **Status indicator**: Green (Ready), Yellow (Review Needed), Red (Critical Failures)
- **Metrics**: Traceability percentage and other KPIs

### Creating a Project

1. Click the **Add Project** button in the top-right of the Dashboard
2. Enter a project name in the modal
3. Click **Create** -- the project appears as a new card

### Opening a Project

Click any project card to open the **Project Detail** view, which shows:
- Requirements table for that project
- Project-specific metrics
- Import/Export options

### Import/Export

- **Import**: Upload `.aegis` files or Excel spreadsheets with requirements
- **Export**: Download requirements as `.xlsx` or project snapshots as `.aegis`

---

## 4. Engineering OS (Canvas View)

The Engineering OS provides a 2D node graph for visual system design and requirement traceability.

![Engineering OS](docs/gifs/engineering-os.gif)

### Navigation

- **Pan**: Click and drag on empty canvas space
- **Zoom**: Mouse scroll wheel
- **Select**: Click a node
- **Multi-select**: Shift + click or drag a selection box

### Creating Nodes (Right-Click Menu)

Right-click on empty canvas space to open the context menu:

| Node Type | Description |
|-----------|-------------|
| **Project Link** | Creates a new project (synced to Dashboard). You'll be prompted to enter a name. |
| **Requirement** | Creates a new requirement under the currently selected project. |
| **System Component** | Creates a system architecture component node. |
| **Glass Infra** | Creates an infrastructure node for glass/visual components. |

### Connecting Nodes

1. Hover over a node to see connection handles (top and bottom)
2. Click and drag from one handle to another node's handle
3. A dialog appears asking for the **relation type** (e.g., "traces_to", "verifies", "derives_from")
4. The edge is created with the selected label

### Node Context Menu (Right-Click on Node)

Right-click on an existing node to:
- **Edit** -- Open the requirement editor
- **Verify** -- Run verification checks
- **Generate AI Test Plan** -- Create test plans using AI
- **Delete** -- Remove the node (projects are also deleted from the backend)

### Toolbar Actions

| Button | Action |
|--------|--------|
| **Save** | Export the current graph state as a `.aegis` snapshot |
| **Load** | Import a previously saved snapshot |
| **Export PNG** | Save the canvas as an image |

### 2D/3D Toggle

Use the toggle switch in the bottom-right corner to switch between:
- **2D Canvas** (default) -- Full interactive node graph
- **3D View** -- Three.js 3D visualization of the system graph

---

## 5. Requirements Management

The Requirements view provides a tabular editor for managing project requirements.

### Requirement Table

Each requirement has:

| Field | Description |
|-------|-------------|
| **ID** | Auto-generated (e.g., REQ-101) |
| **Description** | Free-text description of the requirement |
| **Test Steps** | Steps to verify the requirement |
| **Expected Result** | What should happen when test passes |
| **Status** | Pending, Passed, Failed |

### Creating Requirements

1. Navigate to a project (click a project card in Dashboard)
2. Click the **Add Requirement** button
3. Fill in the fields and save

### Signal Parameters

Requirements support named signal parameters for parameterized testing:

| Field | Example |
|-------|---------|
| **Name** | `brake_pressure` |
| **Type** | `float` |
| **Value** | `15.0` |
| **Unit** | `MPa` |

Use `{{param_name}}` placeholders in description, test steps, expected result, and linked test scripts. When a parameter value changes, use the **Propagate** button to update all occurrences automatically.

### Excel Import/Export

- **Import**: Upload an `.xlsx` file with columns: `id`, `description`, `testSteps`, `expectedResult`, `status`
- **Export**: Download all requirements as an Excel spreadsheet

### draw.io Import

Import architecture diagrams from draw.io:

1. In draw.io, export as **XML** with "Uncompressed XML" checked
2. In AegisVee, click **Import draw.io** and select the `.drawio` file
3. Blocks become nodes, connections become edges

> **Note:** Only uncompressed `.drawio` XML files are supported.

### Monaco Editor

Below the requirements table, a Monaco-based code editor allows editing requirement descriptions with syntax highlighting. Click **Save Changes** to persist edits.

---

## 6. V-Model Validation

The V-Model view displays the classic V-Model engineering lifecycle diagram, connecting:
- Left side: Requirements decomposition (System → Software → Unit)
- Right side: Verification stages (Unit Test → Integration Test → System Test)

Use this view to visually track which requirements have corresponding test coverage at each level.

---

## 7. Knowledge Base

The Knowledge Base uses RAG (Retrieval-Augmented Generation) to answer questions about your project data.

### Querying

1. Navigate to the Knowledge Base view
2. Type a question about your requirements, architecture, or testing
3. The system retrieves relevant documents and generates an AI response

### Ingesting Documents

1. Click **Ingest** to upload documents (PDF, text files, etc.)
2. Click **Train** to index the new documents
3. Future queries will include knowledge from ingested documents

---

## 8. AI Settings

The AI Settings Center provides AnythingLLM-style configuration for local AI inference.

![AI Settings](docs/gifs/ai-settings.gif)

### Sections

| Section | Description |
|---------|-------------|
| **Model Marketplace** | Browse available models with hardware compatibility indicators. Click **Install** to download. |
| **Installed Models** | View and manage downloaded models. Delete unused models to free disk space. |
| **Inference Settings** | Select the active AI provider: Ollama, llama.cpp, or ONNX Runtime |
| **Function Mapping** | Assign specific models to specific features (RAG queries, requirement analysis, etc.) |
| **Performance Monitor** | Real-time GPU/VRAM/RAM usage gauges with auto-refresh |

### Changing the AI Provider

1. Open AI Settings from the sidebar
2. Go to **Inference Settings**
3. Select your preferred provider (Ollama is recommended for ease of use)
4. The change takes effect immediately

---

## 9. Plugin Manager

The Plugin Manager allows installing and managing AI extension packages.

### Available Plugins

Plugins provide additional capabilities such as:
- Alternative model runtimes
- Vector store backends (LanceDB, ChromaDB)
- Custom connectors

### Installing a Plugin

1. Open Plugin Manager from the sidebar
2. Browse the plugin catalog
3. Click **Install** on the desired plugin
4. Wait for installation to complete

### Uninstalling

Click the **Uninstall** button next to any installed plugin to remove it.

---

## 10. Console Panel

The Console panel displays real-time system logs from the AegisVee backend.

![Console Panel](docs/gifs/console-panel.gif)

### Opening the Console

Click the **Console** button (terminal icon) in the header bar, between Notifications and AI Assistant.

> **Note:** The Console and AI Chat panels are mutually exclusive -- opening one closes the other.

### Log Entries

Each log entry shows:
- **Timestamp** -- `HH:MM:SS.mmm` format
- **Level** -- Color-coded tag: INFO (green), WARN (amber), ERROR (red), DEBUG (blue)
- **Source** -- Origin of the log: `api`, `system`, `rag`, `plugin`, `ai_provider`
- **Message** -- The log content (e.g., `GET /api/projects [200] 12ms`)

### Filtering

- **Level Filter**: Use the dropdown to filter by log level (All, Info, Warn, Error, Debug)
- **Search**: Type in the search box to filter logs by message content

### Clearing Logs

Click the **Clear** button (eraser icon) in the console header to clear all logs.

### Real-Time Streaming

The console uses Server-Sent Events (SSE) to stream logs in real-time. Logs appear as they occur with no manual refresh needed.

---

## 11. AI Assistant (Chat)

The AI Assistant provides a chat interface for interacting with the RAG-powered AI.

![AI Assistant](docs/gifs/ai-assistant.gif)

### Opening the Chat

Click the **AI Assistant** button (robot icon) in the header bar.

### Sending Queries

1. Type your question in the text area at the bottom
2. Press **Enter** or click the send button
3. The AI streams its response in real-time

### Checking Requirements

When a requirement is selected:
1. A **Check Requirement** button appears at the bottom of the chat
2. Click it to have the AI analyze the requirement for clarity, testability, and best practices

### Active Model

The current AI model is displayed as a tag in the chat header (e.g., `gemma3:4b`).

---

## 12. Setup Wizard

The Setup Wizard runs automatically on first launch.

### Steps

1. **Hardware Detection**
   - Detects your CPU, RAM, GPU, and VRAM
   - Displays detected hardware in a summary

2. **AI Tier Recommendation**
   - Based on your hardware, recommends an AI tier:
     - **Tier 1** (8 GB+ VRAM): Full AI with large models
     - **Tier 2** (4-8 GB VRAM): Medium models
     - **Tier 3** (CPU only): Small models or mock mode

3. **Ready**
   - Setup complete -- click **Get Started** to enter the app

### Re-running the Wizard

To re-run the setup wizard, clear your browser's localStorage entry for `aegisvee_setup_complete`:

```javascript
// In browser console
localStorage.removeItem('aegisvee_setup_complete');
// Then reload the app
```

---

## 13. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Open search |
| `Cmd/Ctrl + S` | Save current changes |
| `Cmd/Ctrl + R` | Run test |
| `Enter` | Send chat message (in AI Assistant) |
| `Shift + Enter` | New line in chat input |

---

## 14. Troubleshooting

### Backend Not Starting

**Symptom:** Frontend loads but shows connection errors.

**Fix:**
1. Ensure Python environment is activated
2. Check that port 8000 is not in use: `netstat -ano | findstr :8000`
3. Start manually: `cd backend && python -m uvicorn main:app --reload --port 8000`

### AI Features Returning Mock Data

**Symptom:** AI responses are prefixed with "[Mock Response]".

**Fix:**
1. Install Ollama: https://ollama.ai
2. Pull a model: `ollama pull llama3.2`
3. Verify Ollama is running: `curl http://localhost:11434/api/tags`
4. Restart the AegisVee backend

### draw.io Import Failing

**Symptom:** Import shows no nodes or throws an error.

**Fix:** Ensure you exported from draw.io as **uncompressed XML**:
1. In draw.io: File > Export as > XML
2. Check "Uncompressed XML" before saving
3. Re-import the file

### Console Not Showing Logs

**Symptom:** Console panel opens but stays empty.

**Fix:**
1. Verify the backend is running on port 8000
2. Check browser console for SSE connection errors
3. Perform any action (navigate, create a requirement) to generate logs

### Performance Issues

**Symptom:** UI feels slow or unresponsive.

**Fix:**
1. Check GPU stats in AI Settings > Performance Monitor
2. If VRAM is full, close other GPU-intensive applications
3. Switch to a smaller AI model in AI Settings > Function Mapping
4. Disable the 3D view if active (use 2D Canvas instead)

### Port Conflicts

If ports 5173 or 8000 are in use:

```bash
# Find processes using the ports
netstat -ano | findstr :5173
netstat -ano | findstr :8000

# Kill the process (replace PID)
taskkill /PID <PID> /F
```

---

## External Services Reference

| Service | Port | Purpose | Required? |
|---------|------|---------|-----------|
| FastAPI backend | 8000 | All API calls | Yes |
| Vite dev server | 5173 | Frontend (dev mode) | Yes (dev) |
| Ollama | 11434 | Local LLM inference | No (falls back to mock) |

---

*AegisVee -- Engineering Operating System for Embedded Systems*
