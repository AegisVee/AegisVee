import React, { useState, useMemo } from 'react';
import { Tree, Select, Menu, Badge, Avatar, Tooltip, Typography, Divider, Button, theme } from 'antd';
import {
    HomeOutlined,
    FileTextOutlined,
    ExperimentOutlined,
    SafetyCertificateOutlined,
    SettingOutlined,
    BellOutlined,
    FolderOutlined,
    GlobalOutlined,
    BuildOutlined,
    CheckCircleOutlined,
    ArrowLeftOutlined,
    PieChartOutlined,
} from '@ant-design/icons';
import { buildHierarchyTree, countDescendants } from './useTreeLayout';

const { Text } = Typography;

/**
 * Flow-style hierarchy sidebar for Engineering OS.
 * Shows: project selector, navigation, requirement hierarchy tree.
 */
const FlowHierarchySidebar = ({
    projects = [],
    selectedProjectId,
    onProjectSelect,
    requirements = [],
    selectedNodeId,
    onNodeSelect,
    activeSection = 'requirements',
    onSectionChange,
    onBackToDashboard,
}) => {
    const { token } = theme.useToken();
    const [expandedKeys, setExpandedKeys] = useState([]);

    // Build hierarchy tree for sidebar
    const treeData = useMemo(() => {
        const roots = buildHierarchyTree(requirements);

        const buildTreeNodes = (nodes) => {
            return nodes.map((node) => {
                const childCount = node.children?.length || 0;
                const descCount = countDescendants(node);
                return {
                    key: node.id,
                    title: (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%' }}>
                            <span style={{
                                fontSize: 13,
                                color: '#334155',
                                flex: 1,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}>
                                {node.title || node.id}
                            </span>
                            {descCount > 0 && (
                                <Badge
                                    count={descCount}
                                    style={{
                                        backgroundColor: '#F1F5F9',
                                        color: '#64748B',
                                        fontSize: 10,
                                        fontWeight: 600,
                                        boxShadow: 'none',
                                    }}
                                    size="small"
                                />
                            )}
                        </div>
                    ),
                    children: node.children?.length > 0 ? buildTreeNodes(node.children) : undefined,
                    isLeaf: !node.children || node.children.length === 0,
                };
            });
        };

        return buildTreeNodes(roots);
    }, [requirements]);

    const totalCount = requirements.length;

    // Navigation items
    const navItems = [
        { key: 'requirements', icon: <FileTextOutlined />, label: 'Requirements' },
        { key: 'test-specs', icon: <ExperimentOutlined />, label: 'Test Specs' },
        { key: 'blocks', icon: <BuildOutlined />, label: 'System Blocks' },
        {
            key: 'verifications',
            icon: <SafetyCertificateOutlined />,
            label: 'Verifications',
            children: [
                { key: 'design-values', label: 'Design Values' },
                { key: 'vnv-rules', icon: <CheckCircleOutlined />, label: 'V&V Rules' },
                { key: 'budget', icon: <PieChartOutlined />, label: 'Budget' },
                { key: 'documents', label: 'Documents' },
                { key: 'analysis', label: 'Analysis' },
            ],
        },
    ];

    const handleMenuClick = ({ key }) => {
        if (onSectionChange) onSectionChange(key);
    };

    return (
        <div
            style={{
                width: 260,
                minWidth: 260,
                height: '100%',
                background: '#FFFFFF',
                borderRight: '1px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
            }}
        >
            {/* Back to Dashboard */}
            <div style={{ padding: '10px 16px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Button
                    type="text"
                    icon={<ArrowLeftOutlined />}
                    onClick={onBackToDashboard}
                    style={{
                        color: '#0EA5E9',
                        fontWeight: 600,
                        fontSize: 13,
                        padding: '0 4px',
                        height: 32,
                    }}
                >
                    Dashboard
                </Button>
            </div>

            {/* Project Selector */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #F1F5F9' }}>
                <Select
                    value={selectedProjectId}
                    onChange={onProjectSelect}
                    style={{ width: '100%' }}
                    placeholder="Select Project"
                    options={projects.map(p => ({
                        value: p.id,
                        label: p.title || p.name || `Project ${p.id}`,
                    }))}
                    size="middle"
                />
            </div>

            {/* Navigation */}
            <div style={{ padding: '8px 0' }}>
                <Menu
                    mode="inline"
                    selectedKeys={[activeSection]}
                    onClick={handleMenuClick}
                    items={navItems}
                    style={{
                        border: 'none',
                        fontSize: 13,
                    }}
                />
            </div>

            <Divider style={{ margin: '0 16px', width: 'calc(100% - 32px)', minWidth: 'auto' }} />

            {/* Hierarchy Section */}
            <div style={{ padding: '8px 16px 4px', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Text style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Hierarchy
                </Text>
            </div>

            {/* All Requirements root */}
            <div
                style={{
                    padding: '6px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    background: !selectedNodeId ? '#F0F9FF' : 'transparent',
                    borderLeft: !selectedNodeId ? '3px solid #0EA5E9' : '3px solid transparent',
                }}
                onClick={() => onNodeSelect && onNodeSelect(null)}
            >
                <GlobalOutlined style={{ color: '#0EA5E9', fontSize: 14 }} />
                <Text strong style={{ fontSize: 13, color: '#0F172A', flex: 1 }}>
                    All Requirements
                </Text>
                <Badge
                    count={totalCount}
                    style={{
                        backgroundColor: '#E0F2FE',
                        color: '#0369A1',
                        fontSize: 11,
                        fontWeight: 700,
                        boxShadow: 'none',
                    }}
                    overflowCount={999}
                />
            </div>

            {/* Hierarchy Tree */}
            <div style={{ flex: 1, overflow: 'auto', padding: '0 4px' }}>
                <Tree
                    treeData={treeData}
                    selectedKeys={selectedNodeId ? [selectedNodeId] : []}
                    expandedKeys={expandedKeys}
                    onExpand={setExpandedKeys}
                    onSelect={(keys) => {
                        if (keys.length > 0 && onNodeSelect) {
                            onNodeSelect(keys[0]);
                        }
                    }}
                    showLine={{ showLeafIcon: false }}
                    blockNode
                    style={{ fontSize: 13, background: 'transparent' }}
                />
            </div>

            {/* User section at bottom */}
            <div
                style={{
                    padding: '12px 16px',
                    borderTop: '1px solid #F1F5F9',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                }}
            >
                <Avatar
                    size={28}
                    style={{ backgroundColor: '#0EA5E9', fontSize: 12, fontWeight: 600 }}
                >
                    A
                </Avatar>
                <Text style={{ fontSize: 13, color: '#334155', flex: 1 }}>Alex Chen</Text>
                <Tooltip title="Settings">
                    <SettingOutlined style={{ color: '#94A3B8', fontSize: 14, cursor: 'pointer' }} />
                </Tooltip>
                <Tooltip title="Notifications">
                    <BellOutlined style={{ color: '#94A3B8', fontSize: 14, cursor: 'pointer' }} />
                </Tooltip>
            </div>
        </div>
    );
};

export default FlowHierarchySidebar;
