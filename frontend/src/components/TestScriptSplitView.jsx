import React, { useState, useEffect } from 'react';
import { Row, Col, Typography, Button, Card, Steps, Divider, Space, message } from 'antd';
import { ArrowLeftOutlined, PlayCircleOutlined, SaveOutlined } from '@ant-design/icons';
import AegisEditor from './AegisEditor';
import { api } from '../services/api';

const { Title, Text, Paragraph } = Typography;

import TestReportModal from './TestReportModal';

const TestScriptSplitView = ({ reqId, projectId, onBack }) => {
    // Mock data - in a real app, fetch based on reqId
    const [testSteps, setTestSteps] = useState([
        { title: 'Initialize', description: 'Initialize HIL environment and connect to ECU.' },
        { title: 'Set Speed', description: 'Set vehicle speed to 50 km/h via CAN bus.' },
        { title: 'Monitor', description: 'Monitor speed feedback for 10 seconds.' },
        { title: 'Verify', description: 'Verify speed remains within +/- 2 km/h tolerance.' },
    ]);

    const [editorContent, setEditorContent] = useState(`def test_${reqId.toLowerCase().replace('-', '_')}_speed_control():
    # Step 1: Initialize
    hil.connect()
    time.sleep(2) # Wait for board to initialize
    
    # Step 2: Set Speed
    hil.set_speed(50)
    
    # Step 3: Monitor
    time.sleep(10)
    current_speed = hil.get_speed()
    
    # Step 4: Verify
    assert 48 <= current_speed <= 52, f"Speed {current_speed} out of range"
    
    hil.disconnect()
`);

    const [isReportVisible, setIsReportVisible] = useState(false);
    const [reportData, setReportData] = useState(null);
    const [isRunning, setIsRunning] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [existingScriptId, setExistingScriptId] = useState(null);

    // Try to load existing script for this requirement on mount
    useEffect(() => {
        const loadExistingScript = async () => {
            if (!projectId || !reqId) return;
            try {
                const scripts = await api.getProjectTestScriptsForReq(projectId, reqId);
                if (scripts && scripts.length > 0) {
                    // Load the first script found for this req
                    const script = scripts[0];
                    setExistingScriptId(script.id);
                    if (script.content) {
                        setEditorContent(script.content);
                    }
                }
            } catch (error) {
                console.error("Failed to load existing script:", error);
            }
        };
        loadExistingScript();
    }, [projectId, reqId]);

    const handleSaveScript = async () => {
        if (!projectId) {
            message.error("Project ID is missing. Cannot save script.");
            return;
        }

        setIsSaving(true);
        try {
            const scriptData = {
                requirement_id: reqId,
                title: `Test script for ${reqId}`,
                content: editorContent,
                type: 'automated'
            };

            if (existingScriptId) {
                // Update existing
                await api.updateProjectTestScript(projectId, existingScriptId, scriptData);
                message.success("Test script updated successfully!");
            } else {
                // Create new
                const result = await api.createProjectTestScript(projectId, scriptData);
                setExistingScriptId(result.id);
                message.success("Test script saved successfully!");
            }
        } catch (error) {
            console.error("Failed to save script:", error);
            message.error("Failed to save test script.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleRunTest = async () => {
        setIsRunning(true);
        try {
            const response = await fetch('http://localhost:8000/api/run_script', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ script: editorContent })
            });
            const data = await response.json();

            // Parse output to determine status and duration
            const output = data.output || "";
            const isPass = output.includes("TEST RESULT: PASS");

            // Extract duration if available (simple regex)
            const durationMatch = output.match(/Duration: ([\d.]+)s/);
            const duration = durationMatch ? `${durationMatch[1]}s` : "Unknown";

            setReportData({
                status: isPass ? 'PASS' : 'FAIL',
                output: output,
                duration: duration,
                testName: `test_${reqId.toLowerCase().replace('-', '_')}_speed_control`
            });
            setIsReportVisible(true);
        } catch (error) {
            console.error("Test execution failed:", error);
            setReportData({
                status: 'FAIL',
                output: `Error invoking backend: ${error.message}`,
                duration: '0s',
                testName: 'System Error'
            });
            setIsReportVisible(true);
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#121212' }}>
            {/* Header */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #303030', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#1c1c1c' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <Button
                        type="text"
                        icon={<ArrowLeftOutlined />}
                        onClick={onBack}
                        style={{ color: 'white' }}
                    />
                    <div>
                        <Title level={4} style={{ color: 'white', margin: 0 }}>Test Script: {reqId}</Title>
                        <Text type="secondary">Speed Control Verification</Text>
                    </div>
                </div>
                <Space>
                    <Button
                        icon={<SaveOutlined />}
                        onClick={handleSaveScript}
                        loading={isSaving}
                    >
                        Save Script
                    </Button>
                    <Button
                        type="primary"
                        icon={<PlayCircleOutlined />}
                        onClick={handleRunTest}
                        loading={isRunning}
                    >
                        Run Test
                    </Button>
                </Space>
            </div>

            {/* Split Content */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                {/* Left: Test Steps */}
                <div style={{ width: '40%', padding: '24px', overflowY: 'auto', borderRight: '1px solid #303030' }}>
                    <Title level={5} style={{ color: 'white', marginBottom: '24px' }}>Test Steps</Title>
                    <Steps
                        direction="vertical"
                        current={-1}
                        items={testSteps.map((step, index) => ({
                            title: <Text strong style={{ color: '#e0e0e0' }}>{step.title}</Text>,
                            description: <Text style={{ color: '#a0a0a0' }}>{step.description}</Text>,
                        }))}
                    />
                </div>

                {/* Right: Code Editor */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#1e1e1e' }}>
                    <div style={{ padding: '12px 24px', background: '#1e1e1e', borderBottom: '1px solid #303030' }}>
                        <Text strong style={{ color: '#e0e0e0' }}>Python Test Script</Text>
                    </div>
                    <div style={{ flex: 1, position: 'relative', background: '#1e1e1e' }}>
                        <AegisEditor
                            value={editorContent}
                            onChange={setEditorContent}
                            language="python"
                        />
                    </div>
                </div>
            </div>

            <TestReportModal
                visible={isReportVisible}
                onClose={() => setIsReportVisible(false)}
                reportData={reportData}
            />
        </div>
    );
};

export default TestScriptSplitView;
