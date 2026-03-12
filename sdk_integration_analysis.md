# EnduroSat SDK Integration Analysis & Plan

## 1. SDK Overview
**Path**: `D:\Work\aegis-vee-mvp\Refence\3.1.0.sdk`
**Type**: EnduroSat ESPF (Embedded Satellite Platform Framework)
**Language**: C / C++
**OS**: FreeRTOS
**Target**: STM32H753xx (On-Board Computer)

### Key Components
- **Core Services**: `eps_ctrl` (Power), `aocs` (Attitude Control), `telemetry`, `payload_ctrl`.
- **Architecture**: Service-oriented. Services are initialized in `main.c` and interact via FreeRTOS tasks and direct API calls.
- **Documentation**: HTML-based docs in `es_obc_sdk_docs`.

## 2. AegisVee Architecture Fit
AegisVee is evolving into an "Engineering OS" with a focus on:
1.  **Requirements Management**: Defining what the system must do (currently in `RequirementTable.jsx`).
2.  **Node-Based Architecture**: Visualizing system components (currently in `EngineeringOS` folder).
3.  **AI/RAG**: Generating content using local knowledge.

### The Gap
Currently, AegisVee's requirements are text-based (e.g., "Maintain speed"). The SDK is code-based (e.g., `eps_switch_on(CHANNEL_1)`).
The goal is to bridge this gap: **Requirement -> AI Agent -> SDK API Call**.

## 3. Integration Proposal: "Requirement-to-Code" Pipeline

We can merge the SDK into AegisVee's architecture by treating the SDK as a **Knowledge Source** and a **Target Runtime**.

### Step 1: SDK Ingestion (The "Brain")
We need to make AegisVee "understand" the SDK.
- **Action**: Create a script to parse the SDK header files (`espf/core/services/**/*.h`).
- **Output**: A JSON or Vector Database index of all available API functions, their parameters, and documentation.
- **UI**: Display these as "Available Tools" or "SDK Nodes" in the Engineering OS graph.

### Step 2: Requirement Mapping (The "Link")
Enhance the `RequirementTable` or `RequirementNode` to allow linking a requirement to specific SDK modules.
- **UI Change**: Add a "Technical Implementation" field to Requirements.
- **AI Assist**: The AI analyzes the requirement text (e.g., "Turn on payload when battery > 80%") and suggests relevant SDK APIs (e.g., `eps_telemetry_get_battery()`, `payload_ctrl_on()`).

### Step 3: Code Generation (The "Output")
Create a generation engine that takes a Requirement and produces a C code snippet.
- **Input**: Requirement Text + Selected SDK APIs.
- **Process**:
    1.  Construct a prompt for the LLM: "Write a C function using the EnduroSat SDK to fulfill this requirement: [Req Description]. Use these APIs: [List]."
    2.  Include SDK header context in the prompt.
- **Output**: A valid C function or `main.c` modification.

## 4. Implementation Roadmap

### Phase 1: Knowledge Base Setup
1.  **Index SDK**: Write a Python script to scan `D:\Work\aegis-vee-mvp\Refence\3.1.0.sdk\espf\core\services` and extract function signatures.
2.  **Store**: Save this as `sdk_metadata.json` in the backend.

### Phase 2: Frontend Integration
1.  **SDK Viewer**: Create a simple view in AegisVee to browse the indexed SDK APIs.
2.  **Generation UI**: Add a "Generate Code" button to the Requirement Table.

### Phase 3: AI Generation
1.  **Backend Endpoint**: Create `/api/generate-sdk-code` in `main.py`.
2.  **Prompt Engineering**: Tune the prompt to generate valid FreeRTOS/C code compatible with the SDK.

## 5. Example Scenario
**User Requirement**: "The OBC shall downlink telemetry every 10 seconds."
**AI Analysis**: Identifies `telemetry_save()` and `vTaskDelay()`.
**Generated Code**:
```c
void User_Telemetry_Task(void *argument) {
    for(;;) {
        telemetry_save(); // Hypothetical SDK API
        osDelay(10000);
    }
}
```
