import { useState, useEffect } from 'react';
import { api } from '../services/api';

export const useAppState = () => {
    // Navigation State
    const [selectedKey, setSelectedKey] = useState('dashboard');
    const [selectedProjectId, setSelectedProjectId] = useState(null);
    const [selectedRequirementId, setSelectedRequirementId] = useState(null);
    const [requirements, setRequirements] = useState([]);

    // When selectedProjectId changes, load that project's requirements
    useEffect(() => {
        if (selectedProjectId) {
            fetchProjectRequirements(selectedProjectId);
        } else {
            setRequirements([]);
        }
    }, [selectedProjectId]);

    // Helper to strip HTML tags for editor view
    const stripHtml = (html) => {
        if (!html) return "";
        const match = String(html).match(/^<div style="[^"]*">([\s\S]*)<\/div>$/);
        if (match) return match[1];
        return html;
    };

    // UI Visibility State
    const [isSearchVisible, setIsSearchVisible] = useState(false);
    const [isHelpVisible, setIsHelpVisible] = useState(false);
    const [isNotifVisible, setIsNotifVisible] = useState(false);
    const [isSettingsVisible, setIsSettingsVisible] = useState(false);

    // Editor/Process State
    const [editorContent, setEditorContent] = useState('// Select a requirement to edit');
    const [response, setResponse] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [themeMode, setThemeMode] = useState('system');
    const [edition, setEdition] = useState('core'); // v3.0: cloud-sync based edition
    const [cloudSync, setCloudSync] = useState(false);

    // Fetch AegisVee Edition (v3.0: cloud-sync based, not AI-based)
    useEffect(() => {
        const fetchEdition = async () => {
            try {
                const res = await api.getEdition();
                setEdition(res.edition || 'core');
                setCloudSync(res.cloud_sync || false);
            } catch (e) {
                console.error('Failed to fetch edition:', e);
            }
        };
        fetchEdition();
    }, []);

    // Auto-sync editor content when requirements change
    useEffect(() => {
        if (selectedRequirementId && requirements.length > 0) {
            const req = requirements.find(r => r.id === selectedRequirementId);
            if (req) {
                const plainText = stripHtml(req.description);
                if (plainText !== editorContent) {
                    setEditorContent(plainText);
                }
            }
        }
    }, [requirements, selectedRequirementId]);

    const fetchProjectRequirements = async (projectId) => {
        if (!projectId) return;
        try {
            const data = await api.getProjectRequirements(projectId);
            if (Array.isArray(data)) {
                setRequirements(data);
            }
        } catch (e) {
            console.error("Failed to fetch project requirements", e);
        }
    };

    // Handlers
    const handleProcess = async () => {
        setIsLoading(true);
        try {
            const result = await api.analyzeRequirement(editorContent);
            const formatted = `
[AI ANALYSIS]
Quality Score: ${result.score}/100
Necessity Score: ${result.necessity_score}/100

Necessity Analysis:
${result.necessity_analysis}

Quality Analysis:
${result.analysis}

Issues:
${result.issues.map(i => `- ${i}`).join('\n')}

Improved Version:
${result.improved_version}
            `.trim();
            setResponse(formatted);
        } catch (e) {
            setResponse(`Error: ${e.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleProjectSelect = (id) => {
        setSelectedProjectId(id);
    };

    const handleBackToDashboard = () => {
        setSelectedProjectId(null);
        setSelectedRequirementId(null);
    };

    const handleOpenTestScript = (reqId) => {
        setSelectedRequirementId(reqId);
        const req = requirements.find(r => r.id === reqId);
        if (req) {
            setEditorContent(stripHtml(req.description));
        }
    };

    const handleBackToProject = () => {
        setSelectedRequirementId(null);
    };

    const handleOpenVerification = (node) => {
        const reqId = node?.data?.id || node?.id || 'REQ-???';
        const description = node?.data?.description || node?.data?.title || `// Requirement ${reqId}`;
        setSelectedKey('validation');
        setSelectedRequirementId(reqId);
        setEditorContent(`// Requirement ${reqId}\n// ${description}`);
    };

    const handleMenuClick = (e) => {
        setSelectedKey(e.key);
        if (e.key !== 'dashboard') {
            // Keep selectedProjectId when switching views so requirements stay loaded
        }
    };

    const createRequirement = async () => {
        if (!selectedProjectId) return;
        try {
            const newReq = await api.createProjectRequirement(selectedProjectId, "New Requirement");
            setRequirements([...requirements, newReq]);
        } catch (e) {
            console.error(e);
        }
    };

    const saveRequirements = async (updatedReqs) => {
        if (!selectedProjectId) return false;
        try {
            await api.saveProjectRequirements(selectedProjectId, updatedReqs);
            setRequirements(updatedReqs);
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    };

    const updateSingleRequirement = async (id, fields) => {
        if (!selectedProjectId) return;
        const updatedReqs = requirements.map(r =>
            r.id === id ? { ...r, ...fields } : r
        );
        setRequirements(updatedReqs);
        await api.saveProjectRequirements(selectedProjectId, updatedReqs);
    };

    const propagateRequirementChange = async (reqId, parameters) => {
        if (!selectedProjectId) return;
        try {
            const result = await api.propagateProjectRequirement(selectedProjectId, reqId, parameters);
            await fetchProjectRequirements(selectedProjectId);
            return result;
        } catch (e) {
            console.error("Propagation failed", e);
            throw e;
        }
    };

    return {
        state: {
            selectedKey,
            selectedProjectId,
            selectedRequirementId,
            requirements,
            isSearchVisible,
            isHelpVisible,
            isNotifVisible,
            isSettingsVisible,
            editorContent,
            response,
            isLoading,
            themeMode,
            edition,
            cloudSync,
        },
        actions: {
            setSelectedKey,
            setIsSearchVisible,
            setIsHelpVisible,
            setIsNotifVisible,
            setIsSettingsVisible,
            setEditorContent,
            handleProcess,
            handleProjectSelect,
            handleBackToDashboard,
            handleOpenTestScript,
            handleBackToProject,
            handleMenuClick,
            handleOpenVerification,
            setThemeMode,
            fetchProjectRequirements,
            createRequirement,
            saveRequirements,
            updateSingleRequirement,
            propagateRequirementChange,
            setRequirements,
            setSelectedRequirementId
        }
    };
};
