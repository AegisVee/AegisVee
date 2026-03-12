import React from 'react';
import { Button, Input, Select, Segmented, Space, Badge, Dropdown, Typography, theme } from 'antd';
import {
    PlusOutlined,
    SearchOutlined,
    FilterOutlined,
    SortAscendingOutlined,
    AppstoreOutlined,
    TableOutlined,
    ApartmentOutlined,
    DownOutlined,
} from '@ant-design/icons';

const { Text, Title } = Typography;

/**
 * Flow-style top toolbar for Engineering OS.
 * Shows: title, "+ New Requirement", search, display, sort, filters, Table|Tree toggle.
 */
const FlowToolbar = ({
    totalCount = 0,
    viewMode = 'tree',
    onViewModeChange,
    onCreateRequirement,
    searchText = '',
    onSearchChange,
    sortBy = 'id',
    onSortChange,
    onFilterClick,
}) => {
    const { token } = theme.useToken();

    const sortOptions = [
        { value: 'id', label: 'Sort by: ID' },
        { value: 'title', label: 'Sort by: Title' },
        { value: 'status', label: 'Sort by: Status' },
        { value: 'priority', label: 'Sort by: Priority' },
        { value: 'updated', label: 'Sort by: Updated' },
    ];

    return (
        <div
            style={{
                padding: '16px 24px 12px',
                background: '#FFFFFF',
                borderBottom: '1px solid #E2E8F0',
            }}
        >
            {/* Top Row: Title + Actions */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 12,
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Title level={4} style={{ margin: 0, color: '#0F172A', fontWeight: 700 }}>
                        All Requirements
                    </Title>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {/* + New Requirement button (prominent, like Flow's purple button) */}
                    <Dropdown
                        menu={{
                            items: [
                                { key: 'requirement', label: 'Requirement', icon: <PlusOutlined /> },
                            ],
                            onClick: ({ key }) => {
                                if (key === 'requirement' && onCreateRequirement) {
                                    onCreateRequirement();
                                }
                            },
                        }}
                        trigger={['click']}
                    >
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            style={{
                                background: '#0EA5E9',
                                borderColor: '#0EA5E9',
                                fontWeight: 600,
                                borderRadius: 6,
                                height: 36,
                            }}
                        >
                            New Requirement
                            <DownOutlined style={{ fontSize: 10, marginLeft: 4 }} />
                        </Button>
                    </Dropdown>
                </div>
            </div>

            {/* Bottom Row: View Toggle + Search + Sort + Filters */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                {/* Left: View Toggle */}
                <Segmented
                    value={viewMode}
                    onChange={onViewModeChange}
                    options={[
                        {
                            label: (
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0 4px' }}>
                                    <TableOutlined style={{ fontSize: 13 }} />
                                    Table
                                </span>
                            ),
                            value: 'table',
                        },
                        {
                            label: (
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0 4px' }}>
                                    <ApartmentOutlined style={{ fontSize: 13 }} />
                                    Tree
                                </span>
                            ),
                            value: 'tree',
                        },
                    ]}
                    style={{ borderRadius: 6 }}
                />

                {/* Right: Search + Sort + Filters */}
                <Space size={8}>
                    <Input
                        prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
                        placeholder="Search..."
                        value={searchText}
                        onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                        style={{
                            width: 200,
                            borderRadius: 6,
                        }}
                        allowClear
                        size="middle"
                    />

                    <Dropdown
                        menu={{
                            items: [
                                { key: 'default', label: 'Default' },
                                { key: 'compact', label: 'Compact' },
                                { key: 'expanded', label: 'Expanded' },
                            ],
                        }}
                        trigger={['click']}
                    >
                        <Button icon={<AppstoreOutlined />} style={{ borderRadius: 6 }}>
                            Display
                        </Button>
                    </Dropdown>

                    <Select
                        value={sortBy}
                        onChange={onSortChange}
                        options={sortOptions}
                        style={{ width: 160, borderRadius: 6 }}
                        size="middle"
                    />

                    <Button
                        icon={<FilterOutlined />}
                        onClick={onFilterClick}
                        style={{ borderRadius: 6 }}
                    >
                        Filters
                    </Button>
                </Space>
            </div>
        </div>
    );
};

export default FlowToolbar;
