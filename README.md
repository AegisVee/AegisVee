# AegisVee v3.0.0

AegisVee is a local-first Engineering Operating System for embedded systems requirement management, AI-assisted analysis, and Hardware-in-the-Loop (HIL) testing.

## Download

Get the latest packaged build from GitHub Releases:

[Download Latest AegisVee Release](https://github.com/AegisVee/AegisVee/releases/latest)

For v3.0.0, the standard package name is:

- `AegisVee-Core-v3.0.0-win-x64.zip`

Optional Team package:

- `AegisVee-Team-v3.0.0-win-x64.zip`

## Quick Start

1. Download and extract the ZIP file.
2. Run `AegisVee.exe`.
3. On first launch, complete the Setup Wizard (hardware detection, AI tier recommendation, ready).

## Core Capabilities

- Project dashboard with quality indicators
- Requirement and traceability management
- Engineering OS node canvas with 2D/3D views
- AI-assisted analysis (RAG chat with fallback mock mode)
- AI Settings Center (provider/model/function mapping/performance monitor)
- Plugin manager for AI extensions
- V-model and verification workflow support
- Draw.io import and requirement parameter propagation

## Build From Source (Windows)

### Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

### Desktop Package

```powershell
cd backend
python -m PyInstaller build_backend.spec --clean -y

cd ../frontend
npm run electron:build

cd ..
.\package_release.ps1 -Edition Core
```

## Documentation

See the full user guide here:

[USER_MANUAL.md](USER_MANUAL.md)
