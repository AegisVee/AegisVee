# AegisVee — Installation Guide

> **AegisVee** is a local-first Engineering Operating System designed for embedded systems requirement management, AI-assisted analysis, and Hardware-in-the-Loop (HIL) testing.

---

## 📋 System Requirements

| Item       | Minimum                                                              |
| ---------- | -------------------------------------------------------------------- |
| OS         | Windows 10 (64-bit) or later                                         |
| RAM        | 8 GB (16 GB recommended)                                             |
| Disk Space | 3 GB+ free space                                                     |
| Network    | Only needed to install Ollama; the app itself runs fully offline     |

---

## 🚀 Quick Start

### Step 1: Download AegisVee

Download the latest release from the link below based on your system capabilities:

👉 **[Download AegisVee Releases](https://github.com/djhungtim/AegisVee/releases/latest)**

Choose the version that fits your needs:

- **`AegisVee-Basic-v2.1.0-win-x64.zip`**: Lightweight edition. Contains core project, requirement mapping, and traceability features. Good for low-memory laptops (does NOT contain AI features).
- **`AegisVee-Advanced-v2.1.0-win-x64.zip`**: Full edition. Injects machine learning libraries and RAG dependencies, enabling the AI Smart Assistant, Requirement Refinement, and Code Generation (requires Ollama running locally).

### Step 2: Extract

1. Extract the downloaded `.zip` file to your preferred location, e.g.:
   - `D:\AegisVee\`
   - `C:\Program Files\AegisVee\`

2. After extraction you should see the following structure:

   ```text
   AegisVee/
   ├── AegisVee.exe          ← Main application
   ├── resources/
   │   ├── backend/
   │   │   ├── backend.exe   ← Backend engine
   │   │   └── _internal/    ← Runtime dependencies
   │   └── app.asar          ← Frontend UI
   ├── locales/
   └── (other DLL files)
   ```

### Step 3: Launch

Double-click **`AegisVee.exe`** to start the application.

> ⚠️ On first launch, Windows SmartScreen may show a warning (the app is not code-signed).  
> Click **"More info"** → **"Run anyway"** to proceed.

---

## 🤖 Install Ollama (Optional — Required for AI Features)

AegisVee's AI features (smart chat, requirement analysis, code generation) require a local AI model.  
**Without Ollama, AegisVee still launches and works normally** — AI features will simply run in demo mode.

### Installation Steps

1. Go to [https://ollama.com](https://ollama.com) and download the installer
2. Run the installer (one-click, no configuration needed)
3. Open a terminal (PowerShell or CMD) and download a model:

   ```powershell
   # Recommended model (lightweight, works on most machines)
   ollama pull llama3.2

   # Or use a larger model (requires 16 GB+ RAM)
   ollama pull llama3.1
   ```

4. Restart AegisVee — it will automatically connect to Ollama

### Verify Ollama

```powershell
ollama list
```

If you see your downloaded model listed, the setup is complete.

---

## 📖 Feature Overview

| Feature                    | Description                                  | Requires Ollama? |
| -------------------------- | -------------------------------------------- | :--------------: |
| 📊 Project Dashboard       | Manage multiple engineering projects         |        ❌        |
| 📝 Requirement Editor      | Create, edit, import/export requirements     |        ❌        |
| 🔗 Engineering Canvas      | Visual drag-and-drop requirement node graph  |        ❌        |
| 📥 Excel Import/Export     | Import and export `.xlsx` requirement data   |        ❌        |
| 🤖 AI Smart Chat           | RAG-powered Q&A based on your requirements   |        ✅        |
| 🔍 AI Requirement Analysis | Automated quality analysis and suggestions   |        ✅        |
| 💻 AI Code Generation      | Generate embedded C code from requirements   |        ✅        |
| 📋 AI Test Plan            | Generate structured test plans automatically |        ✅        |
| 🔬 HIL Script Runner       | Execute Hardware-in-the-Loop test scripts    |        ❌        |
| 📈 System Monitor          | Real-time CPU and memory monitoring          |        ❌        |

---

## ❓ FAQ

### Q: The app shows a white/blank screen after launching?

**A:** Wait a few seconds — the backend engine needs time to initialize. If the screen remains blank for more than 30 seconds, try restarting the application.

### Q: Windows SmartScreen is blocking the application?

**A:** This happens because the application is not code-signed. Click "More info" → "Run anyway". This is normal behavior for unsigned applications.

### Q: AI chat responds with "Mock" content?

**A:** This means Ollama is not installed or not running. Follow the "Install Ollama" steps above.

### Q: The application uses a lot of memory?

**A:** The AegisVee backend includes multiple AI/ML libraries and may use 500 MB – 1 GB of RAM after startup. If Ollama is also running, memory usage will increase depending on the model size.

### Q: How do I update to a new version?

**A:** Download the latest zip file and extract it over the old version. User data in the `data/` directory will be preserved.

---

## 🛠️ Advanced Configuration

### Custom Backend Port

The backend starts on `localhost:8000` by default. If this port is occupied, close the conflicting application first.

### Data Storage Location

All user data is stored under `resources/backend/data/`:

- `requirements.json` — Requirement data
- `projects.json` — Project data
- Imported documents are stored in the `data/` subdirectory

---

## 📧 Support

If you encounter any issues, please report them on GitHub Issues:  
👉 [https://github.com/YOUR_USERNAME/aegis-vee/issues](https://github.com/YOUR_USERNAME/aegis-vee/issues)

---

**AegisVee — Your Engineering Shield 🛡️**
