import React, { useState, useEffect, Suspense } from 'react';
import RequirementTable from './components/RequirementTable';
import DashboardTemplate from './components/templates/DashboardTemplate';
import ProjectDetailTemplate from './components/templates/ProjectDetailTemplate';
import MixerPanel from './components/MixerPanel';
import ErrorBoundary from './components/ErrorBoundary';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import AppHeader from './components/layout/AppHeader';
import AppSidebar from './components/layout/AppSidebar';
import ChatSidebar from './components/layout/ChatSidebar';
import ConsoleSidebar from './components/layout/ConsoleSidebar';
import PerformanceOverlay from './components/common/PerformanceOverlay';
import Telemetry from './utils/telemetry';

// Lazy-loaded heavy components (code splitting)
const KnowledgePanel = React.lazy(() => import('./components/KnowledgePanel'));
const TestScriptSplitView = React.lazy(() => import('./components/TestScriptSplitView'));
const VModelView = React.lazy(() => import('./components/VModelView'));
const AegisEditor = React.lazy(() => import('./components/AegisEditor'));
const FlowTreeView = React.lazy(() => import('./components/EngineeringOS/FlowTreeView'));
const AISettingsPage = React.lazy(() => import('./components/AISettings/AISettingsPage'));
const PluginManagerPage = React.lazy(() => import('./components/PluginManager/PluginManagerPage'));
const SetupWizard = React.lazy(() => import('./components/SetupWizard/SetupWizard'));

import {
  SaveOutlined,
} from '@ant-design/icons';
import { ConfigProvider, Layout, Button, Input, Tooltip, Modal, List, Drawer, Switch, Space, Typography, theme, App as AntdApp, message, Segmented, Spin } from 'antd';

const { Content } = Layout;
const { Title, Text } = Typography;

import { useAppState } from './hooks/useAppState';
import { api } from './services/api';

function App() {
  const { state, actions } = useAppState();
  const {
    selectedKey, selectedProjectId, selectedRequirementId,
    isSearchVisible, isHelpVisible, isNotifVisible, isSettingsVisible,
    editorContent, response, isLoading, themeMode, requirements,
    edition, cloudSync
  } = state;
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [isConsoleVisible, setIsConsoleVisible] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [projects, setProjects] = useState([]);
  const [showSetupWizard, setShowSetupWizard] = useState(
    () => !localStorage.getItem('aegisvee_setup_complete')
  );
  const {
    setSelectedKey, setIsSearchVisible, setIsHelpVisible, setIsNotifVisible, setIsSettingsVisible,
    setEditorContent, handleProcess, handleProjectSelect, handleBackToDashboard,
    handleOpenTestScript, handleBackToProject, handleMenuClick, handleOpenVerification, setThemeMode,
    fetchProjectRequirements, createRequirement, saveRequirements, updateSingleRequirement, propagateRequirementChange,
    setSelectedRequirementId
  } = actions;

  // Theme Logic — v3.0: default to light mode
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (themeMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setIsDarkMode(mediaQuery.matches);

      const handler = (e) => setIsDarkMode(e.matches);
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      setIsDarkMode(themeMode === 'dark');
    }
  }, [themeMode]);

  // Fetch projects for FlowTreeView
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await api.getProjects();
        setProjects(Array.isArray(res) ? res : []);
      } catch (e) {
        console.error('Failed to fetch projects:', e);
      }
    };
    fetchProjects();
  }, []);

  // Backend Status Polling
  const [backendStatus, setBackendStatus] = useState('checking');

  useEffect(() => {
    let interval;
    let isChecking = false;

    const checkBackend = async () => {
      if (isChecking) return;
      isChecking = true;
      try {
        const res = await fetch('http://localhost:8000/');
        if (res.ok) {
          if (backendStatus === 'waiting') {
            window.location.reload();
          } else if (backendStatus === 'checking') {
            setBackendStatus('online');
          }
        } else {
          setBackendStatus('waiting');
        }
      } catch (e) {
        setBackendStatus('waiting');
      } finally {
        isChecking = false;
      }
    };

    if (backendStatus !== 'online') {
      checkBackend();
      interval = setInterval(checkBackend, 2000);
    }

    return () => clearInterval(interval);
  }, [backendStatus]);

  const handleEditRequirementFromGraph = (node) => {
    setSelectedKey('requirements');
    const content = node.data?.description || `// Requirement ${node.data?.id || node.id}\n// ${node.data?.title || 'No description'}`;
    setEditorContent(content);
    if (node.data?.id || node.id) {
      setSelectedRequirementId(node.data?.id || node.id);
    }
  };

  // Render Main Content based on selection
  const renderMainContent = () => {
    const bgColor = isDarkMode ? '#1c1c1c' : '#ffffff';
    const borderColor = isDarkMode ? '#424242' : '#f0f0f0';
    const editorBg = isDarkMode ? '#1e1e1e' : '#fafafa';

    switch (selectedKey) {
      case 'dashboard':
        if (selectedRequirementId) {
          return <TestScriptSplitView reqId={selectedRequirementId} projectId={selectedProjectId} onBack={handleBackToProject} />;
        }
        if (selectedProjectId) {
          return <ProjectDetailTemplate
            onBack={handleBackToDashboard}
            onOpenTestScript={handleOpenTestScript}
            projectId={selectedProjectId}
            requirements={requirements}
            onSaveRequirements={saveRequirements}
            onCreateRequirement={createRequirement}
          />;
        }
        return <DashboardTemplate onProjectSelect={handleProjectSelect} />;

      case 'engineering-os':
        Telemetry.logEvent('Viewed Engineering OS');
        return (
          <FlowTreeView
            projectId={selectedProjectId}
            projects={projects}
            onProjectSelect={handleProjectSelect}
            requirements={requirements}
            onEditRequirement={handleEditRequirementFromGraph}
            onVerifyRequirement={handleOpenVerification}
            onNavigate={(key) => setSelectedKey(key)}
          />
        );

      case 'validation':
        return <VModelView editorContent={editorContent} setEditorContent={setEditorContent} selectedRequirementId={state.selectedRequirementId} />;
      case 'knowledge':
        return <KnowledgePanel />;
      case 'ai-settings':
        return <AISettingsPage />;
      case 'plugins':
        return <PluginManagerPage />;
      case 'requirements':
      default:
        if (!selectedProjectId) {
          return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: bgColor }}>
              <Text type="secondary" style={{ fontSize: 16 }}>Please select a project from the Dashboard first to view its requirements.</Text>
            </div>
          );
        }
        return (
          <PanelGroup direction="vertical">
            <Panel defaultSize={55} minSize={25} style={{ overflow: 'auto', background: bgColor }}>
              <RequirementTable
                projectId={selectedProjectId}
                requirements={requirements}
                onSave={saveRequirements}
                onCreate={createRequirement}
                onOpenTestScript={handleOpenTestScript}
                onRefresh={() => fetchProjectRequirements(selectedProjectId)}
              />
            </Panel>
            <PanelResizeHandle style={{ height: 2, background: borderColor, cursor: 'row-resize' }} />
            <Panel defaultSize={25} minSize={15} style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '8px 16px', background: bgColor, borderBottom: `1px solid ${borderColor}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text type="secondary">{selectedRequirementId ? `${selectedRequirementId} (Current)` : 'Select a requirement'}</Text>
                <Button
                  type="primary"
                  size="small"
                  icon={<SaveOutlined />}
                  onClick={() => {
                    if (selectedRequirementId) {
                      updateSingleRequirement(selectedRequirementId, { description: editorContent });
                      message.success('Requirement Saved');
                    } else {
                      message.warning('No requirement selected');
                    }
                  }}
                >
                  Save Changes
                </Button>
              </div>
              <div style={{ flex: 1, overflow: 'hidden', background: editorBg }}>
                <AegisEditor value={editorContent} onChange={setEditorContent} />
              </div>
            </Panel>
            <PanelResizeHandle style={{ height: 2, background: borderColor, cursor: 'row-resize' }} />
            <Panel defaultSize={20} minSize={15} style={{ background: bgColor }}>
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <MixerPanel output={response} isLoading={isLoading} onProcess={handleProcess} />
              </div>
            </Panel>
          </PanelGroup>
        );
    }
  };

  const handleLogoClick = () => {
    setSelectedKey('dashboard');
    handleBackToDashboard();
  };

  // Engineering OS has its own full layout (sidebar + toolbar)
  const isEngineeringOS = selectedKey === 'engineering-os';

  if (backendStatus !== 'online') {
    return (
      <ConfigProvider
        theme={{
          algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        }}
      >
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: isDarkMode ? '#121212' : '#f0f2f5' }}>
          <Spin size="large" />
          <Title level={4} style={{ marginTop: 24, color: isDarkMode ? '#ffffff' : '#000000' }}>Waiting for AegisVee Engine to start...</Title>
          <Text type="secondary">The backend server is starting up. This page will automatically refresh once it's ready.</Text>
        </div>
      </ConfigProvider>
    );
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#0EA5E9',
          colorBgContainer: isDarkMode ? '#1c1c1c' : '#ffffff',
          colorBgLayout: isDarkMode ? '#121212' : '#F8FAFC',
          borderRadius: 8,
          colorLink: '#0EA5E9',
        },
      }}
    >
      <ErrorBoundary>
        <AntdApp>
          <Layout style={{ height: '100vh' }}>
            {/* AppHeader hidden for Engineering OS (it has its own toolbar) */}
            {!isEngineeringOS && (
              <AppHeader
                isSearchVisible={isSearchVisible}
                setIsSearchVisible={setIsSearchVisible}
                setIsHelpVisible={setIsHelpVisible}
                setIsNotifVisible={setIsNotifVisible}
                onConsoleToggle={() => { setIsConsoleVisible(v => !v); setIsChatVisible(false); }}
                onChatToggle={() => { setIsChatVisible(v => !v); setIsConsoleVisible(false); }}
              />
            )}

            <Layout>
              {/* AppSidebar hidden for Engineering OS (FlowTreeView has its own sidebar) */}
              {!isEngineeringOS && (
                <AppSidebar
                  selectedKey={selectedKey}
                  setSelectedKey={setSelectedKey}
                  setIsSettingsVisible={setIsSettingsVisible}
                  onMenuClick={handleMenuClick}
                  collapsed={sidebarCollapsed}
                  onCollapsedChange={setSidebarCollapsed}
                />
              )}

              <Content style={{ height: '100%', overflow: 'hidden', display: 'flex' }}>
                <PanelGroup direction="horizontal" style={{ flex: 1 }}>
                  <Panel>
                    <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><Spin size="large" /></div>}>
                      {renderMainContent()}
                    </Suspense>
                  </Panel>
                </PanelGroup>

                {/* Chat/Console sidebars hidden for Engineering OS */}
                {!isEngineeringOS && (
                  <>
                    <ChatSidebar
                      visible={isChatVisible}
                      onClose={() => setIsChatVisible(false)}
                      selectedRequirement={state.requirements.find(r => r.id === selectedRequirementId)}
                    />
                    <ConsoleSidebar
                      visible={isConsoleVisible}
                      onClose={() => setIsConsoleVisible(false)}
                    />
                  </>
                )}
              </Content>
            </Layout>

            {/* Modals & Drawers */}
            <Modal title="Help & Shortcuts" open={isHelpVisible} onOk={() => setIsHelpVisible(false)} onCancel={() => setIsHelpVisible(false)}>
              <p><b>Cmd+K</b>: Search</p>
              <p><b>Cmd+S</b>: Save</p>
              <p><b>Cmd+R</b>: Run Test</p>
            </Modal>

            <Modal title="Settings" open={isSettingsVisible} onOk={() => setIsSettingsVisible(false)} onCancel={() => setIsSettingsVisible(false)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <span>Theme</span>
                <Segmented
                  options={[
                    { label: 'Light', value: 'light' },
                    { label: 'Dark', value: 'dark' },
                    { label: 'System', value: 'system' },
                  ]}
                  value={themeMode}
                  onChange={setThemeMode}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <span>Edition</span>
                <Text type="secondary">{edition.charAt(0).toUpperCase() + edition.slice(1)} {cloudSync ? '(Cloud Sync)' : '(Local)'}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <span>AI Configuration</span>
                <Button type="link" onClick={() => { setIsSettingsVisible(false); setSelectedKey('ai-settings'); }}>
                  Open AI Settings
                </Button>
              </div>
            </Modal>

            <Drawer title="Notifications" placement="right" onClose={() => setIsNotifVisible(false)} open={isNotifVisible}>
              <List
                dataSource={[
                  { title: 'Build Passed', desc: 'Latest commit verified.' },
                  { title: 'RAG Model Updated', desc: 'Switched to gemma3:4b.' },
                ]}
                renderItem={item => (
                  <List.Item>
                    <List.Item.Meta title={item.title} description={item.desc} />
                  </List.Item>
                )}
              />
            </Drawer>

            <PerformanceOverlay />

            {showSetupWizard && (
              <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spin size="large" /></div>}>
                <SetupWizard
                  onComplete={() => {
                    localStorage.setItem('aegisvee_setup_complete', 'true');
                    setShowSetupWizard(false);
                  }}
                  onSkip={() => {
                    localStorage.setItem('aegisvee_setup_complete', 'true');
                    setShowSetupWizard(false);
                  }}
                />
              </Suspense>
            )}
          </Layout>
        </AntdApp>
      </ErrorBoundary>
    </ConfigProvider>
  );
}

export default App;
