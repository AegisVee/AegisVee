import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import App from './App';

// Mock components that might be problematic or too heavy for basic smoke test
vi.mock('./components/EngineeringOS/GraphCanvas', () => ({
    default: () => <div data-testid="graph-canvas">Graph Canvas</div>
}));

vi.mock('./components/EngineeringOS/FlowTreeView', () => ({
    default: () => <div data-testid="flow-tree-view">Flow Tree View</div>
}));

vi.mock('./components/layout/ChatSidebar', () => ({
    default: () => <div data-testid="chat-sidebar">Chat Sidebar</div>
}));

vi.mock('./components/layout/ConsoleSidebar', () => ({
    default: () => <div data-testid="console-sidebar">Console Sidebar</div>
}));

vi.mock('./components/AegisEditor', () => ({
    default: () => <div data-testid="aegis-editor">Aegis Editor</div>
}));

vi.mock('./components/VModelView', () => ({
    default: () => <div data-testid="vmodel-view">VModel View</div>
}));

vi.mock('./components/TestScriptSplitView', () => ({
    default: () => <div data-testid="test-script-view">Test Script View</div>
}));

vi.mock('./components/KnowledgePanel', () => ({
    default: () => <div data-testid="knowledge-panel">Knowledge Panel</div>
}));

vi.mock('./components/AISettings/AISettingsPage', () => ({
    default: () => <div data-testid="ai-settings">AI Settings</div>
}));

vi.mock('./components/PluginManager/PluginManagerPage', () => ({
    default: () => <div data-testid="plugin-manager">Plugin Manager</div>
}));

vi.mock('./components/SetupWizard/SetupWizard', () => ({
    default: () => <div data-testid="setup-wizard">Setup Wizard</div>
}));

// Mock fetch to simulate backend being online
beforeEach(() => {
    global.fetch = vi.fn(() => Promise.resolve({
        json: () => Promise.resolve({}),
        ok: true,
        headers: new Headers(),
        body: {
            getReader: () => ({
                read: () => Promise.resolve({ done: true, value: new Uint8Array() })
            })
        }
    }));
    // Mark setup as complete so wizard doesn't show
    localStorage.setItem('aegisvee_setup_complete', 'true');
});

// Mock ResizeObserver which is used by react-resizable-panels but not in JSDOM
global.ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
};

describe('App Smoke Test', () => {
    it('renders the main layout with AegisVee branding', async () => {
        render(<App />);
        // Wait for backend status check to resolve and render the main layout
        await waitFor(() => {
            expect(screen.getByText(/AegisVee/i)).toBeInTheDocument();
        });
    });

    it('renders the sidebar with navigation items', async () => {
        render(<App />);
        // Wait for backend status check to resolve
        await waitFor(() => {
            expect(screen.getByText(/Home/i)).toBeInTheDocument();
        });
    });
});
