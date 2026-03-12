import React, { useState, useEffect, useMemo } from 'react';
import { Table, Tag, Avatar, Tooltip, Typography } from 'antd';
import { CheckCircleFilled, CloseCircleFilled, SafetyCertificateOutlined } from '@ant-design/icons';
import { api } from '../../services/api';

const { Text } = Typography;

const TAG_COLORS = {
    'Released': 'green',
    'Assumption': 'orange',
    'Work in Progress': 'gold',
    'Pending review': 'blue',
    'Draft': 'default',
    'Approved': 'cyan',
    'Verified': 'green',
    'Rejected': 'red',
    'Launch vehicle': 'purple',
    'Payload': 'geekblue',
    'Propulsion system': 'magenta',
    'Attitude control system': 'volcano',
    'Stage 1': 'lime',
    'Stage 2': 'gold',
};

/**
 * Flow-style table view for requirements.
 * Ant Design table with columns matching Flow's layout.
 */
const FlowTableView = ({
    requirements = [],
    selectedNodeId,
    onNodeSelect,
    onNodeDoubleClick,
    loading = false,
    projectId,
}) => {
    // Load V&V rules for status column
    const [vnvRules, setVnvRules] = useState([]);
    useEffect(() => {
        if (!projectId) return;
        api.getVnVRules(projectId)
            .then((data) => setVnvRules(Array.isArray(data) ? data : []))
            .catch(() => setVnvRules([]));
    }, [projectId]);

    // Build requirement -> V&V status map
    const vnvStatusMap = useMemo(() => {
        const map = {};
        vnvRules.forEach((rule) => {
            const reqId = rule.requirement_id;
            if (!reqId) return;
            if (!map[reqId]) map[reqId] = { total: 0, verified: 0 };
            map[reqId].total += 1;
            if (rule.status === 'verified') map[reqId].verified += 1;
        });
        return map;
    }, [vnvRules]);

    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 100,
            render: (id) => (
                <Text style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600, color: '#64748B' }}>
                    {id}
                </Text>
            ),
            sorter: (a, b) => {
                const numA = parseInt(a.id?.replace('REQ-', '') || '0');
                const numB = parseInt(b.id?.replace('REQ-', '') || '0');
                return numA - numB;
            },
        },
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
            ellipsis: true,
            render: (title) => (
                <Text style={{ fontSize: 13, fontWeight: 500, color: '#1E293B' }}>
                    {title || 'Untitled'}
                </Text>
            ),
            sorter: (a, b) => (a.title || '').localeCompare(b.title || ''),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 120,
            render: (status) => {
                const verified = ['Verified', 'Released', 'Approved'].includes(status);
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {verified ? (
                            <CheckCircleFilled style={{ color: '#22C55E', fontSize: 14 }} />
                        ) : (
                            <CloseCircleFilled style={{ color: '#EF4444', fontSize: 14 }} />
                        )}
                        <Text style={{ fontSize: 12, color: '#475569' }}>{status || 'Draft'}</Text>
                    </div>
                );
            },
            filters: [
                { text: 'Draft', value: 'Draft' },
                { text: 'Review', value: 'Review' },
                { text: 'Approved', value: 'Approved' },
                { text: 'Verified', value: 'Verified' },
                { text: 'Released', value: 'Released' },
            ],
            onFilter: (value, record) => record.status === value,
        },
        {
            title: 'Tags',
            dataIndex: 'tags',
            key: 'tags',
            width: 220,
            render: (tags) => {
                if (!tags || tags.length === 0) return null;
                return (
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {tags.slice(0, 3).map((tag, i) => (
                            <Tag
                                key={i}
                                color={TAG_COLORS[tag] || 'default'}
                                style={{ fontSize: 10, margin: 0, borderRadius: 4, padding: '0 6px', lineHeight: '18px' }}
                            >
                                {tag}
                            </Tag>
                        ))}
                        {tags.length > 3 && (
                            <Tag style={{ fontSize: 10, margin: 0, borderRadius: 4, padding: '0 6px', lineHeight: '18px' }}>
                                +{tags.length - 3}
                            </Tag>
                        )}
                    </div>
                );
            },
        },
        {
            title: 'Level',
            dataIndex: 'level',
            key: 'level',
            width: 100,
            render: (level) => (
                <Text style={{ fontSize: 12, color: '#64748B', textTransform: 'capitalize' }}>
                    {level || 'system'}
                </Text>
            ),
        },
        {
            title: 'Priority',
            dataIndex: 'priority',
            key: 'priority',
            width: 90,
            render: (priority) => {
                const colors = {
                    critical: '#EF4444',
                    high: '#F97316',
                    medium: '#EAB308',
                    low: '#22C55E',
                };
                return (
                    <Tag
                        color={colors[priority] || '#94A3B8'}
                        style={{ fontSize: 10, borderRadius: 4, textTransform: 'capitalize' }}
                    >
                        {priority || 'medium'}
                    </Tag>
                );
            },
            sorter: (a, b) => {
                const order = { critical: 0, high: 1, medium: 2, low: 3 };
                return (order[a.priority] ?? 2) - (order[b.priority] ?? 2);
            },
        },
        {
            title: 'V&V',
            key: 'vnv_status',
            width: 80,
            align: 'center',
            render: (_, record) => {
                const status = vnvStatusMap[record.id];
                if (!status) return <span style={{ color: '#CBD5E1', fontSize: 12 }}>-</span>;
                const allPassed = status.verified === status.total;
                const color = allPassed ? '#22C55E' : '#EF4444';
                return (
                    <Tooltip title={`${status.verified}/${status.total} rules verified`}>
                        <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600, color }}>
                            {status.verified}/{status.total}
                        </span>
                    </Tooltip>
                );
            },
        },
        {
            title: 'Assignee',
            dataIndex: 'assignee',
            key: 'assignee',
            width: 80,
            align: 'center',
            render: (assignee, record) => {
                if (!assignee) return null;
                return (
                    <Tooltip title={assignee}>
                        <Avatar
                            size={24}
                            style={{ backgroundColor: '#0EA5E9', fontSize: 10, fontWeight: 600 }}
                            src={record.assignee_avatar || undefined}
                        >
                            {assignee.charAt(0).toUpperCase()}
                        </Avatar>
                    </Tooltip>
                );
            },
        },
    ];

    return (
        <div style={{ flex: 1, overflow: 'auto', padding: '0 24px 24px', background: '#FAFBFC' }}>
            <Table
                columns={columns}
                dataSource={requirements}
                rowKey="id"
                size="small"
                loading={loading}
                pagination={{
                    pageSize: 50,
                    showSizeChanger: true,
                    showTotal: (total) => `${total} requirements`,
                    size: 'small',
                }}
                onRow={(record) => ({
                    onClick: () => onNodeSelect && onNodeSelect(record.id),
                    onDoubleClick: () => onNodeDoubleClick && onNodeDoubleClick(record.id),
                    style: {
                        cursor: 'pointer',
                        background: record.id === selectedNodeId ? '#F0F9FF' : undefined,
                    },
                })}
                style={{
                    borderRadius: 8,
                    overflow: 'hidden',
                }}
                scroll={{ y: 'calc(100vh - 260px)' }}
            />
        </div>
    );
};

export default FlowTableView;
