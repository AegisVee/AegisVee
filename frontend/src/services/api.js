// frontend/src/services/api.js

const API_BASE = "http://localhost:8000/api";

export const api = {
    // ============================================================
    // Project-scoped Requirements
    // ============================================================
    getProjectRequirements: async (projectId) => {
        const res = await fetch(`${API_BASE}/projects/${projectId}/requirements`);
        return res.json();
    },
    saveProjectRequirements: async (projectId, reqs) => {
        return fetch(`${API_BASE}/projects/${projectId}/requirements`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reqs)
        });
    },
    createProjectRequirement: async (projectId, data) => {
        const res = await fetch(`${API_BASE}/projects/${projectId}/requirements/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(typeof data === 'string' ? { title: data, description: data } : data)
        });
        if (!res.ok) throw new Error("Failed to create requirement");
        return res.json();
    },
    importProjectRequirements: async (projectId, file) => {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch(`${API_BASE}/projects/${projectId}/requirements/import`, {
            method: 'POST',
            body: formData
        });
        return res.json();
    },
    importSmartProjectRequirements: async (projectId, file) => {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch(`${API_BASE}/projects/${projectId}/requirements/import-smart`, {
            method: 'POST',
            body: formData
        });
        return res.json();
    },
    exportProjectRequirements: async (projectId) => {
        const res = await fetch(`${API_BASE}/projects/${projectId}/requirements/export`);
        return res.blob();
    },

    // ============================================================
    // Project-scoped Propagation
    // ============================================================
    propagateProjectRequirement: async (projectId, reqId, parameters) => {
        const res = await fetch(`${API_BASE}/projects/${projectId}/requirements/${reqId}/propagate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ parameters })
        });
        if (!res.ok) throw new Error("Propagation failed");
        return res.json();
    },

    // ============================================================
    // Project-scoped Test Scripts
    // ============================================================
    getProjectTestScripts: async (projectId) => {
        const res = await fetch(`${API_BASE}/projects/${projectId}/tests/`);
        return res.json();
    },
    getProjectTestScriptsForReq: async (projectId, reqId) => {
        const res = await fetch(`${API_BASE}/projects/${projectId}/tests/requirement/${reqId}`);
        return res.json();
    },
    createProjectTestScript: async (projectId, data) => {
        const res = await fetch(`${API_BASE}/projects/${projectId}/tests/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error("Failed to create test script");
        return res.json();
    },
    updateProjectTestScript: async (projectId, scriptId, data) => {
        const res = await fetch(`${API_BASE}/projects/${projectId}/tests/${scriptId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error("Failed to update test script");
        return res.json();
    },
    deleteProjectTestScript: async (projectId, scriptId) => {
        const res = await fetch(`${API_BASE}/projects/${projectId}/tests/${scriptId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error("Failed to delete test script");
        return res.json();
    },

    // ============================================================
    // Project-scoped draw.io Import
    // ============================================================
    importProjectDrawio: async (projectId, file) => {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch(`${API_BASE}/projects/${projectId}/import/drawio`, {
            method: 'POST',
            body: formData
        });
        if (!res.ok) throw new Error("draw.io parse failed");
        return res.json();
    },
    confirmProjectDrawioImport: async (projectId, requirements) => {
        const res = await fetch(`${API_BASE}/projects/${projectId}/import/drawio/confirm`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requirements })
        });
        if (!res.ok) throw new Error("draw.io confirm import failed");
        return res.json();
    },

    // ============================================================
    // RAG / AI (global, not project-scoped)
    // ============================================================
    analyzeRequirement: async (text) => {
        const res = await fetch(`${API_BASE}/rag/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });
        if (!res.ok) throw new Error("Analysis failed");
        return res.json();
    },

    // ============================================================
    // Projects
    // ============================================================
    getProjects: async () => {
        const res = await fetch(`${API_BASE}/projects`);
        return res.json();
    },
    createProject: async (title, template) => {
        const res = await fetch(`${API_BASE}/projects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, template })
        });
        if (!res.ok) throw new Error("Failed to create project");
        return res.json();
    },
    deleteProject: async (id) => {
        const res = await fetch(`${API_BASE}/projects/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error("Failed to delete project");
        return res.json();
    },
    updateProjectMetrics: async (id) => {
        const res = await fetch(`${API_BASE}/projects/${id}/metrics`, { method: 'POST' });
        if (!res.ok) throw new Error("Failed to update project metrics");
        return res.json();
    },
    getProjectAnalytics: async (id) => {
        const res = await fetch(`${API_BASE}/projects/${id}/analytics`);
        if (!res.ok) throw new Error("Failed to fetch project analytics");
        return res.json();
    },

    // ============================================================
    // HIL
    // ============================================================
    runScript: async (script) => {
        const res = await fetch(`${API_BASE}/run_script`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ script })
        });
        return res.json();
    },

    // ============================================================
    // SDK / Code Generation
    // ============================================================
    generateCode: async (reqDescription, linkedApis = []) => {
        const res = await fetch(`${API_BASE}/generate-code`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requirement: reqDescription, linked_apis: linkedApis })
        });
        return res.json();
    },

    // ============================================================
    // System
    // ============================================================
    syncSystem: async (data) => {
        const res = await fetch(`${API_BASE}/system/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error("Failed to sync system data");
        return res.json();
    },

    // ============================================================
    // v2.0: AI Settings
    // ============================================================
    getAISettings: async () => {
        const res = await fetch(`${API_BASE}/ai/settings`);
        return res.json();
    },
    updateAISettings: async (settings) => {
        const res = await fetch(`${API_BASE}/ai/settings`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings)
        });
        if (!res.ok) throw new Error("Failed to update AI settings");
        return res.json();
    },
    getAIProviders: async () => {
        const res = await fetch(`${API_BASE}/ai/providers`);
        return res.json();
    },
    testAIProvider: async (provider, baseUrl) => {
        const res = await fetch(`${API_BASE}/ai/providers/test`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ provider, base_url: baseUrl })
        });
        return res.json();
    },
    getAIModels: async () => {
        const res = await fetch(`${API_BASE}/ai/models`);
        return res.json();
    },
    pullAIModel: async (modelName) => {
        const res = await fetch(`${API_BASE}/ai/models/pull`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model_name: modelName })
        });
        if (!res.ok) throw new Error("Failed to pull model");
        return res.json();
    },
    deleteAIModel: async (modelName) => {
        const res = await fetch(`${API_BASE}/ai/models/${encodeURIComponent(modelName)}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error("Failed to delete model");
        return res.json();
    },
    getAIFunctionMappings: async () => {
        const res = await fetch(`${API_BASE}/ai/function-mappings`);
        return res.json();
    },
    updateAIFunctionMappings: async (mappings) => {
        const res = await fetch(`${API_BASE}/ai/function-mappings`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(mappings)
        });
        if (!res.ok) throw new Error("Failed to update function mappings");
        return res.json();
    },

    // ============================================================
    // v2.0: Plugins
    // ============================================================
    getPlugins: async () => {
        const res = await fetch(`${API_BASE}/plugins/`);
        return res.json();
    },
    installPlugin: async (pluginId) => {
        const res = await fetch(`${API_BASE}/plugins/${pluginId}/install`, { method: 'POST' });
        if (!res.ok) throw new Error("Failed to install plugin");
        return res.json();
    },
    uninstallPlugin: async (pluginId) => {
        const res = await fetch(`${API_BASE}/plugins/${pluginId}/uninstall`, { method: 'POST' });
        if (!res.ok) throw new Error("Failed to uninstall plugin");
        return res.json();
    },
    getPluginStatus: async (pluginId) => {
        const res = await fetch(`${API_BASE}/plugins/${pluginId}/status`);
        return res.json();
    },

    // ============================================================
    // v2.0: System Hardware
    // ============================================================
    getHardwareInfo: async () => {
        const res = await fetch(`${API_BASE}/system/hardware`);
        return res.json();
    },
    getGPUStats: async () => {
        const res = await fetch(`${API_BASE}/system/gpu-stats`);
        return res.json();
    },
    getSystemStats: async () => {
        const res = await fetch(`${API_BASE}/system/stats`);
        return res.json();
    },
    getEdition: async () => {
        const res = await fetch(`${API_BASE}/system/edition`);
        return res.json();
    },
    getAiStatus: async () => {
        const res = await fetch(`${API_BASE}/system/ai-status`);
        return res.json();
    },

    // ============================================================
    // v3.0: Requirement Tree (hierarchy)
    // ============================================================
    getRequirementTree: async (projectId) => {
        const res = await fetch(`${API_BASE}/projects/${projectId}/requirements/tree`);
        return res.json();
    },
    updateRequirement: async (projectId, reqId, data) => {
        const res = await fetch(`${API_BASE}/projects/${projectId}/requirements/${reqId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error("Failed to update requirement");
        return res.json();
    },
    deleteRequirement: async (projectId, reqId) => {
        const res = await fetch(`${API_BASE}/projects/${projectId}/requirements/${reqId}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error("Failed to delete requirement");
        return res.json();
    },

    // ============================================================
    // v3.0: Test Runs (Flow-style test execution)
    // ============================================================
    getTestRuns: async (projectId, testCaseId) => {
        const url = testCaseId
            ? `${API_BASE}/projects/${projectId}/test-runs?test_case_id=${testCaseId}`
            : `${API_BASE}/projects/${projectId}/test-runs`;
        const res = await fetch(url);
        return res.json();
    },
    createTestRun: async (projectId, data) => {
        const res = await fetch(`${API_BASE}/projects/${projectId}/test-runs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error("Failed to create test run");
        return res.json();
    },
    getTestRun: async (projectId, runId) => {
        const res = await fetch(`${API_BASE}/projects/${projectId}/test-runs/${runId}`);
        return res.json();
    },
    updateTestRun: async (projectId, runId, data) => {
        const res = await fetch(`${API_BASE}/projects/${projectId}/test-runs/${runId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error("Failed to update test run");
        return res.json();
    },
    deleteTestRun: async (projectId, runId) => {
        const res = await fetch(`${API_BASE}/projects/${projectId}/test-runs/${runId}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error("Failed to delete test run");
        return res.json();
    },

    // ============================================================
    // v3.0: V&V Rules (Valispace-style automated verification)
    // ============================================================
    getVnVRules: async (projectId, requirementId) => {
        const url = requirementId
            ? `${API_BASE}/projects/${projectId}/vnv-rules?requirement_id=${requirementId}`
            : `${API_BASE}/projects/${projectId}/vnv-rules`;
        const res = await fetch(url);
        return res.json();
    },
    createVnVRule: async (projectId, data) => {
        const res = await fetch(`${API_BASE}/projects/${projectId}/vnv-rules`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error("Failed to create V&V rule");
        return res.json();
    },
    updateVnVRule: async (projectId, ruleId, data) => {
        const res = await fetch(`${API_BASE}/projects/${projectId}/vnv-rules/${ruleId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error("Failed to update V&V rule");
        return res.json();
    },
    deleteVnVRule: async (projectId, ruleId) => {
        const res = await fetch(`${API_BASE}/projects/${projectId}/vnv-rules/${ruleId}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error("Failed to delete V&V rule");
        return res.json();
    },
    checkVnVRule: async (projectId, ruleId) => {
        const res = await fetch(`${API_BASE}/projects/${projectId}/vnv-rules/${ruleId}/check`, {
            method: 'POST'
        });
        if (!res.ok) throw new Error("Failed to check V&V rule");
        return res.json();
    },
    checkAllVnVRules: async (projectId) => {
        const res = await fetch(`${API_BASE}/projects/${projectId}/vnv-rules/check-all`, {
            method: 'POST'
        });
        if (!res.ok) throw new Error("Failed to check all V&V rules");
        return res.json();
    },

    // ============================================================
    // v3.0: System Blocks
    // ============================================================
    getBlocks: async (projectId) => {
        const res = await fetch(`${API_BASE}/projects/${projectId}/blocks`);
        return res.json();
    },
    createBlock: async (projectId, data) => {
        const res = await fetch(`${API_BASE}/projects/${projectId}/blocks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error("Failed to create block");
        return res.json();
    },
    getBlock: async (projectId, blockId) => {
        const res = await fetch(`${API_BASE}/projects/${projectId}/blocks/${blockId}`);
        return res.json();
    },
    updateBlock: async (projectId, blockId, data) => {
        const res = await fetch(`${API_BASE}/projects/${projectId}/blocks/${blockId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error("Failed to update block");
        return res.json();
    },
    deleteBlock: async (projectId, blockId) => {
        const res = await fetch(`${API_BASE}/projects/${projectId}/blocks/${blockId}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error("Failed to delete block");
        return res.json();
    },

    // ============================================================
    // v3.0: Verification Measures (project-scoped)
    // ============================================================
    getVerificationMeasures: async (projectId) => {
        const res = await fetch(`${API_BASE}/projects/${projectId}/verification-measures`);
        return res.json();
    },
    createVerificationMeasure: async (projectId, data) => {
        const res = await fetch(`${API_BASE}/projects/${projectId}/verification-measures`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error("Failed to create verification measure");
        return res.json();
    },
    updateVerificationMeasure: async (projectId, vmId, data) => {
        const res = await fetch(`${API_BASE}/projects/${projectId}/verification-measures/${vmId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error("Failed to update verification measure");
        return res.json();
    },
};
