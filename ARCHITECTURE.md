# AegisVee System Architecture

This document provides a comprehensive overview of the AegisVee system architecture.

### Key Components:
- **Frontend**: Built with **Electron + React (Vite)**, providing a modern desktop experience. Components include the Engineering Canvas, Requirement Editor, and Dashboard.
- **Backend**: Built with **FastAPI**, handling API requests, RAG logic, and system interactions.
- **RAG & AI**: Integrated with **LlamaIndex** and **Ollama** for local LLM capabilities, using **LanceDB** and **ChromaDB** for vector storage.
- **HIL**: Hardware-in-the-Loop testing via **STM32 UART Driver**.
- **Data**: Uses local JSON files and vector databases for persistence.

```mermaid
graph TD
    classDef frontend fill:#3b82f6,stroke:#1d4ed8,color:white,rx:5,ry:5
    classDef backend fill:#10b981,stroke:#047857,color:white,rx:5,ry:5
    classDef service fill:#f59e0b,stroke:#b45309,color:white,rx:5,ry:5
    classDef infra fill:#6366f1,stroke:#4338ca,color:white,rx:5,ry:5
    classDef hardware fill:#ef4444,stroke:#b91c1c,color:white,rx:5,ry:5

    subgraph FrontEnd ["Frontend (Electron / React + Vite)"]
        direction TB
        App[App Container]:::frontend
        
        subgraph Views [Views]
            Dashboard[Dashboard View]:::frontend
            Canvas[Engineering Canvas]:::frontend
            Editor[Req Editor]:::frontend
            TestLab[Test Lab]:::frontend
            Settings[Settings]:::frontend
        end
        
        API_Client[API Service / Hooks]:::frontend
        
        App --> Dashboard
        App --> Canvas
        App --> Editor
        App --> TestLab
        App --> Settings
        
        Dashboard --> API_Client
        Canvas --> API_Client
        Editor --> API_Client
        TestLab --> API_Client
    end

    subgraph BackEnd ["Backend (FastAPI)"]
        direction TB
        Server[FastAPI Server]:::backend
        
        subgraph Routers [Routers]
            R_Projects[/api/projects]:::backend
            R_RAG[/api/rag]:::backend
            R_Logic[/api/logic]:::backend
            R_HIL[/api/run_script]:::backend
            R_System[/api/system]:::backend
            R_SDK[/api/sdk]:::backend
        end
        
        subgraph Services [Services]
            S_Storage[Storage Service]:::service
            S_RAG[RAG Service]:::service
            S_HIL[STM32 Driver]:::service
            S_Logic[Logic Engine]:::service
            S_Sys[System Monitor]:::service
        end
        
        Server --> R_Projects
        Server --> R_RAG
        Server --> R_Logic
        Server --> R_HIL
        Server --> R_System
        Server --> R_SDK
        
        R_Projects --> S_Storage
        R_RAG --> S_RAG
        R_Logic --> S_Logic
        R_HIL --> S_HIL
        R_System --> S_Sys
        R_SDK --> S_RAG
        
        S_Logic --> S_RAG
    end

    subgraph Infra ["Infrastructure and Data"]
        direction TB
        JSON_DB[(JSON Files)]:::infra
        VecDB[(LanceDB / Chroma)]:::infra
        Ollama[Ollama Local LLM]:::infra
    end
    
    subgraph Hardware [Hardware]
        STM32[STM32 Microcontroller]:::hardware
    end

    %% Connections
    API_Client <==>|HTTP / SSE| Server
    
    S_Storage <--> JSON_DB
    S_RAG <--> VecDB
    S_RAG <-->|API| Ollama
    S_HIL <-->|UART / Serial| STM32
    S_Sys -->|psutil| OS[Operating System]:::infra

    %% Link styles (removed complex selector for compatibility)
    linkStyle default stroke-width:2px,fill:none,stroke:#fff
```

### Data Flow Overview
1.  **User Interaction**: Users interact with the Frontend (React), triggering API calls.
2.  **Request Handling**: The FastAPI Backend routes requests to specific services.
3.  **Core Logic**: 
    *   **RAG Service**: Queries local vector databases and the local LLM (Ollama) for intelligent responses.
    *   **Logic Engine**: Processes traceability matrices and generates test plans.
    *   **HIL Driver**: Communicates directly with connected hardware via Serial/UART.
4.  **Persistence**: Requirement and project data is stored in local JSON files; semantic embeddings are stored in LanceDB/ChromaDB.
