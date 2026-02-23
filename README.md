# AegisVee: Local-First Engineering OS V1.0 MVP

**AegisVee** is a **Local-First** Engineering Operating System designed for embedded systems requirements management, AI-assisted analysis, and Hardware-in-the-Loop (HIL) testing. All data is stored locally on your machine, no cloud account required.

![AegisVee Architecture](https://raw.githubusercontent.com/djhungtim/AegisVee/main/LOGO/aegis-logo.png) (Replace with actual logo if available)

## 🚀 Download V1.0 MVP Release

You can download the pre-packaged executable version directly from the Releases page:

👉 **[Download AegisVee V1.0 Release](https://github.com/AegisVee/AegisVee/releases/latest)**

1. Download `AegisVee-v1.0-win-x64.zip`.
2. Extract the ZIP file to your preferred location (e.g., `D:\AegisVee`).
3. Double-click `AegisVee.exe` to launch the application.

*Note: The first launch may take 10-30 seconds as the backend Engine Room initializes.*

---

## 🌟 Key Features

* **📊 Project Dashboard**: High-level overview of project quality gates with Traffic Light indicators (Green/Yellow/Red).
* **📝 Requirements Management**: Full CRUD interface for managing system requirements, including Excel Import/Export.
* **🔗 Engineering Canvas (OS)**: Visual 2D/3D Node Graph for traceability and system design layout.
* **🔬 V-Model Validation**: Integrated workbench bridging Requirements, Test Scripts (Python/Pytest), and Execution Reports for early HIL testing.
* **🤖 AI Engineering Assistant**: Built-in RAG-powered AI chat capable of analyzing requirement quality, generating test plans, and providing SDK code snippets (Requires [Ollama](https://ollama.com/) running locally).

---

## 🛠️ For Developers: Quick Start (Build from Source)

AegisVee consists of a Python FastAPI backend (Engine Room) and a React + Vite frontend (The Studio).

### 1. Start the Backend Engine

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Run dev server on port 8000
python -m uvicorn main:app --reload --port 8000
```

### 2. Start the Frontend Studio

```powershell
cd frontend
npm install

# Run Vite dev server
npm run dev
```

### 3. Packaging the App

To build a standalone executable:

```powershell
./package_release.ps1
```

---

## 📚 Documentation

For detailed usage instructions, please refer to the [User Manual](USER_MANUAL.md) included in this repository.

## 🛡️ License

MVP Release. All rights reserved.
