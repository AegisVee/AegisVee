import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { Spin, message } from 'antd';
import FlowHierarchySidebar from './FlowHierarchySidebar';
import FlowToolbar from './FlowToolbar';
import FlowTableView from './FlowTableView';
import { api } from '../../services/api';

const GraphCanvas = React.lazy(() => import('./GraphCanvas'));
const RequirementDetailDrawer = React.lazy(() => import('./RequirementDetailDrawer'));
const TestCasePanel = React.lazy(() => import('./TestCasePanel'));
const BlocksView = React.lazy(() => import('./BlocksView'));
const VnVView = React.lazy(() => import('./VnVView'));
const BudgetView = React.lazy(() => import('./BudgetView'));

/**
 * v3.0 FlowTreeView — Main Engineering OS view.
 * Replaces the old GraphCanvas as the top-level component.
 * Combines: FlowHierarchySidebar + FlowToolbar + (GraphCanvas | FlowTableView | TestCasePanel | BlocksView | VnVView)
 * + RequirementDetailDrawer (slide-out on double-click)
 */
const FlowTreeView = ({
    projectId,
    projects = [],
    requirements = [],
    onProjectSelect,
    onCreateRequirement,
    onRefreshRequirements,
    onNavigate,
}) => {
    const [viewMode, setViewMode] = useState('tree');
    const [searchText, setSearchText] = useState('');
    const [sortBy, setSortBy] = useState('id');
    const [selectedNodeId, setSelectedNodeId] = useState(null);
    const [activeSection, setActiveSection] = useState('requirements');
    const [loading, setLoading] = useState(false);

    // Drawer state for requirement detail
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerRequirement, setDrawerRequirement] = useState(null);

    // Verification measures for test case panel
    const [verificationMeasures, setVerificationMeasures] = useState([]);

    // Filter requirements by search
    const filteredRequirements = useMemo(() => {
        let filtered = [...requirements];

        // Search filter
        if (searchText.trim()) {
            const query = searchText.toLowerCase();
            filtered = filtered.filter(
                (r) =>
                    (r.id || '').toLowerCase().includes(query) ||
                    (r.title || '').toLowerCase().includes(query) ||
                    (r.description || '').toLowerCase().includes(query) ||
                    (r.tags || []).some((t) => t.toLowerCase().includes(query))
            );
        }

        // Sort
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'id': {
                    const numA = parseInt(a.id?.replace('REQ-', '') || '0');
                    const numB = parseInt(b.id?.replace('REQ-', '') || '0');
                    return numA - numB;
                }
                case 'title':
                    return (a.title || '').localeCompare(b.title || '');
                case 'status':
                    return (a.status || '').localeCompare(b.status || '');
                case 'priority': {
                    const order = { critical: 0, high: 1, medium: 2, low: 3 };
                    return (order[a.priority] ?? 2) - (order[b.priority] ?? 2);
                }
                case 'updated':
                    return (b.updated_at || '').localeCompare(a.updated_at || '');
                default:
                    return 0;
            }
        });

        return filtered;
    }, [requirements, searchText, sortBy]);

    // Load verification measures when switching to test-specs section
    useEffect(() => {
        if (activeSection === 'test-specs' && projectId) {
            api.getVerificationMeasures(projectId)
                .then(setVerificationMeasures)
                .catch((e) => console.error('Failed to load verification measures:', e));
        }
    }, [activeSection, projectId]);

    // Handle creating a new requirement
    const handleCreateRequirement = useCallback(async () => {
        if (!projectId) {
            message.warning('Please select a project first');
            return;
        }
        try {
            const newReq = await api.createProjectRequirement(projectId, {
                title: 'New Requirement',
                parent_id: selectedNodeId || null,
            });
            message.success(`${newReq.id} created`);
            if (onRefreshRequirements) {
                onRefreshRequirements();
            }
            setSelectedNodeId(newReq.id);
        } catch (e) {
            console.error(e);
            message.error('Failed to create requirement');
        }
    }, [projectId, selectedNodeId, onRefreshRequirements]);

    // Handle section navigation
    const handleSectionChange = useCallback(
        (key) => {
            setActiveSection(key);
            // No longer navigating away — stay within Engineering OS for all sections
        },
        []
    );

    // Handle double-click on requirement node → open detail drawer
    const handleNodeDoubleClick = useCallback(
        (nodeId) => {
            const req = requirements.find((r) => r.id === nodeId);
            if (req) {
                setDrawerRequirement(req);
                setDrawerOpen(true);
            }
        },
        [requirements]
    );

    // Handle saving requirement from drawer
    const handleDrawerSave = useCallback(
        async (updatedData) => {
            if (!projectId || !drawerRequirement) return;
            try {
                await api.updateRequirement(projectId, drawerRequirement.id, updatedData);
                message.success('Requirement updated');
                if (onRefreshRequirements) {
                    onRefreshRequirements();
                }
                // Update local drawer state
                setDrawerRequirement((prev) => ({ ...prev, ...updatedData }));
            } catch (e) {
                console.error(e);
                message.error('Failed to update requirement');
            }
        },
        [projectId, drawerRequirement, onRefreshRequirements]
    );

    // Determine toolbar title based on active section
    const getSectionTitle = () => {
        switch (activeSection) {
            case 'test-specs': return 'Test Specifications';
            case 'blocks': return 'System Blocks';
            case 'verifications': return 'V&V Activities';
            case 'design-values': return 'Design Values';
            case 'budget': return 'Budget Breakdown';
            default: return 'All Requirements';
        }
    };

    // Render content based on active section
    const renderContent = () => {
        if (!projectId) {
            return (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        background: '#FAFBFC',
                        color: '#64748B',
                        fontSize: 16,
                    }}
                >
                    Select a project from the sidebar to view requirements.
                </div>
            );
        }

        switch (activeSection) {
            case 'test-specs':
                return (
                    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><Spin size="large" /></div>}>
                        <TestCasePanel
                            projectId={projectId}
                            verificationMeasures={verificationMeasures}
                            onRefresh={() => {
                                api.getVerificationMeasures(projectId)
                                    .then(setVerificationMeasures)
                                    .catch(console.error);
                            }}
                        />
                    </Suspense>
                );

            case 'blocks':
                return (
                    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><Spin size="large" /></div>}>
                        <BlocksView projectId={projectId} />
                    </Suspense>
                );

            case 'verifications':
            case 'design-values':
            case 'vnv-rules':
                return (
                    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><Spin size="large" /></div>}>
                        <VnVView projectId={projectId} />
                    </Suspense>
                );

            case 'budget':
                return (
                    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><Spin size="large" /></div>}>
                        <BudgetView projectId={projectId} />
                    </Suspense>
                );

            default:
                // Requirements view (tree or table)
                return viewMode === 'tree' ? (
                    <Suspense
                        fallback={
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                <Spin size="large" />
                            </div>
                        }
                    >
                        <GraphCanvas
                            requirements={filteredRequirements}
                            selectedNodeId={selectedNodeId}
                            onNodeSelect={setSelectedNodeId}
                            onNodeDoubleClick={handleNodeDoubleClick}
                        />
                    </Suspense>
                ) : (
                    <FlowTableView
                        requirements={filteredRequirements}
                        selectedNodeId={selectedNodeId}
                        onNodeSelect={setSelectedNodeId}
                        onNodeDoubleClick={handleNodeDoubleClick}
                        loading={loading}
                        projectId={projectId}
                    />
                );
        }
    };

    const isRequirementsSection = activeSection === 'requirements' || activeSection === 'home';

    return (
        <div style={{ display: 'flex', height: '100%', width: '100%', overflow: 'hidden' }}>
            {/* Left: Hierarchy Sidebar (always visible for project selection) */}
            <FlowHierarchySidebar
                projects={projects}
                selectedProjectId={projectId}
                onProjectSelect={onProjectSelect}
                requirements={requirements}
                selectedNodeId={selectedNodeId}
                onNodeSelect={setSelectedNodeId}
                activeSection={activeSection}
                onSectionChange={handleSectionChange}
                onBackToDashboard={() => onNavigate && onNavigate('dashboard')}
            />

            {/* Right: Toolbar + Content */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Toolbar — only show for requirements section */}
                {isRequirementsSection && (
                    <FlowToolbar
                        totalCount={filteredRequirements.length}
                        viewMode={viewMode}
                        onViewModeChange={setViewMode}
                        onCreateRequirement={handleCreateRequirement}
                        searchText={searchText}
                        onSearchChange={setSearchText}
                        sortBy={sortBy}
                        onSortChange={setSortBy}
                    />
                )}

                {/* Content area */}
                <div style={{ flex: 1, overflow: 'hidden' }}>
                    {renderContent()}
                </div>
            </div>

            {/* Requirement Detail Drawer */}
            <Suspense fallback={null}>
                <RequirementDetailDrawer
                    open={drawerOpen}
                    onClose={() => setDrawerOpen(false)}
                    requirement={drawerRequirement}
                    requirements={requirements}
                    projectId={projectId}
                    onSave={handleDrawerSave}
                    onRefresh={onRefreshRequirements}
                />
            </Suspense>
        </div>
    );
};

export default FlowTreeView;
