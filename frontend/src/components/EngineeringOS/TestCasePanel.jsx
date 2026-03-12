import React, { useState, useEffect, useCallback } from 'react';
import {
    Card,
    Tabs,
    Tag,
    Typography,
    Button,
    Table,
    Space,
    Empty,
    Spin,
    Descriptions,
    Progress,
    Input,
    message,
} from 'antd';
import {
    PlusOutlined,
    ReloadOutlined,
    ExperimentOutlined,
    FileTextOutlined,
    LinkOutlined,
    PlayCircleOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    ClockCircleOutlined,
} from '@ant-design/icons';
import { api } from '../../services/api';
import TestRunModal from './TestRunModal';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;

const STATUS_COLORS = {
    pass: 'green',
    fail: 'red',
    partial: 'orange',
    pending: 'default',
    draft: 'default',
    'not-started': 'default',
    active: 'blue',
};

const STATUS_ICONS = {
    pass: <CheckCircleOutlined />,
    fail: <CloseCircleOutlined />,
    pending: <ClockCircleOutlined />,
    'not-started': <ClockCircleOutlined />,
};

const TestCasePanel = ({
    projectId,
    verificationMeasures,
    selectedTestCaseId,
    onSelectTestCase,
    onRefresh,
}) => {
    const [searchText, setSearchText] = useState('');
    const [runs, setRuns] = useState([]);
    const [runsLoading, setRunsLoading] = useState(false);
    const [selectedRun, setSelectedRun] = useState(null);
    const [runModalOpen, setRunModalOpen] = useState(false);
    const [creating, setCreating] = useState(false);

    const selectedTestCase = (verificationMeasures || []).find(
        (vm) => vm.id === selectedTestCaseId
    );

    // Load runs when a test case is selected
    const loadRuns = useCallback(async () => {
        if (!projectId || !selectedTestCaseId) return;
        setRunsLoading(true);
        try {
            const data = await api.getTestRuns(projectId, selectedTestCaseId);
            setRuns(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to load test runs:', err);
            setRuns([]);
        } finally {
            setRunsLoading(false);
        }
    }, [projectId, selectedTestCaseId]);

    useEffect(() => {
        loadRuns();
    }, [loadRuns]);

    const handleCreateRun = async () => {
        if (!projectId || !selectedTestCaseId) return;
        setCreating(true);
        try {
            // Build steps from the test case content or steps
            const steps = parseStepsFromContent(selectedTestCase);
            const data = {
                test_case_id: selectedTestCaseId,
                run_number: runs.length + 1,
                owner: '',
                status: 'not-started',
                steps,
                notes: '',
                progress: 0,
            };
            const newRun = await api.createTestRun(projectId, data);
            setRuns((prev) => [...prev, newRun]);
            message.success('Test run created');
        } catch (err) {
            message.error('Failed to create test run');
        } finally {
            setCreating(false);
        }
    };

    const handleRunClick = (run) => {
        setSelectedRun(run);
        setRunModalOpen(true);
    };

    const handleRunSave = async (updatedRun) => {
        try {
            await api.updateTestRun(projectId, updatedRun.id, updatedRun);
            setRuns((prev) =>
                prev.map((r) => (r.id === updatedRun.id ? updatedRun : r))
            );
            setRunModalOpen(false);
            setSelectedRun(null);
            message.success('Test run saved');
        } catch (err) {
            message.error('Failed to save test run');
        }
    };

    const filteredMeasures = (verificationMeasures || []).filter((vm) => {
        if (!searchText) return true;
        const q = searchText.toLowerCase();
        return (
            (vm.title || '').toLowerCase().includes(q) ||
            (vm.id || '').toLowerCase().includes(q)
        );
    });

    // Parse steps from test case content field
    const parseStepsFromContent = (tc) => {
        if (!tc) return [];
        // If the test case already has structured steps
        if (tc.steps && Array.isArray(tc.steps)) {
            return tc.steps.map((s, i) => ({
                id: s.id || `step-${i + 1}`,
                title: s.title || s.description || `Step ${i + 1}`,
                expected_result: s.expected_result || s.expectedResult || '',
                status: 'pending',
                actual_result: '',
                notes: '',
            }));
        }
        // Try to parse numbered steps from content string
        if (tc.content && typeof tc.content === 'string') {
            const lines = tc.content
                .split('\n')
                .map((l) => l.trim())
                .filter((l) => /^\d+[\.\)]/.test(l));
            if (lines.length > 0) {
                return lines.map((line, i) => ({
                    id: `step-${i + 1}`,
                    title: line.replace(/^\d+[\.\)]\s*/, ''),
                    expected_result: '',
                    status: 'pending',
                    actual_result: '',
                    notes: '',
                }));
            }
        }
        // Fallback: single step
        return [
            {
                id: 'step-1',
                title: tc.title || 'Execute test',
                expected_result: tc.pass_criteria || '',
                status: 'pending',
                actual_result: '',
                notes: '',
            },
        ];
    };

    const getStepsDisplay = (tc) => {
        if (!tc) return [];
        if (tc.steps && Array.isArray(tc.steps)) return tc.steps;
        if (tc.content && typeof tc.content === 'string') {
            const lines = tc.content
                .split('\n')
                .map((l) => l.trim())
                .filter((l) => /^\d+[\.\)]/.test(l));
            if (lines.length > 0) {
                return lines.map((line, i) => ({
                    id: i,
                    title: line.replace(/^\d+[\.\)]\s*/, ''),
                }));
            }
        }
        return [];
    };

    // -- Runs table columns --
    const runsColumns = [
        {
            title: 'Run #',
            dataIndex: 'run_number',
            key: 'run_number',
            width: 80,
            render: (val, record) => (
                <Button type="link" onClick={() => handleRunClick(record)} style={{ padding: 0 }}>
                    #{val || '?'}
                </Button>
            ),
        },
        {
            title: 'Owner',
            dataIndex: 'owner',
            key: 'owner',
            width: 120,
            render: (val) => val || <Text type="secondary">Unassigned</Text>,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 100,
            render: (val) => (
                <Tag
                    icon={STATUS_ICONS[val]}
                    color={STATUS_COLORS[val] || 'default'}
                >
                    {(val || 'pending').toUpperCase()}
                </Tag>
            ),
        },
        {
            title: 'Date',
            dataIndex: 'created_at',
            key: 'created_at',
            width: 140,
            render: (val) => {
                if (!val) return '-';
                try {
                    return new Date(val).toLocaleDateString();
                } catch {
                    return val;
                }
            },
        },
        {
            title: 'Progress',
            dataIndex: 'progress',
            key: 'progress',
            width: 160,
            render: (val) => (
                <Progress
                    percent={val || 0}
                    size="small"
                    strokeColor="#0EA5E9"
                    style={{ marginBottom: 0 }}
                />
            ),
        },
    ];

    // ---- Render ----

    return (
        <div style={{ display: 'flex', height: '100%', minHeight: 0 }}>
            {/* Left: test case list */}
            <div
                style={{
                    width: 280,
                    flexShrink: 0,
                    borderRight: '1px solid #f0f0f0',
                    display: 'flex',
                    flexDirection: 'column',
                    background: '#fafafa',
                }}
            >
                <div style={{ padding: '12px 12px 8px' }}>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: 8,
                        }}
                    >
                        <Text strong style={{ fontSize: 14 }}>
                            <ExperimentOutlined style={{ marginRight: 6 }} />
                            Test Cases
                        </Text>
                        {onRefresh && (
                            <Button
                                type="text"
                                size="small"
                                icon={<ReloadOutlined />}
                                onClick={onRefresh}
                            />
                        )}
                    </div>
                    <Search
                        placeholder="Search test cases..."
                        size="small"
                        allowClear
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                    />
                </div>
                <div
                    style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '0 8px 8px',
                    }}
                >
                    {filteredMeasures.length === 0 && (
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description="No test cases"
                            style={{ marginTop: 40 }}
                        />
                    )}
                    {filteredMeasures.map((vm) => (
                        <div
                            key={vm.id}
                            onClick={() => onSelectTestCase(vm.id)}
                            style={{
                                padding: '10px 12px',
                                marginBottom: 4,
                                borderRadius: 6,
                                cursor: 'pointer',
                                border:
                                    vm.id === selectedTestCaseId
                                        ? '1px solid #0EA5E9'
                                        : '1px solid transparent',
                                background:
                                    vm.id === selectedTestCaseId ? '#e6f7ff' : '#fff',
                                transition: 'all 0.15s ease',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 12,
                                        fontFamily: 'monospace',
                                        color: '#888',
                                    }}
                                >
                                    {vm.id?.slice(0, 8) || 'TC'}
                                </Text>
                                <Tag
                                    color={STATUS_COLORS[vm.status] || 'default'}
                                    style={{ fontSize: 10, lineHeight: '16px', padding: '0 4px' }}
                                >
                                    {(vm.status || 'draft').toUpperCase()}
                                </Tag>
                            </div>
                            <Text
                                ellipsis
                                style={{
                                    fontSize: 13,
                                    fontWeight: vm.id === selectedTestCaseId ? 600 : 400,
                                    display: 'block',
                                    marginTop: 2,
                                }}
                            >
                                {vm.title || 'Untitled'}
                            </Text>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right: detail view */}
            <div style={{ flex: 1, minWidth: 0, overflow: 'auto', padding: 16 }}>
                {!selectedTestCase ? (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                        }}
                    >
                        <Empty description="Select a test case to view details" />
                    </div>
                ) : (
                    <div>
                        <div style={{ marginBottom: 16 }}>
                            <Title level={4} style={{ margin: 0 }}>
                                {selectedTestCase.title || 'Untitled Test Case'}
                            </Title>
                            <Tag
                                color={STATUS_COLORS[selectedTestCase.status] || 'default'}
                                style={{ marginTop: 4 }}
                            >
                                {(selectedTestCase.status || 'draft').toUpperCase()}
                            </Tag>
                        </div>

                        <Tabs
                            defaultActiveKey="overview"
                            items={[
                                {
                                    key: 'overview',
                                    label: (
                                        <span>
                                            <FileTextOutlined /> Overview
                                        </span>
                                    ),
                                    children: (
                                        <Descriptions
                                            column={1}
                                            bordered
                                            size="small"
                                            labelStyle={{
                                                width: 140,
                                                fontWeight: 600,
                                                background: '#fafafa',
                                            }}
                                        >
                                            <Descriptions.Item label="Title">
                                                {selectedTestCase.title || '-'}
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Description">
                                                {selectedTestCase.description ||
                                                    selectedTestCase.content ||
                                                    '-'}
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Technique">
                                                {selectedTestCase.technique ||
                                                    selectedTestCase.verification_method ||
                                                    '-'}
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Environment">
                                                {selectedTestCase.environment || '-'}
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Pass Criteria">
                                                {selectedTestCase.pass_criteria ||
                                                    selectedTestCase.expectedResult ||
                                                    '-'}
                                            </Descriptions.Item>
                                        </Descriptions>
                                    ),
                                },
                                {
                                    key: 'steps',
                                    label: (
                                        <span>
                                            <PlayCircleOutlined /> Steps
                                        </span>
                                    ),
                                    children: (() => {
                                        const displaySteps = getStepsDisplay(selectedTestCase);
                                        if (displaySteps.length === 0) {
                                            return (
                                                <Empty
                                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                                    description="No steps defined"
                                                />
                                            );
                                        }
                                        return (
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: 8,
                                                }}
                                            >
                                                {displaySteps.map((step, i) => (
                                                    <div
                                                        key={step.id || i}
                                                        style={{
                                                            padding: '10px 14px',
                                                            borderRadius: 6,
                                                            border: '1px solid #f0f0f0',
                                                            background: '#fafafa',
                                                        }}
                                                    >
                                                        <Text strong style={{ fontSize: 13 }}>
                                                            {i + 1}.{' '}
                                                            {step.title ||
                                                                step.description ||
                                                                `Step ${i + 1}`}
                                                        </Text>
                                                        {(step.expected_result ||
                                                            step.expectedResult) && (
                                                            <div style={{ marginTop: 4 }}>
                                                                <Text
                                                                    type="secondary"
                                                                    style={{ fontSize: 12 }}
                                                                >
                                                                    Expected:{' '}
                                                                    {step.expected_result ||
                                                                        step.expectedResult}
                                                                </Text>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })(),
                                },
                                {
                                    key: 'runs',
                                    label: (
                                        <span>
                                            <ExperimentOutlined /> Runs
                                        </span>
                                    ),
                                    children: (
                                        <div>
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    marginBottom: 12,
                                                }}
                                            >
                                                <Text strong>
                                                    Test Run History ({runs.length})
                                                </Text>
                                                <Button
                                                    type="primary"
                                                    size="small"
                                                    icon={<PlusOutlined />}
                                                    onClick={handleCreateRun}
                                                    loading={creating}
                                                    style={{
                                                        background: '#0EA5E9',
                                                        borderColor: '#0EA5E9',
                                                    }}
                                                >
                                                    New Run
                                                </Button>
                                            </div>
                                            {runsLoading ? (
                                                <div
                                                    style={{
                                                        textAlign: 'center',
                                                        padding: 40,
                                                    }}
                                                >
                                                    <Spin />
                                                </div>
                                            ) : runs.length === 0 ? (
                                                <Empty
                                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                                    description="No test runs yet"
                                                />
                                            ) : (
                                                <Table
                                                    columns={runsColumns}
                                                    dataSource={runs}
                                                    rowKey="id"
                                                    size="small"
                                                    pagination={false}
                                                    onRow={(record) => ({
                                                        onClick: () => handleRunClick(record),
                                                        style: { cursor: 'pointer' },
                                                    })}
                                                />
                                            )}
                                        </div>
                                    ),
                                },
                                {
                                    key: 'requirements',
                                    label: (
                                        <span>
                                            <LinkOutlined /> Requirements
                                        </span>
                                    ),
                                    children: (
                                        <div>
                                            {selectedTestCase.requirement_id ? (
                                                <Descriptions
                                                    column={1}
                                                    bordered
                                                    size="small"
                                                    labelStyle={{
                                                        width: 140,
                                                        fontWeight: 600,
                                                        background: '#fafafa',
                                                    }}
                                                >
                                                    <Descriptions.Item label="Linked Requirement">
                                                        <Tag
                                                            color="blue"
                                                            style={{ fontFamily: 'monospace' }}
                                                        >
                                                            {selectedTestCase.requirement_id}
                                                        </Tag>
                                                    </Descriptions.Item>
                                                </Descriptions>
                                            ) : (
                                                <Empty
                                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                                    description="No linked requirements"
                                                />
                                            )}
                                        </div>
                                    ),
                                },
                            ]}
                        />
                    </div>
                )}
            </div>

            {/* Test Run Modal */}
            <TestRunModal
                open={runModalOpen}
                onClose={() => {
                    setRunModalOpen(false);
                    setSelectedRun(null);
                }}
                testRun={selectedRun}
                testCaseTitle={selectedTestCase?.title}
                onSave={handleRunSave}
            />
        </div>
    );
};

export default TestCasePanel;
