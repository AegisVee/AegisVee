import React, { useState, useEffect, useCallback } from 'react';
import {
    Tree, Tabs, Input, Button, Badge, Spin, Tag, Typography,
    Popconfirm, Modal, message, Empty, Tooltip,
} from 'antd';
import {
    PlusOutlined, DeleteOutlined, AppstoreOutlined,
    InfoCircleOutlined, SettingOutlined, LinkOutlined,
    FolderOutlined, BlockOutlined,
} from '@ant-design/icons';
import { api } from '../../services/api';
import BlockPropertyEditor from './BlockPropertyEditor';

const { Text, Title } = Typography;
const { TextArea } = Input;

/**
 * BlocksView — System Blocks Module (Valispace-style).
 * Split view: left tree hierarchy + right detail panel with tabs.
 */
const BlocksView = ({ projectId }) => {
    const [blocks, setBlocks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedBlockId, setSelectedBlockId] = useState(null);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [newBlockName, setNewBlockName] = useState('');

    // ── Data loading ──────────────────────────────────────────────
    const loadBlocks = useCallback(async () => {
        if (!projectId) return;
        setLoading(true);
        try {
            const data = await api.getBlocks(projectId);
            setBlocks(Array.isArray(data) ? data : []);
        } catch (err) {
            message.error('Failed to load blocks');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        loadBlocks();
    }, [loadBlocks]);

    const selectedBlock = blocks.find(b => b.id === selectedBlockId) || null;

    // ── Tree data builder ─────────────────────────────────────────
    const buildTreeData = useCallback(() => {
        const map = {};
        const roots = [];
        blocks.forEach(b => {
            map[b.id] = {
                key: b.id,
                title: (
                    <span style={{ color: '#e5e7eb', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <BlockOutlined style={{ color: '#0EA5E9', fontSize: 12 }} />
                        {b.name || 'Untitled Block'}
                    </span>
                ),
                children: [],
            };
        });
        blocks.forEach(b => {
            if (b.parent_id && map[b.parent_id]) {
                map[b.parent_id].children.push(map[b.id]);
            } else {
                roots.push(map[b.id]);
            }
        });
        return roots;
    }, [blocks]);

    // ── CRUD operations ───────────────────────────────────────────
    const handleCreateBlock = useCallback(async () => {
        if (!newBlockName.trim()) {
            message.warning('Please enter a block name');
            return;
        }
        try {
            await api.createBlock(projectId, {
                name: newBlockName.trim(),
                parent_id: selectedBlockId || null,
            });
            setNewBlockName('');
            setCreateModalOpen(false);
            message.success('Block created');
            await loadBlocks();
        } catch (err) {
            message.error('Failed to create block');
        }
    }, [projectId, newBlockName, selectedBlockId, loadBlocks]);

    const handleUpdateBlock = useCallback(async (field, value) => {
        if (!selectedBlock) return;
        try {
            const updated = { ...selectedBlock, [field]: value };
            await api.updateBlock(projectId, selectedBlock.id, updated);
            message.success('Block updated');
            await loadBlocks();
        } catch (err) {
            message.error('Failed to update block');
        }
    }, [projectId, selectedBlock, loadBlocks]);

    const handlePropertiesChange = useCallback(async (newProperties) => {
        if (!selectedBlock) return;
        try {
            await api.updateBlock(projectId, selectedBlock.id, {
                ...selectedBlock,
                properties: newProperties,
            });
            await loadBlocks();
        } catch (err) {
            message.error('Failed to update properties');
        }
    }, [projectId, selectedBlock, loadBlocks]);

    const handleDeleteBlock = useCallback(async () => {
        if (!selectedBlock) return;
        try {
            await api.deleteBlock(projectId, selectedBlock.id);
            setSelectedBlockId(null);
            message.success('Block deleted');
            await loadBlocks();
        } catch (err) {
            message.error('Failed to delete block');
        }
    }, [projectId, selectedBlock, loadBlocks]);

    // ── Tab content renderers ─────────────────────────────────────
    const renderInfoTab = () => {
        if (!selectedBlock) return null;
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                    <Text style={{ color: '#9ca3af', fontSize: 12, display: 'block', marginBottom: 4 }}>
                        Block Name
                    </Text>
                    <Input
                        value={selectedBlock.name || ''}
                        onChange={e => {
                            // Optimistic local update
                            setBlocks(prev => prev.map(b =>
                                b.id === selectedBlock.id ? { ...b, name: e.target.value } : b
                            ));
                        }}
                        onBlur={e => handleUpdateBlock('name', e.target.value)}
                        onPressEnter={e => handleUpdateBlock('name', e.target.value)}
                        style={{ background: '#1f2937', borderColor: '#374151', color: '#e5e7eb' }}
                    />
                </div>
                <div>
                    <Text style={{ color: '#9ca3af', fontSize: 12, display: 'block', marginBottom: 4 }}>
                        Type
                    </Text>
                    <Tag color="blue">{selectedBlock.type || 'Component'}</Tag>
                </div>
                <div>
                    <Text style={{ color: '#9ca3af', fontSize: 12, display: 'block', marginBottom: 4 }}>
                        Description
                    </Text>
                    <TextArea
                        rows={4}
                        value={selectedBlock.description || ''}
                        placeholder="Enter block description..."
                        onChange={e => {
                            setBlocks(prev => prev.map(b =>
                                b.id === selectedBlock.id ? { ...b, description: e.target.value } : b
                            ));
                        }}
                        onBlur={e => handleUpdateBlock('description', e.target.value)}
                        style={{ background: '#1f2937', borderColor: '#374151', color: '#e5e7eb' }}
                    />
                </div>
                <div style={{ paddingTop: 8, borderTop: '1px solid #374151' }}>
                    <Text style={{ color: '#6b7280', fontSize: 11 }}>
                        ID: {selectedBlock.id}
                    </Text>
                </div>
            </div>
        );
    };

    const renderPropertiesTab = () => {
        if (!selectedBlock) return null;
        return (
            <BlockPropertyEditor
                properties={selectedBlock.properties || []}
                onChange={handlePropertiesChange}
            />
        );
    };

    const renderRequirementsTab = () => {
        if (!selectedBlock) return null;
        const reqIds = selectedBlock.linked_requirement_ids || [];
        if (reqIds.length === 0) {
            return (
                <Empty
                    description={<span style={{ color: '#6b7280' }}>No linked requirements</span>}
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    style={{ padding: '40px 0' }}
                />
            );
        }
        return (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {reqIds.map(rid => (
                    <Tooltip key={rid} title={`Requirement ${rid}`}>
                        <Tag
                            color="#0EA5E9"
                            style={{ cursor: 'pointer', fontSize: 13, padding: '2px 10px' }}
                        >
                            <LinkOutlined style={{ marginRight: 4 }} />
                            {rid}
                        </Tag>
                    </Tooltip>
                ))}
            </div>
        );
    };

    const detailTabs = [
        {
            key: 'info',
            label: (
                <span><InfoCircleOutlined style={{ marginRight: 4 }} />Info</span>
            ),
            children: renderInfoTab(),
        },
        {
            key: 'properties',
            label: (
                <span><SettingOutlined style={{ marginRight: 4 }} />Properties</span>
            ),
            children: renderPropertiesTab(),
        },
        {
            key: 'requirements',
            label: (
                <span><LinkOutlined style={{ marginRight: 4 }} />Requirements</span>
            ),
            children: renderRequirementsTab(),
        },
    ];

    // ── Render ────────────────────────────────────────────────────
    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#111827' }}>
            {/* Toolbar */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 16px',
                borderBottom: '1px solid #1f2937',
                background: '#0d1117',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <AppstoreOutlined style={{ color: '#0EA5E9', fontSize: 18 }} />
                    <span style={{ color: '#e5e7eb', fontWeight: 600, fontSize: 15 }}>
                        System Blocks
                    </span>
                    <Badge
                        count={blocks.length}
                        style={{ backgroundColor: '#0EA5E9' }}
                        showZero
                    />
                </div>
                <Button
                    type="primary"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() => setCreateModalOpen(true)}
                    style={{ background: '#0EA5E9', borderColor: '#0EA5E9' }}
                >
                    Create Block
                </Button>
            </div>

            {/* Split view */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Left panel: Tree */}
                <div style={{
                    width: 280,
                    minWidth: 280,
                    borderRight: '1px solid #1f2937',
                    background: '#0d1117',
                    overflow: 'auto',
                    padding: '8px 0',
                }}>
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                            <Spin />
                        </div>
                    ) : blocks.length === 0 ? (
                        <Empty
                            description={<span style={{ color: '#6b7280' }}>No blocks yet</span>}
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            style={{ padding: '40px 0' }}
                        />
                    ) : (
                        <Tree
                            treeData={buildTreeData()}
                            selectedKeys={selectedBlockId ? [selectedBlockId] : []}
                            onSelect={(keys) => {
                                if (keys.length > 0) setSelectedBlockId(keys[0]);
                            }}
                            defaultExpandAll
                            blockNode
                            showIcon={false}
                            className="blocks-tree"
                        />
                    )}
                </div>

                {/* Right panel: Detail */}
                <div style={{ flex: 1, overflow: 'auto', padding: 16, background: '#111827' }}>
                    {!selectedBlock ? (
                        <div style={{
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                            height: '100%', color: '#6b7280',
                        }}>
                            <FolderOutlined style={{ fontSize: 48, marginBottom: 12, color: '#374151' }} />
                            <Text style={{ color: '#6b7280' }}>
                                Select a block from the tree to view details
                            </Text>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                            {/* Block header */}
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid #1f2937',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <BlockOutlined style={{ color: '#0EA5E9', fontSize: 18 }} />
                                    <Title level={5} style={{ margin: 0, color: '#e5e7eb' }}>
                                        {selectedBlock.name || 'Untitled Block'}
                                    </Title>
                                </div>
                                <Popconfirm
                                    title="Delete this block?"
                                    description="This action cannot be undone."
                                    onConfirm={handleDeleteBlock}
                                    okText="Delete"
                                    okButtonProps={{ danger: true }}
                                    cancelText="Cancel"
                                >
                                    <Button
                                        type="text"
                                        danger
                                        size="small"
                                        icon={<DeleteOutlined />}
                                    >
                                        Delete
                                    </Button>
                                </Popconfirm>
                            </div>

                            {/* Tabs */}
                            <Tabs
                                items={detailTabs}
                                defaultActiveKey="info"
                                size="small"
                                className="blocks-detail-tabs"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Create modal */}
            <Modal
                title="Create New Block"
                open={createModalOpen}
                onOk={handleCreateBlock}
                onCancel={() => { setCreateModalOpen(false); setNewBlockName(''); }}
                okText="Create"
                okButtonProps={{ style: { background: '#0EA5E9', borderColor: '#0EA5E9' } }}
                styles={{ content: { background: '#1f2937' }, header: { background: '#1f2937', color: '#e5e7eb' } }}
            >
                <div style={{ marginBottom: 8 }}>
                    <Text style={{ color: '#9ca3af', fontSize: 12 }}>Block Name</Text>
                </div>
                <Input
                    value={newBlockName}
                    onChange={e => setNewBlockName(e.target.value)}
                    onPressEnter={handleCreateBlock}
                    placeholder="Enter block name..."
                    autoFocus
                    style={{ background: '#111827', borderColor: '#374151', color: '#e5e7eb' }}
                />
                {selectedBlockId && (
                    <div style={{ marginTop: 12 }}>
                        <Text style={{ color: '#6b7280', fontSize: 12 }}>
                            Parent: <Tag color="#0EA5E9">{blocks.find(b => b.id === selectedBlockId)?.name || selectedBlockId}</Tag>
                        </Text>
                    </div>
                )}
            </Modal>

            {/* Scoped styles */}
            <style>{`
                .blocks-tree .ant-tree {
                    background: transparent !important;
                    color: #e5e7eb;
                }
                .blocks-tree .ant-tree-treenode {
                    padding: 2px 8px !important;
                    border-radius: 4px;
                    margin: 1px 4px;
                }
                .blocks-tree .ant-tree-treenode:hover {
                    background: #1f2937 !important;
                }
                .blocks-tree .ant-tree-treenode-selected,
                .blocks-tree .ant-tree-node-selected {
                    background: rgba(14, 165, 233, 0.15) !important;
                }
                .blocks-tree .ant-tree-node-content-wrapper {
                    color: #e5e7eb !important;
                }
                .blocks-tree .ant-tree-node-content-wrapper.ant-tree-node-selected {
                    background: transparent !important;
                    color: #0EA5E9 !important;
                }
                .blocks-tree .ant-tree-switcher {
                    color: #6b7280 !important;
                }
                .blocks-detail-tabs .ant-tabs-nav {
                    margin-bottom: 12px !important;
                }
                .blocks-detail-tabs .ant-tabs-tab {
                    color: #9ca3af !important;
                    font-size: 13px;
                }
                .blocks-detail-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
                    color: #0EA5E9 !important;
                }
                .blocks-detail-tabs .ant-tabs-ink-bar {
                    background: #0EA5E9 !important;
                }
            `}</style>
        </div>
    );
};

export default BlocksView;
