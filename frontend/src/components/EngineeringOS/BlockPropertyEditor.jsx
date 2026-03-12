import React, { useCallback } from 'react';
import { Table, Input, InputNumber, Button, Popconfirm, Tag } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';

/**
 * BlockPropertyEditor — Inline table editor for block properties (Valispace-style).
 * Renders a compact editable table with formula, value, unit, margin, and worst-case columns.
 */
const BlockPropertyEditor = ({ properties = [], onChange, readOnly = false }) => {

    const generateId = () => `prop-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const handleFieldChange = useCallback((id, field, val) => {
        const updated = properties.map(p => {
            if (p.id !== id) return p;
            const next = { ...p, [field]: val };
            // Auto-calculate worst_case when value or margin_percent change
            const value = field === 'value' ? val : next.value;
            const margin = field === 'margin_percent' ? val : next.margin_percent;
            if (value != null && margin != null) {
                next.worst_case = parseFloat((value * (1 + margin / 100)).toFixed(6));
            }
            return next;
        });
        onChange(updated);
    }, [properties, onChange]);

    const handleAdd = useCallback(() => {
        const newProp = {
            id: generateId(),
            name: '',
            formula: '',
            value: 0,
            unit: '',
            margin_percent: 0,
            worst_case: 0,
            tags: [],
        };
        onChange([...properties, newProp]);
    }, [properties, onChange]);

    const handleDelete = useCallback((id) => {
        onChange(properties.filter(p => p.id !== id));
    }, [properties, onChange]);

    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            width: 150,
            render: (text, record) => readOnly ? (
                <span style={{ color: '#e5e7eb' }}>{text || '—'}</span>
            ) : (
                <Input
                    size="small"
                    value={text}
                    placeholder="Property name"
                    onChange={e => handleFieldChange(record.id, 'name', e.target.value)}
                    style={{ background: '#1f2937', borderColor: '#374151', color: '#e5e7eb' }}
                />
            ),
        },
        {
            title: 'Formula',
            dataIndex: 'formula',
            width: 140,
            render: (text, record) => readOnly ? (
                <code style={{ color: '#93c5fd', fontSize: 12 }}>{text || '—'}</code>
            ) : (
                <Input
                    size="small"
                    value={text}
                    placeholder="e.g. A * B"
                    onChange={e => handleFieldChange(record.id, 'formula', e.target.value)}
                    style={{ background: '#1f2937', borderColor: '#374151', color: '#93c5fd', fontFamily: 'monospace', fontSize: 12 }}
                />
            ),
        },
        {
            title: 'Value',
            dataIndex: 'value',
            width: 100,
            render: (val, record) => readOnly ? (
                <span style={{ color: '#e5e7eb' }}>{val ?? '—'}</span>
            ) : (
                <InputNumber
                    size="small"
                    value={val}
                    onChange={v => handleFieldChange(record.id, 'value', v)}
                    style={{ width: '100%', background: '#1f2937', borderColor: '#374151', color: '#e5e7eb' }}
                />
            ),
        },
        {
            title: 'Unit',
            dataIndex: 'unit',
            width: 80,
            render: (text, record) => readOnly ? (
                <span style={{ color: '#9ca3af' }}>{text || '—'}</span>
            ) : (
                <Input
                    size="small"
                    value={text}
                    placeholder="e.g. V"
                    onChange={e => handleFieldChange(record.id, 'unit', e.target.value)}
                    style={{ width: '100%', background: '#1f2937', borderColor: '#374151', color: '#e5e7eb' }}
                />
            ),
        },
        {
            title: 'Margin%',
            dataIndex: 'margin_percent',
            width: 90,
            render: (val, record) => readOnly ? (
                <span style={{ color: '#e5e7eb' }}>{val ?? 0}%</span>
            ) : (
                <InputNumber
                    size="small"
                    value={val}
                    min={0}
                    max={100}
                    formatter={v => `${v}%`}
                    parser={v => v.replace('%', '')}
                    onChange={v => handleFieldChange(record.id, 'margin_percent', v)}
                    style={{ width: '100%', background: '#1f2937', borderColor: '#374151', color: '#e5e7eb' }}
                />
            ),
        },
        {
            title: 'Worst Case',
            dataIndex: 'worst_case',
            width: 100,
            render: (val) => (
                <Tag color="orange" style={{ fontFamily: 'monospace' }}>
                    {val != null ? parseFloat(val.toFixed(4)) : '—'}
                </Tag>
            ),
        },
        ...(!readOnly ? [{
            title: '',
            width: 40,
            render: (_, record) => (
                <Popconfirm
                    title="Delete this property?"
                    onConfirm={() => handleDelete(record.id)}
                    okText="Yes"
                    cancelText="No"
                >
                    <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                    />
                </Popconfirm>
            ),
        }] : []),
    ];

    return (
        <div>
            {!readOnly && (
                <div style={{ marginBottom: 8 }}>
                    <Button
                        type="dashed"
                        size="small"
                        icon={<PlusOutlined />}
                        onClick={handleAdd}
                        style={{ borderColor: '#0EA5E9', color: '#0EA5E9' }}
                    >
                        Add Property
                    </Button>
                </div>
            )}
            <Table
                dataSource={properties}
                columns={columns}
                rowKey="id"
                size="small"
                pagination={false}
                locale={{ emptyText: 'No properties defined' }}
                style={{ background: 'transparent' }}
                className="block-property-table"
            />
            <style>{`
                .block-property-table .ant-table {
                    background: transparent !important;
                }
                .block-property-table .ant-table-thead > tr > th {
                    background: #111827 !important;
                    color: #9ca3af !important;
                    border-bottom: 1px solid #374151 !important;
                    font-size: 12px;
                    padding: 6px 8px !important;
                }
                .block-property-table .ant-table-tbody > tr > td {
                    background: #1a2332 !important;
                    border-bottom: 1px solid #1f2937 !important;
                    padding: 4px 8px !important;
                }
                .block-property-table .ant-table-tbody > tr:hover > td {
                    background: #1f2937 !important;
                }
                .block-property-table .ant-empty-description {
                    color: #6b7280;
                }
            `}</style>
        </div>
    );
};

export default BlockPropertyEditor;
