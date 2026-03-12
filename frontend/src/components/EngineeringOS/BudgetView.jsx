import React, { useState, useEffect, useMemo } from 'react';
import { Table, Card, Typography, Tag, Spin, Empty, Segmented } from 'antd';
import { PieChartOutlined, TableOutlined } from '@ant-design/icons';
import { api } from '../../services/api';

const { Title, Text } = Typography;

/**
 * BudgetView — Valispace-style budget breakdown.
 *
 * For each root block with soc() formulas, shows:
 * - A table of child contributions (name, value, unit, margin%, worst_case)
 * - A simple SVG pie chart showing percentage breakdown
 */
const BudgetView = ({ projectId }) => {
    const [blocks, setBlocks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedBudget, setSelectedBudget] = useState(null);

    useEffect(() => {
        if (!projectId) return;
        setLoading(true);
        api.getBlocks(projectId)
            .then((data) => {
                setBlocks(Array.isArray(data) ? data : []);
            })
            .catch((e) => console.error('Failed to load blocks:', e))
            .finally(() => setLoading(false));
    }, [projectId]);

    // Build hierarchy: find blocks that have soc() properties (budget roots)
    const budgets = useMemo(() => {
        const childrenMap = {};
        blocks.forEach((b) => {
            const pid = b.parent_id;
            if (pid) {
                if (!childrenMap[pid]) childrenMap[pid] = [];
                childrenMap[pid].push(b);
            }
        });

        const result = [];
        blocks.forEach((block) => {
            const children = childrenMap[block.id] || [];
            (block.properties || []).forEach((prop) => {
                if (prop.formula && /soc\(/i.test(prop.formula)) {
                    // Extract property name from soc(PropName)
                    const match = prop.formula.match(/soc\(\s*(\w+)\s*\)/i);
                    const socPropName = match ? match[1] : prop.name;

                    // Gather child contributions
                    const contributions = children
                        .map((child) => {
                            const childProp = (child.properties || []).find(
                                (p) => p.name === socPropName
                            );
                            return childProp
                                ? {
                                      key: child.id,
                                      blockId: child.id,
                                      blockName: child.name,
                                      value: childProp.value || 0,
                                      unit: childProp.unit || prop.unit || '',
                                      margin_percent: childProp.margin_percent || 0,
                                      worst_case: childProp.worst_case || 0,
                                  }
                                : null;
                        })
                        .filter(Boolean);

                    const total = contributions.reduce((sum, c) => sum + c.value, 0);

                    result.push({
                        key: `${block.id}-${prop.name}`,
                        blockId: block.id,
                        blockName: block.name,
                        propertyName: prop.name,
                        unit: prop.unit || '',
                        total: prop.value || total,
                        worstCase: prop.worst_case || 0,
                        marginPercent: prop.margin_percent || 0,
                        contributions,
                    });
                }
            });
        });

        return result;
    }, [blocks]);

    // Auto-select first budget
    useEffect(() => {
        if (budgets.length > 0 && !selectedBudget) {
            setSelectedBudget(budgets[0].key);
        }
    }, [budgets, selectedBudget]);

    const activeBudget = budgets.find((b) => b.key === selectedBudget);

    const columns = [
        {
            title: 'Block',
            dataIndex: 'blockName',
            key: 'blockName',
            render: (name) => <Text strong>{name}</Text>,
        },
        {
            title: 'Value',
            dataIndex: 'value',
            key: 'value',
            width: 120,
            align: 'right',
            render: (val, record) => (
                <Text style={{ fontFamily: 'monospace' }}>
                    {val.toFixed(2)} {record.unit}
                </Text>
            ),
            sorter: (a, b) => a.value - b.value,
        },
        {
            title: '%',
            key: 'percent',
            width: 80,
            align: 'right',
            render: (_, record) => {
                const pct =
                    activeBudget && activeBudget.total > 0
                        ? ((record.value / activeBudget.total) * 100).toFixed(1)
                        : '0.0';
                return <Text style={{ fontFamily: 'monospace' }}>{pct}%</Text>;
            },
        },
        {
            title: 'Margin %',
            dataIndex: 'margin_percent',
            key: 'margin_percent',
            width: 100,
            align: 'right',
            render: (val) => (
                <Text style={{ fontFamily: 'monospace', color: val > 0 ? '#F59E0B' : '#94A3B8' }}>
                    {val > 0 ? `+${val}%` : '-'}
                </Text>
            ),
        },
        {
            title: 'Worst Case',
            dataIndex: 'worst_case',
            key: 'worst_case',
            width: 120,
            align: 'right',
            render: (val, record) => (
                <Text style={{ fontFamily: 'monospace', color: '#EF4444' }}>
                    {val > 0 ? `${val.toFixed(2)} ${record.unit}` : '-'}
                </Text>
            ),
        },
    ];

    // Simple SVG pie chart
    const renderPieChart = (budget) => {
        if (!budget || budget.contributions.length === 0) return null;

        const total = budget.total || 1;
        const colors = [
            '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
            '#EC4899', '#06B6D4', '#F97316', '#84CC16', '#6366F1',
        ];

        let cumAngle = 0;
        const slices = budget.contributions.map((c, i) => {
            const pct = c.value / total;
            const startAngle = cumAngle;
            const endAngle = cumAngle + pct * 360;
            cumAngle = endAngle;

            const startRad = ((startAngle - 90) * Math.PI) / 180;
            const endRad = ((endAngle - 90) * Math.PI) / 180;
            const largeArc = endAngle - startAngle > 180 ? 1 : 0;

            const x1 = 100 + 80 * Math.cos(startRad);
            const y1 = 100 + 80 * Math.sin(startRad);
            const x2 = 100 + 80 * Math.cos(endRad);
            const y2 = 100 + 80 * Math.sin(endRad);

            const d =
                pct >= 0.9999
                    ? `M 100 20 A 80 80 0 1 1 99.99 20 Z`
                    : `M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`;

            return (
                <path
                    key={c.blockId}
                    d={d}
                    fill={colors[i % colors.length]}
                    stroke="#fff"
                    strokeWidth="1"
                />
            );
        });

        return (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <svg width="200" height="200" viewBox="0 0 200 200">
                    {slices}
                </svg>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingTop: 8 }}>
                    {budget.contributions.map((c, i) => (
                        <div key={c.blockId} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div
                                style={{
                                    width: 10,
                                    height: 10,
                                    borderRadius: 2,
                                    backgroundColor: colors[i % colors.length],
                                    flexShrink: 0,
                                }}
                            />
                            <Text style={{ fontSize: 12 }}>
                                {c.blockName} ({((c.value / total) * 100).toFixed(1)}%)
                            </Text>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (budgets.length === 0) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Empty
                    description={
                        <span>
                            No budget properties found.
                            <br />
                            Add <code>soc(PropertyName)</code> formulas to parent blocks.
                        </span>
                    }
                />
            </div>
        );
    }

    return (
        <div style={{ padding: 24, overflow: 'auto', height: '100%', background: '#FAFBFC' }}>
            {/* Budget selector */}
            {budgets.length > 1 && (
                <Segmented
                    options={budgets.map((b) => ({
                        label: `${b.blockName} / ${b.propertyName}`,
                        value: b.key,
                    }))}
                    value={selectedBudget}
                    onChange={setSelectedBudget}
                    style={{ marginBottom: 16 }}
                />
            )}

            {activeBudget && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Summary card */}
                    <Card size="small">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <Title level={5} style={{ margin: 0 }}>
                                    {activeBudget.blockName} — {activeBudget.propertyName} Budget
                                </Title>
                                <Text type="secondary">
                                    {activeBudget.contributions.length} contributors
                                </Text>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <Text style={{ fontSize: 24, fontFamily: 'monospace', fontWeight: 700 }}>
                                    {activeBudget.total.toFixed(2)}
                                </Text>
                                <Text type="secondary" style={{ marginLeft: 4 }}>
                                    {activeBudget.unit}
                                </Text>
                                {activeBudget.worstCase > 0 && (
                                    <div>
                                        <Text style={{ fontSize: 12, color: '#EF4444', fontFamily: 'monospace' }}>
                                            Worst case: {activeBudget.worstCase.toFixed(2)} {activeBudget.unit}
                                        </Text>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* Chart */}
                    <Card size="small" title="Breakdown">
                        {renderPieChart(activeBudget)}
                    </Card>

                    {/* Table */}
                    <Card size="small" title="Contributions">
                        <Table
                            columns={columns}
                            dataSource={activeBudget.contributions}
                            rowKey="key"
                            size="small"
                            pagination={false}
                            summary={() => (
                                <Table.Summary.Row>
                                    <Table.Summary.Cell index={0}>
                                        <Text strong>Total</Text>
                                    </Table.Summary.Cell>
                                    <Table.Summary.Cell index={1} align="right">
                                        <Text strong style={{ fontFamily: 'monospace' }}>
                                            {activeBudget.total.toFixed(2)} {activeBudget.unit}
                                        </Text>
                                    </Table.Summary.Cell>
                                    <Table.Summary.Cell index={2} align="right">
                                        <Text strong style={{ fontFamily: 'monospace' }}>100%</Text>
                                    </Table.Summary.Cell>
                                    <Table.Summary.Cell index={3} />
                                    <Table.Summary.Cell index={4} align="right">
                                        {activeBudget.worstCase > 0 && (
                                            <Text strong style={{ fontFamily: 'monospace', color: '#EF4444' }}>
                                                {activeBudget.worstCase.toFixed(2)} {activeBudget.unit}
                                            </Text>
                                        )}
                                    </Table.Summary.Cell>
                                </Table.Summary.Row>
                            )}
                        />
                    </Card>
                </div>
            )}
        </div>
    );
};

export default BudgetView;
