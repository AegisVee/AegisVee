import React, { useState } from 'react';
import VerticalTimeline from '../organisms/VerticalTimeline';
import TrafficLightCard from '../organisms/TrafficLightCard';
import RequirementTable from '../RequirementTable';
import TrainingDocBlock from '../TrainingDocBlock';
import SDKViewer from '../SDKViewer';
// v2 ASPICE Views
import RequirementsView from '../views/RequirementsView';
import ArchitectureView from '../views/ArchitectureView';
import VerificationView from '../views/VerificationView';
import TraceabilityMatrixView from '../views/TraceabilityMatrixView';
import ComplianceScorecardView from '../views/ComplianceScorecardView';
import { Row, Col, Typography, Button, Modal, Form, Input, Switch, DatePicker, message, Tabs } from 'antd';
import { ArrowLeftOutlined, CodeOutlined, AuditOutlined, PartitionOutlined, CheckSquareOutlined, NodeIndexOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { api } from '../../services/api';

const { Title } = Typography;

/**
 * ProjectDetailTemplate
 * The "Spoke" view showing detailed timeline and metrics for a specific project.
 */
const ProjectDetailTemplate = ({ onBack, onOpenTestScript, projectId, requirements, onSaveRequirements, onCreateRequirement }) => {
    const [isReqTableVisible, setIsReqTableVisible] = useState(false);
    const [isSDKViewerVisible, setIsSDKViewerVisible] = useState(false);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [form] = Form.useForm();

    const [timelineSteps, setTimelineSteps] = useState([
        { time: 'Oct 12', title: 'Requirements Frozen', description: 'All safety requirements approved.', active: false, completed: true },
        { time: 'Oct 15', title: 'Architecture Design', description: 'System architecture finalized.', active: false, completed: true },
        { time: 'Oct 20', title: 'Implementation', description: 'Code implementation in progress.', active: false, completed: true },
        { time: 'Today', title: 'HIL Testing', description: 'Hardware-in-the-Loop validation.', active: true, completed: false },
        { time: 'Pending', title: 'Final Release', description: 'Production build generation.', active: false, completed: false },
    ]);

    const handleSaveFlow = () => {
        form.validateFields().then(values => {
            const newSteps = values.steps.map(step => ({
                ...step,
            }));
            setTimelineSteps(newSteps);
            setIsEditModalVisible(false);
            message.success('Development Flow updated');
        });
    };

    // Pre-fill form when modal opens
    React.useEffect(() => {
        if (isEditModalVisible) {
            form.setFieldsValue({ steps: timelineSteps });
        }
    }, [isEditModalVisible, timelineSteps, form]);

    // Fetch real analytics
    React.useEffect(() => {
        const fetchAnalytics = async () => {
            setLoading(true);
            try {
                const data = await api.getProjectAnalytics(projectId);
                setAnalytics(data);
            } catch (e) {
                console.error("Failed to fetch analytics", e);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, [projectId]);

    // Fallbacks if data loading or invalid
    const reqStats = analytics?.requirements || { total: 0, linked: 0, percent: 0 };

    const projectTitles = {
        1: 'Braking System (ABS)',
        2: 'Lane Keep Assist (LKA)',
        3: 'Adaptive Cruise (ACC)'
    };

    const currentTitle = projectTitles[projectId] || 'Project Details';

    // ... timeline code ...


    // ASPICE tabs definition
    const aspiceTabs = [
        {
            key: 'requirements',
            label: <span><AuditOutlined /> Requirements</span>,
            children: <RequirementsView projectId={projectId} />,
        },
        {
            key: 'architecture',
            label: <span><PartitionOutlined /> Architecture</span>,
            children: <ArchitectureView projectId={projectId} />,
        },
        {
            key: 'verification',
            label: <span><CheckSquareOutlined /> Verification</span>,
            children: <VerificationView projectId={projectId} />,
        },
        {
            key: 'traceability',
            label: <span><NodeIndexOutlined /> Traceability</span>,
            children: <TraceabilityMatrixView projectId={projectId} />,
        },
        {
            key: 'compliance',
            label: <span><SafetyCertificateOutlined /> Compliance</span>,
            children: <ComplianceScorecardView projectId={projectId} />,
        },
        {
            key: 'overview',
            label: 'Overview',
            children: (
                <Row gutter={[32, 32]} style={{ padding: '16px 0' }}>
                    {/* Left: Timeline */}
                    <Col xs={24} md={6}>
                        <div className="flex justify-between items-center mb-4">
                            <Title level={4} style={{ color: 'var(--text-primary)', margin: 0 }}>Development Flow</Title>
                            <Button type="link" size="small" onClick={() => setIsEditModalVisible(true)}>Edit Flow</Button>
                        </div>
                        <VerticalTimeline steps={timelineSteps} />
                    </Col>
                    {/* Right: Metrics */}
                    <Col xs={24} md={18}>
                        <Row gutter={[24, 24]}>
                            <Col span={12}>
                                <div onClick={() => setIsReqTableVisible(true)} style={{ cursor: 'pointer', height: '100%' }}>
                                    <TrafficLightCard
                                        title="Requirements"
                                        status={reqStats.percent === 100 ? "success" : "warning"}
                                        statusText={`${reqStats.percent}% Covered`}
                                        metrics={[
                                            { label: 'Total', value: reqStats.total, unit: 'reqs' },
                                            { label: 'Linked', value: reqStats.linked, unit: '' }
                                        ]}
                                    />
                                </div>
                            </Col>
                            <Col span={24}>
                                <TrainingDocBlock />
                            </Col>
                        </Row>
                    </Col>
                </Row>
            ),
        },
    ];

    return (
        <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto', height: '100%', overflowY: 'auto' }}>
            <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={onBack}
                style={{ color: 'var(--text-secondary)', marginBottom: '16px', paddingLeft: 0 }}
            >
                Back to Dashboard
            </Button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <Title level={2} style={{ color: 'var(--text-primary)', margin: 0 }}>{currentTitle}</Title>
                <div style={{ display: 'flex', gap: '16px' }}>
                    <Button
                        icon={<CodeOutlined />}
                        onClick={() => setIsSDKViewerVisible(true)}
                        style={{ background: '#141414', color: '#fff', borderColor: '#303030' }}
                    >
                        SDK Knowledge Base
                    </Button>
                </div>
            </div>

            {/* ASPICE Process Tabs — v2 */}
            <Tabs
                defaultActiveKey="requirements"
                items={aspiceTabs}
                style={{ minHeight: 400 }}
            />

            {/* Requirement Table Modal */}
            <Modal
                title="Requirements Management"
                open={isReqTableVisible}
                onCancel={() => setIsReqTableVisible(false)}
                footer={null}
                width="100%"
                style={{ top: 0, margin: 0, maxWidth: '100vw', height: '100vh', padding: 0 }}
                bodyStyle={{ height: 'calc(100vh - 55px)', overflowY: 'auto' }}
            >
                <RequirementTable
                    projectId={projectId}
                    onOpenTestScript={onOpenTestScript}
                    requirements={requirements}
                    onSave={onSaveRequirements}
                    onCreate={onCreateRequirement}
                />
            </Modal>

            <Modal
                title={null}
                open={isSDKViewerVisible}
                onCancel={() => setIsSDKViewerVisible(false)}
                footer={null}
                width="90vw"
                style={{ top: 20, height: 'calc(100vh - 40px)' }}
                bodyStyle={{ height: 'calc(100vh - 80px)', padding: 0, overflow: 'hidden' }}
                closeIcon={<span style={{ color: '#fff' }}>X</span>}
            >
                <SDKViewer />
            </Modal>

            {/* Edit Flow Modal */}
            <Modal
                title="Edit Development Flow"
                open={isEditModalVisible}
                onCancel={() => setIsEditModalVisible(false)}
                onOk={handleSaveFlow}
                width={600}
            >
                <Form form={form} layout="vertical">
                    <Form.List name="steps">
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map(({ key, name, ...restField }) => (
                                    <div key={key} style={{ marginBottom: 16, border: '1px solid #303030', padding: 12, borderRadius: 8 }}>
                                        <Row gutter={16}>
                                            <Col span={8}>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'time']}
                                                    label="Time/Date"
                                                    rules={[{ required: true, message: 'Missing time' }]}
                                                >
                                                    <Input placeholder="e.g. Oct 12" />
                                                </Form.Item>
                                            </Col>
                                            <Col span={16}>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'title']}
                                                    label="Title"
                                                    rules={[{ required: true, message: 'Missing title' }]}
                                                >
                                                    <Input placeholder="Step Title" />
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                        <Form.Item
                                            {...restField}
                                            name={[name, 'description']}
                                            label="Description"
                                        >
                                            <Input.TextArea rows={2} placeholder="Description" />
                                        </Form.Item>
                                        <Row gutter={16}>
                                            <Col span={12}>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'completed']}
                                                    valuePropName="checked"
                                                    label="Completed"
                                                >
                                                    <Switch />
                                                </Form.Item>
                                            </Col>
                                            <Col span={12}>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'active']}
                                                    valuePropName="checked"
                                                    label="Active (Current)"
                                                >
                                                    <Switch />
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                    </div>
                                ))}
                            </>
                        )}
                    </Form.List>
                </Form>
            </Modal>
        </div>
    );
};

export default ProjectDetailTemplate;
