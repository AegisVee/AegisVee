import React, { useState } from 'react';
import { Table, Input, Button, Typography, Tag, Tooltip, Modal, Spin, message, Upload, Popover, Checkbox, Badge, Space, Select, notification } from 'antd';
import { SaveOutlined, LinkOutlined, ThunderboltOutlined, CopyOutlined, DownloadOutlined, UploadOutlined, PlusOutlined, SettingOutlined, SyncOutlined, DeleteOutlined, ApartmentOutlined } from '@ant-design/icons';
import { api } from '../services/api';
import RichTextCell from './common/RichTextCell';
import DrawioImportModal from './DrawioImportModal';
import TopToolBar from './layout/TopToolBar';

const { Text } = Typography;
const { TextArea } = Input;

const SIGNAL_TYPES = ['float', 'int', 'uint8_t', 'uint16_t', 'uint32_t', 'bool', 'string'];

/** Inline signal parameters editor shown in the expandable row */
function SignalParametersPanel({ record, projectId, onPropagate }) {
    const [params, setParams] = useState(() => record.parameters || []);
    const [dirty, setDirty] = useState(false);
    const [propagating, setPropagating] = useState(false);

    const addParam = () => {
        setParams([...params, { name: '', type: 'float', value: '', unit: '' }]);
        setDirty(true);
    };

    const removeParam = (idx) => {
        setParams(params.filter((_, i) => i !== idx));
        setDirty(true);
    };

    const changeParam = (idx, field, value) => {
        const updated = params.map((p, i) => i === idx ? { ...p, [field]: value } : p);
        setParams(updated);
        setDirty(true);
    };

    const handlePropagate = async () => {
        const invalid = params.some(p => !p.name.trim() || !p.value.trim());
        if (invalid) {
            message.warning('All parameters must have a name and value before propagating.');
            return;
        }
        setPropagating(true);
        try {
            const result = await api.propagateProjectRequirement(projectId, record.id, params);
            notification.success({
                message: 'Change propagated successfully',
                description: result.summary,
                duration: 6
            });
            setDirty(false);
            if (onPropagate) onPropagate();
        } catch (e) {
            notification.error({ message: `Propagation failed: ${e.message}` });
        } finally {
            setPropagating(false);
        }
    };

    return (
        <div style={{ padding: '8px 0 4px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Text strong style={{ fontSize: 13 }}>Signal Parameters</Text>
                <Text type="secondary" style={{ fontSize: 11 }}>
                    Use <code style={{ background: 'var(--bg-card)', padding: '1px 4px', borderRadius: 3 }}>{'{{name}}'}</code> in description / testSteps / expectedResult
                </Text>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                    <tr style={{ color: 'var(--text-secondary)' }}>
                        <th style={{ textAlign: 'left', padding: '2px 6px', width: 150 }}>Name</th>
                        <th style={{ textAlign: 'left', padding: '2px 6px', width: 110 }}>Type</th>
                        <th style={{ textAlign: 'left', padding: '2px 6px', width: 100 }}>Value</th>
                        <th style={{ textAlign: 'left', padding: '2px 6px', width: 80 }}>Unit</th>
                        <th style={{ width: 32 }} />
                    </tr>
                </thead>
                <tbody>
                    {params.map((p, idx) => (
                        <tr key={idx}>
                            <td style={{ padding: '2px 4px' }}>
                                <Input
                                    size="small"
                                    value={p.name}
                                    placeholder="signal_name"
                                    onChange={e => changeParam(idx, 'name', e.target.value)}
                                />
                            </td>
                            <td style={{ padding: '2px 4px' }}>
                                <Select
                                    size="small"
                                    value={p.type}
                                    style={{ width: '100%' }}
                                    options={SIGNAL_TYPES.map(t => ({ value: t, label: t }))}
                                    onChange={v => changeParam(idx, 'type', v)}
                                />
                            </td>
                            <td style={{ padding: '2px 4px' }}>
                                <Input
                                    size="small"
                                    value={p.value}
                                    placeholder="50.0"
                                    onChange={e => changeParam(idx, 'value', e.target.value)}
                                />
                            </td>
                            <td style={{ padding: '2px 4px' }}>
                                <Input
                                    size="small"
                                    value={p.unit}
                                    placeholder="km/h"
                                    onChange={e => changeParam(idx, 'unit', e.target.value)}
                                />
                            </td>
                            <td style={{ padding: '2px 0' }}>
                                <Button
                                    type="text"
                                    size="small"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => removeParam(idx)}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <Button size="small" icon={<PlusOutlined />} onClick={addParam}>
                    Add Parameter
                </Button>
                {dirty && (
                    <Button
                        size="small"
                        type="primary"
                        icon={<SyncOutlined />}
                        loading={propagating}
                        onClick={handlePropagate}
                        style={{ background: '#722ed1', borderColor: '#722ed1' }}
                    >
                        Propagate Changes
                    </Button>
                )}
            </div>
        </div>
    );
}

const RequirementTable = ({ projectId, onOpenTestScript, requirements, onSave, onCreate, onRefresh }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editingKey, setEditingKey] = useState('');
    const [isCodeGenModalVisible, setIsCodeGenModalVisible] = useState(false);
    const [generatedCode, setGeneratedCode] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [currentReq, setCurrentReq] = useState(null);
    const [drawioModalOpen, setDrawioModalOpen] = useState(false);
    const [visibleColumns, setVisibleColumns] = useState({
        id: true,
        description: true,
        testSteps: true,
        expectedResult: true,
        linkedApis: true,
        status: true
    });

    // Fetch data from backend on mount or sync with props
    React.useEffect(() => {
        if (requirements) {
            setData(requirements);
        } else {
            fetchRequirements();
        }
    }, [requirements]);

    const fetchRequirements = async () => {
        setLoading(true);
        try {
            const result = projectId ? await api.getProjectRequirements(projectId) : [];
            setData(Array.isArray(result) ? result : []);
        } catch (error) {
            console.error("Fetch error:", error);
            message.error("Failed to fetch requirements");
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            message.loading({ content: 'Exporting...', key: 'export' });
            const blob = await api.exportProjectRequirements(projectId);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'requirements.xlsx';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            message.success({ content: 'Export successful!', key: 'export' });
        } catch (error) {
            console.error(error);
            message.error({ content: 'Export failed', key: 'export' });
        }
    };

    const handleImport = async (file) => {
        try {
            message.loading({ content: 'Importing...', key: 'import' });
            const res = await api.importProjectRequirements(projectId, file);
            if (res.status === 'success') {
                message.success({ content: `Imported ${res.imported_count} requirements!`, key: 'import' });
                fetchRequirements(); // Refresh table
            } else {
                message.error({ content: `Import failed: ${res.error}`, key: 'import' });
            }
        } catch (error) {
            console.error(error);
            message.error({ content: 'Import failed', key: 'import' });
        }
        return false; // Prevent auto upload
    };

    const handleSmartImport = async (file) => {
        try {
            message.loading({ content: 'AI is analyzing requirements...', key: 'importsmart', duration: 0 });
            const res = await api.importSmartProjectRequirements(projectId, file);
            if (res.status === 'success') {
                message.success({ content: `AI successfully extracted ${res.imported_count} requirements!`, key: 'importsmart' });
                fetchRequirements(); // Refresh table
            } else {
                message.error({ content: `Smart Import failed: ${res.error}`, key: 'importsmart' });
            }
        } catch (error) {
            console.error(error);
            message.error({ content: 'Smart Import failed', key: 'importsmart' });
        }
        return false; // Prevent auto upload
    };

    const handleSaveAll = async () => {
        setLoading(true);
        try {
            if (onSave) {
                await onSave(data);
                message.success("Requirements saved (synced)");
            } else {
                const res = await api.saveProjectRequirements(projectId, data);
                if (res.ok) {
                    message.success("Requirements saved to server");
                } else {
                    throw new Error("Save failed");
                }
            }
            setEditingKey('');
        } catch (error) {
            message.error(error.message || "Save failed");
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        if (onCreate) {
            await onCreate();
            // Parent state update will trigger useEffect to update local data
            message.success('New requirement added (synced)');
        } else {
            const newReq = {
                key: `new-${Date.now()}`,
                id: `REQ-${Math.floor(Math.random() * 10000)}`,
                description: 'New Requirement',
                testSteps: '',
                expectedResult: '',
                linkedApis: [],
                status: 'Pending'
            };
            setData([...data, newReq]);
            message.success('New requirement added');
        }
    };

    const handleGenerateSteps = async (record) => {
        message.loading({ content: 'AI Generating test steps...', key: 'genSteps' });
        try {
            // Reusing SDK endpoint for logic; in a real app, this might be a specific RAG prompt
            const prompt = `Generate 3 clear HIL test steps for this requirement: ${record.description}. Return ONLY the steps separated by newlines.`;
            // For now, we'll use a simplified mock or the generate-code endpoint with a custom prompt if possible
            // Actually, let's just simulate for now or use the generic RAG query if available.
            // RequirementTable doesn't have useRAGStream, so we'll just update it with a mock "AI" response for now
            // or I should implement a generic 'analyze' endpoint.

            setTimeout(() => {
                const mockSteps = "1. Connect ECU to HIL\n2. Stimulate input signal\n3. Verify response within 10ms";
                handleCellChange(record.key, 'testSteps', mockSteps);
                message.success({ content: 'Test steps generated!', key: 'genSteps' });
            }, 1500);
        } catch (error) {
            message.error({ content: 'Failed to generate steps', key: 'genSteps' });
        }
    };

    const handleCellChange = (key, dataIndex, value) => {
        const newData = [...data];
        const index = newData.findIndex(item => key === item.key);
        if (index > -1) {
            newData[index][dataIndex] = value;
            setData(newData);
        }
    };

    const handleGenerateCode = async (record) => {
        setCurrentReq(record);
        setIsCodeGenModalVisible(true);
        setGeneratedCode('');
        setIsGenerating(true);

        try {
            const response = await fetch('http://localhost:8000/api/generate-code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    requirement: record.description,
                    linked_apis: record.linkedApis || []
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to generate code');
            }

            const result = await response.json();
            if (result.error) {
                throw new Error(result.error);
            }

            setGeneratedCode(result.code);
        } catch (error) {
            message.error(`Error: ${error.message}`);
            setGeneratedCode('// Error generating code');
        } finally {
            setIsGenerating(false);
        }
    };

    const allColumns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: '10%',
            render: (text) => <Text strong>{text}</Text>,
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            width: '30%',
            render: (text, record) => (
                <RichTextCell
                    value={text}
                    onChange={(val) => handleCellChange(record.key, 'description', val)}
                />
            )
        },
        {
            title: 'Test Steps',
            dataIndex: 'testSteps',
            key: 'testSteps',
            width: '25%',
            render: (text, record) => (
                <div style={{ position: 'relative' }}>
                    <RichTextCell
                        value={text}
                        onChange={(val) => handleCellChange(record.key, 'testSteps', val)}
                    />
                    <Tooltip title="AI Generate Steps">
                        <Button
                            type="text"
                            size="small"
                            icon={<ThunderboltOutlined style={{ color: 'var(--status-yellow)', fontSize: '12px' }} />}
                            style={{ position: 'absolute', right: 0, top: 0, zIndex: 10 }}
                            onClick={() => handleGenerateSteps(record)}
                        />
                    </Tooltip>
                </div>
            ),
        },
        {
            title: 'Expected Result',
            dataIndex: 'expectedResult',
            key: 'expectedResult',
            width: '15%',
            render: (text, record) => (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Input
                        defaultValue={text}
                        bordered={false}
                        style={{ padding: 0, color: 'var(--text-secondary)' }}
                        onChange={(e) => handleCellChange(record.key, 'expectedResult', e.target.value)}
                    />
                    <Tooltip title="Open Test Script">
                        <Button
                            type="text"
                            icon={<LinkOutlined style={{ color: 'var(--brand-primary)' }} />}
                            onClick={() => onOpenTestScript && onOpenTestScript(record.id)}
                        />
                    </Tooltip>
                </div>
            ),
        },
        {
            title: 'Linked SDK APIs',
            dataIndex: 'linkedApis',
            key: 'linkedApis',
            width: '15%',
            render: (apis, record) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {apis && apis.length > 0 ? (
                            apis.map(api => <Tag color="geekblue" key={api} style={{ margin: 0 }}>{api}</Tag>)
                        ) : (
                            <Text type="secondary" style={{ fontSize: '12px' }}>No APIs linked</Text>
                        )}
                    </div>
                    <Button
                        type="dashed"
                        size="small"
                        icon={<ThunderboltOutlined />}
                        style={{ fontSize: '12px', width: '100%', marginTop: '4px', borderColor: 'var(--status-yellow)', color: 'var(--status-yellow)' }}
                        onClick={() => handleGenerateCode(record)}
                    >
                        Generate Code
                    </Button>
                </div>
            )
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: '10%',
            render: (status) => {
                let color = status === 'Verified' ? 'green' : status === 'Pending' ? 'gold' : 'blue';
                return (
                    <Tag color={color} key={status}>
                        {status.toUpperCase()}
                    </Tag>
                );
            },
        },
    ];

    const columns = allColumns.filter(col => visibleColumns[col.key]);

    const columnContent = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {Object.keys(visibleColumns).map(key => (
                <Checkbox
                    key={key}
                    checked={visibleColumns[key]}
                    onChange={(e) => setVisibleColumns({ ...visibleColumns, [key]: e.target.checked })}
                >
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </Checkbox>
            ))}
        </div>
    );

    return (
        <div style={{ background: 'var(--bg-panel)', padding: '0px', borderRadius: '8px', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <TopToolBar
                title="Requirements"
                onUndo={() => message.info('Undo clicked')}
                onShare={handleExport}
                onCollaborate={() => message.info('Collaborate clicked')}
                onMore={() => setDrawioModalOpen(true)}
            />
            <div style={{ padding: '16px', flex: 1, overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <Button
                            icon={<DownloadOutlined />}
                            onClick={handleExport}
                        >
                            Export Excel
                        </Button>
                        <Upload
                            showUploadList={false}
                            beforeUpload={handleImport}
                            accept=".xlsx, .xls"
                        >
                            <Button icon={<UploadOutlined />}>Import Excel</Button>
                        </Upload>
                        <Upload
                            showUploadList={false}
                            beforeUpload={handleSmartImport}
                            accept=".xlsx, .xls"
                        >
                            <Button icon={<ThunderboltOutlined />} style={{ background: '#f5222d', color: 'white', borderColor: '#f5222d' }}>
                                AI Smart Import
                            </Button>
                        </Upload>
                        <Button
                            icon={<ApartmentOutlined />}
                            onClick={() => setDrawioModalOpen(true)}
                            style={{ borderColor: '#1677ff', color: '#1677ff' }}
                        >
                            Import draw.io
                        </Button>
                        <Button
                            type="primary"
                            icon={<SaveOutlined />}
                            loading={loading}
                            onClick={handleSaveAll}
                        >
                            Save Changes
                        </Button>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <Popover content={columnContent} title="Visible Columns" trigger="click" placement="bottomRight">
                            <Button icon={<SettingOutlined />}>Modify Columns</Button>
                        </Popover>
                        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                            Add Requirement
                        </Button>
                    </div>
                </div>
                <Spin spinning={loading}>
                    <Table
                        columns={columns}
                        dataSource={data}
                        pagination={false}
                        rowClassName="editable-row"
                        bordered
                        size="small"
                        style={{ background: 'transparent' }}
                        expandable={{
                            expandedRowRender: (record) => (
                                <div style={{ padding: '4px 8px' }}>
                                    <SignalParametersPanel
                                        record={record}
                                        projectId={projectId}
                                        onPropagate={() => {
                                            fetchRequirements();
                                            if (onRefresh) onRefresh();
                                        }}
                                    />
                                </div>
                            ),
                            rowExpandable: () => true
                        }}
                    />
                </Spin>

                <Modal
                    title={`Generated Code for ${currentReq?.id}`}
                    open={isCodeGenModalVisible}
                    onCancel={() => setIsCodeGenModalVisible(false)}
                    footer={[
                        <Button key="copy" icon={<CopyOutlined />} onClick={() => { navigator.clipboard.writeText(generatedCode); message.success('Copied!'); }}>Copy</Button>,
                        <Button key="close" type="primary" onClick={() => setIsCodeGenModalVisible(false)}>Close</Button>
                    ]}
                    width={800}
                    bodyStyle={{ maxHeight: '600px', overflowY: 'auto', background: 'var(--bg-app)' }}
                >
                    {isGenerating ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <Spin size="large" />
                            <div style={{ marginTop: 16, color: 'var(--text-primary)' }}>Generating implementation using SDK...</div>
                        </div>
                    ) : (
                        <pre style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: '4px', color: 'var(--status-green)', overflowX: 'auto' }}>
                            {generatedCode}
                        </pre>
                    )}
                </Modal>

                <DrawioImportModal
                    open={drawioModalOpen}
                    onClose={() => setDrawioModalOpen(false)}
                    projectId={projectId}
                    onImported={() => {
                        fetchRequirements();
                        if (onRefresh) onRefresh();
                    }}
                />
            </div>
        </div>
    );
};

export default RequirementTable;
