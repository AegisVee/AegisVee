import React, { useEffect } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Typography, Button, Tag, List, Space } from 'antd';
import { PlayCircleOutlined, BugOutlined, CheckCircleOutlined, ThunderboltOutlined } from '@ant-design/icons';
import MonacoEditor from '@monaco-editor/react';
import AegisEditor from './AegisEditor';
import { useRAGStream } from '../hooks/useRAGStream';

const { Title, Text } = Typography;

const VModelView = ({ editorContent, setEditorContent, selectedRequirementId }) => {
    const [isRunning, setIsRunning] = React.useState(false);
    const [logs, setLogs] = React.useState([]);
    const [testStatus, setTestStatus] = React.useState(null); // null, 'running', 'pass', 'fail'
    const [scriptContent, setScriptContent] = React.useState("");

    // AI Generation Hook
    const { response: aiResponse, isLoading: isGenerating, startStreamQuery: generateScript } = useRAGStream();

    // Update script content as AI streams response
    useEffect(() => {
        if (aiResponse) {
            // Clean up markdown formatting
            let clean = aiResponse;
            clean = clean.replace(/```python/g, '');
            clean = clean.replace(/```/g, '');
            setScriptContent(clean);
        }
    }, [aiResponse]);

    const handleGenerateScript = () => {
        const reqId = selectedRequirementId || 'REQ-???';
        const prompt = `You are a Senior Verification & Validation Engineer following ISO 26262 Part 4 (Product Development at the System Level) and Automotive SPICE (ASPICE) SWE.4 / SWE.5 principles.

Generate a Python Pytest-style HIL validation script for the following requirement:

REQUIREMENT ID: ${reqId}
REQUIREMENT TEXT:
${editorContent}

The script MUST follow these V-Model verification principles:

1. **Traceability (ASPICE SWE.5 BP1)**: Include the Requirement ID as a docstring/comment for full traceability.
2. **Test Environment Setup (ISO 26262-4 §9.4.1)**: Define preconditions, initialize HIL interface.
3. **Input Stimuli (ISO 26262-4 §9.4.2)**: Apply defined test inputs via HIL commands.
4. **Expected Output / Pass-Fail Criteria (ISO 26262-4 §9.4.3)**: Assert measurable expected results with defined tolerance.
5. **Structured Pattern**: Use setup → execute → verify → teardown structure.
6. **Safety Integrity (ASIL)**: Add ASIL classification comment if applicable.

Use the 'hil_framework' mock library with these APIs:
- hil.connect() / hil.disconnect()
- hil.send_command(cmd_str)
- hil.read_telemetry(channel)
- hil.set_parameter(name, value)
- hil.wait(seconds)

IMPORTANT: Return ONLY the raw Python code. Do NOT use markdown formatting. Do NOT add explanations.`;
        generateScript(prompt);
    };

    const handleRunTest = async () => {
        if (!scriptContent) {
            setLogs([{ msg: "No script to run!", time: new Date().toLocaleTimeString(), status: 'Fail' }]);
            return;
        }

        setIsRunning(true);
        setLogs([]);
        setTestStatus('running');

        try {
            setLogs(prev => [...prev, { msg: "Sending script to HIL backend...", time: new Date().toLocaleTimeString(), status: 'Info' }]);

            const res = await fetch('http://localhost:8000/api/run_script', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ script: scriptContent })
            });

            const data = await res.json();

            if (data.error) {
                throw new Error(data.error);
            }

            // Process output logs
            const lines = data.output ? data.output.split('\n') : ["No output returned."];
            const newLogs = lines.map(line => ({
                msg: line,
                time: new Date().toLocaleTimeString(),
                status: 'Info'
            }));

            setLogs(prev => [...prev, ...newLogs]);
            setTestStatus(data.returncode === 0 ? 'pass' : 'fail');

        } catch (error) {
            console.error("Test Execution Error:", error);
            setLogs(prev => [...prev, { msg: `Error: ${error.message}`, time: new Date().toLocaleTimeString(), status: 'Fail' }]);
            setTestStatus('fail');
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <div style={{ height: '100%', width: '100%' }}>
            <PanelGroup direction="horizontal">

                {/* Column 1: Requirement (Left Side) */}
                <Panel defaultSize={33} minSize={20} style={{ display: 'flex', flexDirection: 'column', borderRight: '1px solid #424242' }}>
                    <div style={{ padding: '8px 16px', background: '#1c1c1c', borderBottom: '1px solid #424242' }}>
                        <Tag color="blue">{selectedRequirementId || 'REQ-???'}</Tag> <Text strong style={{ color: 'white' }}>Requirement Definition</Text>
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                        <AegisEditor value={editorContent} onChange={setEditorContent} />
                    </div>
                </Panel>

                <PanelResizeHandle style={{ width: 2, background: '#424242' }} />

                {/* Column 2: Test Script (Middle) */}
                <Panel defaultSize={34} minSize={20} style={{ display: 'flex', flexDirection: 'column', borderRight: '1px solid #424242' }}>
                    <div style={{ padding: '8px 16px', background: '#1c1c1c', borderBottom: '1px solid #424242', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span><Tag color="purple">AI Generated</Tag> <Text strong style={{ color: 'white' }}>HIL Validation Script</Text></span>
                        <Space>
                            <Button
                                type="dashed"
                                size="small"
                                icon={<ThunderboltOutlined />}
                                onClick={handleGenerateScript}
                                loading={isGenerating}
                                style={{ color: '#00b96b', borderColor: '#00b96b' }}
                            >
                                {isGenerating ? 'Generating...' : 'Generate Script'}
                            </Button>
                            <Button
                                type="primary"
                                size="small"
                                icon={<PlayCircleOutlined />}
                                style={{ background: isRunning ? '#424242' : '#00b96b', borderColor: isRunning ? '#424242' : '#00b96b' }}
                                loading={isRunning}
                                onClick={handleRunTest}
                            >
                                {isRunning ? 'Running...' : 'Run Test'}
                            </Button>
                        </Space>
                    </div>
                    <div style={{ flex: 1 }}>
                        <MonacoEditor
                            height="100%"
                            language="python"
                            theme="vs-dark"
                            value={scriptContent}
                            onChange={setScriptContent}
                            options={{ minimap: { enabled: false } }}
                        />
                    </div>
                </Panel>

                <PanelResizeHandle style={{ width: 2, background: '#424242' }} />

                {/* Column 3: Audit Report (Right Side) */}
                <Panel defaultSize={33} minSize={20} style={{ display: 'flex', flexDirection: 'column', background: '#1c1c1c' }}>
                    <div style={{ padding: '8px 16px', background: '#1c1c1c', borderBottom: '1px solid #424242' }}>
                        <Tag color="green">Live</Tag> <Text strong style={{ color: 'white' }}>Audit Report</Text>
                    </div>
                    <div style={{ padding: 16, overflowY: 'auto' }}>
                        {logs.length === 0 && !isRunning && !testStatus && (
                            <div style={{ textAlign: 'center', color: '#666', marginTop: 32 }}>
                                <BugOutlined style={{ fontSize: 24, marginBottom: 8 }} />
                                <p>Ready to run validation.</p>
                            </div>
                        )}

                        <List
                            itemLayout="horizontal"
                            dataSource={logs}
                            renderItem={item => (
                                <List.Item>
                                    <List.Item.Meta
                                        avatar={<CheckCircleOutlined style={{ color: '#52c41a', fontSize: 18 }} />}
                                        title={<Text style={{ color: 'white' }}>{item.msg}</Text>}
                                        description={<Text type="secondary">{item.time}</Text>}
                                    />
                                </List.Item>
                            )}
                        />

                        {testStatus === 'pass' && (
                            <div style={{ marginTop: 24, textAlign: 'center', padding: 24, border: '1px dashed #424242', borderRadius: 8 }}>
                                <Title level={2} style={{ color: '#52c41a', margin: 0 }}>PASS</Title>
                                <Text type="secondary">Last Run: Just now</Text>
                            </div>
                        )}
                    </div>
                </Panel>

            </PanelGroup>
        </div>
    );
};

export default VModelView;
