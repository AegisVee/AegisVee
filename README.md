# AegisVee: Local-First Engineering OS V2.0.0

**AegisVee** is a **Local-First** Engineering Operating System designed for embedded systems requirements management, AI-assisted analysis, and Hardware-in-the-Loop (HIL) testing. All data is stored locally on your machine, no cloud account required.

![AegisVee Architecture](https://raw.githubusercontent.com/AegisVee/AegisVee/main/LOGO/aegis-logo.png) (Replace with actual logo if available)

## 🚀 Download V2.0.0 Release

You can download the pre-packaged executable version directly from the Releases page:

👉 **[Download AegisVee V2.0.0 Release](https://github.com/AegisVee/AegisVee/releases/latest)**

1. Download `AegisVee-v2.0.0-win-x64.zip`.
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

## ✨ What's New in V2.0.0

### 1. Hardware-in-the-Loop (HIL) Integration

AegisVee now supports connecting directly to your STM32 development boards (or other compatible hardware) to perform automated HIL testing. You can run test scripts that drive simulated inputs and collect telemetry outputs directly from the V-Model view.

### 2. Built-in Test Script Editor and Saver

You can now write and save Python/Pytest test scripts directly inside the frontend UI. The "Save Script" button in the Test Script Split View securely persists your code to the local backend storage, automatically linking tests to their designated requirements to ensure complete validation traceability.

### 3. SD Card Log Download via CSP

AegisVee introduces the capability to query and download historical log files directly from the hardware SD card using the Cubesat Space Protocol (CSP). This enables downloading historical GPS and sensor data directly into AegisVee for analysis without manually removing the SD card from the hardware.

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

V2.0.0 Release. All rights reserved.
