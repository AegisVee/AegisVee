import React, { useState, useEffect, useCallback } from 'react';
import {
    Modal,
    Typography,
    Space,
    Tag,
    Progress,
    Segmented,
    Input,
    Button,
    Collapse,
} from 'antd';
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    MinusCircleOutlined,
    UserOutlined,
    EditOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;

const STATUS_COLORS = {
    pass: 'green',
    fail: 'red',
    partial: 'orange',
    pending: 'default',
    'not-started': 'default',
};

const STEP_OPTIONS = ['Pass', 'Fail', 'N/A'];

const stepStatusStyle = (status) => {
    switch (status) {
        case 'pass':
            return { background: '#f6ffed', borderColor: '#b7eb8f' };
        case 'fail':
            return { background: '#fff2f0', borderColor: '#ffccc7' };
        case 'na':
            return { background: '#f5f5f5', borderColor: '#d9d9d9' };
        default:
            return { background: '#fff', borderColor: '#f0f0f0' };
    }
};

const segmentedValueFromStatus = (status) => {
    if (status === 'pass') return 'Pass';
    if (status === 'fail') return 'Fail';
    if (status === 'na') return 'N/A';
    return null;
};

const statusFromSegmented = (val) => {
    if (val === 'Pass') return 'pass';
    if (val === 'Fail') return 'fail';
    if (val === 'N/A') return 'na';
    return 'pending';
};

const TestRunModal = ({ open, onClose, testRun, testCaseTitle, onSave }) => {
    const [steps, setSteps] = useState([]);
    const [notes, setNotes] = useState('');
    const [expandedNotes, setExpandedNotes] = useState({});

    useEffect(() => {
        if (testRun) {
            setSteps((testRun.steps || []).map((s) => ({ ...s })));
            setNotes(testRun.notes || '');
            setExpandedNotes({});
        }
    }, [testRun]);

    const handleStepStatusChange = useCallback((stepIndex, value) => {
        setSteps((prev) => {
            const updated = [...prev];
            updated[stepIndex] = {
                ...updated[stepIndex],
                status: statusFromSegmented(value),
            };
            return updated;
        });
    }, []);

    const handleStepNotesChange = useCallback((stepIndex, value) => {
        setSteps((prev) => {
            const updated = [...prev];
            updated[stepIndex] = {
                ...updated[stepIndex],
                notes: value,
            };
            return updated;
        });
    }, []);

    const handleStepActualResultChange = useCallback((stepIndex, value) => {
        setSteps((prev) => {
            const updated = [...prev];
            updated[stepIndex] = {
                ...updated[stepIndex],
                actual_result: value,
            };
            return updated;
        });
    }, []);

    const toggleNoteExpand = useCallback((stepIndex) => {
        setExpandedNotes((prev) => ({
            ...prev,
            [stepIndex]: !prev[stepIndex],
        }));
    }, []);

    const computeProgressAndStatus = (stepsList) => {
        const total = stepsList.length;
        if (total === 0) return { progress: 0, status: 'not-started' };

        const completed = stepsList.filter(
            (s) => s.status === 'pass' || s.status === 'fail' || s.status === 'na'
        );
        const progress = Math.round((completed.length / total) * 100);

        let status = 'partial';
        if (completed.length === 0) {
            status = 'not-started';
        } else if (completed.length === total) {
            const hasFail = stepsList.some((s) => s.status === 'fail');
            if (hasFail) {
                status = 'fail';
            } else {
                status = 'pass';
            }
        }

        return { progress, status };
    };

    const handleSave = () => {
        const { progress, status } = computeProgressAndStatus(steps);
        onSave({
            ...testRun,
            steps,
            notes,
            progress,
            status,
        });
    };

    if (!testRun) return null;

    const currentProgress = computeProgressAndStatus(steps);

    return (
        <Modal
            open={open}
            onCancel={onClose}
            width={720}
            title={
                <Space>
                    <span style={{ fontWeight: 700, fontSize: 16 }}>
                        Run #{testRun.run_number || testRun.id?.slice(-4) || '?'}
                    </span>
                </Space>
            }
            footer={
                <Space>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button
                        type="primary"
                        onClick={handleSave}
                        style={{ background: '#0EA5E9', borderColor: '#0EA5E9' }}
                    >
                        Save
                    </Button>
                </Space>
            }
            destroyOnClose
        >
            {/* Header info row */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 20,
                    padding: '12px 16px',
                    background: '#fafafa',
                    borderRadius: 8,
                    border: '1px solid #f0f0f0',
                }}
            >
                <div style={{ flex: 1 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        Test Case
                    </Text>
                    <div>
                        <Text strong style={{ fontSize: 14 }}>
                            {testCaseTitle || 'Untitled Test Case'}
                        </Text>
                    </div>
                    <Space style={{ marginTop: 8 }}>
                        <Tag icon={<UserOutlined />}>{testRun.owner || 'Unassigned'}</Tag>
                        <Tag color={STATUS_COLORS[currentProgress.status] || 'default'}>
                            {(currentProgress.status || 'pending').toUpperCase()}
                        </Tag>
                    </Space>
                </div>
                <div style={{ flexShrink: 0, marginLeft: 16 }}>
                    <Progress
                        type="circle"
                        percent={currentProgress.progress}
                        size={80}
                        strokeColor="#0EA5E9"
                        format={(pct) => (
                            <span style={{ fontSize: 16, fontWeight: 600 }}>{pct}%</span>
                        )}
                    />
                </div>
            </div>

            {/* Step list */}
            <div style={{ marginBottom: 16 }}>
                <Text strong style={{ fontSize: 14, display: 'block', marginBottom: 8 }}>
                    Steps ({steps.length})
                </Text>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {steps.map((step, idx) => {
                        const style = stepStatusStyle(step.status);
                        return (
                            <div
                                key={step.id || idx}
                                style={{
                                    padding: '12px 16px',
                                    borderRadius: 8,
                                    border: `1px solid ${style.borderColor}`,
                                    background: style.background,
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        justifyContent: 'space-between',
                                        gap: 12,
                                    }}
                                >
                                    <div style={{ flex: 1 }}>
                                        <Text strong style={{ fontSize: 13 }}>
                                            {idx + 1}. {step.title || `Step ${idx + 1}`}
                                        </Text>
                                        {step.expected_result && (
                                            <div style={{ marginTop: 4 }}>
                                                <Text
                                                    type="secondary"
                                                    style={{ fontSize: 12 }}
                                                >
                                                    Expected: {step.expected_result}
                                                </Text>
                                            </div>
                                        )}
                                    </div>
                                    <Segmented
                                        options={STEP_OPTIONS}
                                        value={segmentedValueFromStatus(step.status)}
                                        onChange={(val) => handleStepStatusChange(idx, val)}
                                        size="small"
                                    />
                                </div>

                                {/* Actual result input for failed steps */}
                                {step.status === 'fail' && (
                                    <div style={{ marginTop: 8 }}>
                                        <Input
                                            size="small"
                                            placeholder="Actual result..."
                                            value={step.actual_result || ''}
                                            onChange={(e) =>
                                                handleStepActualResultChange(idx, e.target.value)
                                            }
                                            prefix={
                                                <CloseCircleOutlined
                                                    style={{ color: '#ff4d4f' }}
                                                />
                                            }
                                        />
                                    </div>
                                )}

                                {/* Expandable notes */}
                                <div style={{ marginTop: 8 }}>
                                    <Button
                                        type="link"
                                        size="small"
                                        icon={<EditOutlined />}
                                        onClick={() => toggleNoteExpand(idx)}
                                        style={{ padding: 0, fontSize: 12 }}
                                    >
                                        {expandedNotes[idx] ? 'Hide notes' : 'Add notes'}
                                    </Button>
                                    {expandedNotes[idx] && (
                                        <TextArea
                                            rows={2}
                                            placeholder="Step notes..."
                                            value={step.notes || ''}
                                            onChange={(e) =>
                                                handleStepNotesChange(idx, e.target.value)
                                            }
                                            style={{ marginTop: 4, fontSize: 12 }}
                                        />
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {steps.length === 0 && (
                        <Text type="secondary" italic>
                            No steps defined for this test run.
                        </Text>
                    )}
                </div>
            </div>

            {/* Overall notes */}
            <div>
                <Text strong style={{ fontSize: 14, display: 'block', marginBottom: 8 }}>
                    Overall Notes
                </Text>
                <TextArea
                    rows={3}
                    placeholder="Add overall notes about this test run..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                />
            </div>
        </Modal>
    );
};

export default TestRunModal;
