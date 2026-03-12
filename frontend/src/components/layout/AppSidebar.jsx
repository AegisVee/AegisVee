import React, { useState } from 'react';
import { Layout, Menu, Tooltip, Button, Typography, theme } from 'antd';
import {
    SettingOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    AppstoreOutlined,
    ApartmentOutlined,
    DatabaseOutlined,
    CodeOutlined,
    ReadOutlined,
    RobotOutlined,
    ApiOutlined,
} from '@ant-design/icons';

const { Sider } = Layout;
const { Text } = Typography;

/**
 * v3.0 AppSidebar — Flow-style wider sidebar with labels.
 * Collapsible between 220px (expanded) and 60px (icon-only).
 * No edition filtering — all features always visible.
 */
const AppSidebar = ({
    selectedKey,
    setSelectedKey,
    setIsSettingsVisible,
    onMenuClick,
    collapsed: externalCollapsed,
    onCollapsedChange,
}) => {
    const { token } = theme.useToken();
    const [internalCollapsed, setInternalCollapsed] = useState(false);
    const collapsed = externalCollapsed ?? internalCollapsed;
    const setCollapsed = onCollapsedChange ?? setInternalCollapsed;

    const menuItems = [
        {
            key: 'dashboard',
            icon: <AppstoreOutlined />,
            label: 'Home',
        },
        {
            key: 'engineering-os',
            icon: <ApartmentOutlined />,
            label: 'Engineering OS',
        },
        { type: 'divider' },
        {
            key: 'requirements',
            icon: <DatabaseOutlined />,
            label: 'Requirements',
        },
        {
            key: 'validation',
            icon: <CodeOutlined />,
            label: 'V-Model',
        },
        {
            key: 'knowledge',
            icon: <ReadOutlined />,
            label: 'Knowledge Base',
        },
        { type: 'divider' },
        {
            key: 'ai-settings',
            icon: <RobotOutlined />,
            label: 'AI Settings',
        },
        {
            key: 'plugins',
            icon: <ApiOutlined />,
            label: 'Plugins',
        },
    ];

    return (
        <Sider
            width={220}
            collapsedWidth={60}
            collapsible
            collapsed={collapsed}
            trigger={null}
            style={{
                background: token.colorBgContainer,
                borderRight: `1px solid ${token.colorBorderSecondary}`,
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                overflow: 'hidden',
            }}
        >
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Logo area */}
                <div
                    style={{
                        padding: collapsed ? '16px 12px' : '16px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        cursor: 'pointer',
                        borderBottom: `1px solid ${token.colorBorderSecondary}`,
                    }}
                    onClick={() => {
                        setSelectedKey('dashboard');
                        if (onMenuClick) onMenuClick({ key: 'dashboard' });
                    }}
                >
                    <img
                        src="/aegisvee.svg"
                        alt="AegisVee"
                        style={{ width: 26, height: 26, flexShrink: 0 }}
                    />
                    {!collapsed && (
                        <Text
                            strong
                            style={{
                                fontSize: 16,
                                color: '#0EA5E9',
                                fontWeight: 700,
                                letterSpacing: '-0.02em',
                            }}
                        >
                            AegisVee
                        </Text>
                    )}
                </div>

                {/* Navigation menu */}
                <Menu
                    mode="inline"
                    selectedKeys={[selectedKey]}
                    onClick={(e) => {
                        setSelectedKey(e.key);
                        if (onMenuClick) onMenuClick(e);
                    }}
                    items={menuItems}
                    style={{
                        border: 'none',
                        flex: 1,
                        padding: '8px 0',
                        fontSize: 13,
                    }}
                    inlineIndent={collapsed ? 16 : 20}
                />
            </div>

            {/* Bottom controls */}
            <div
                style={{
                    padding: '8px',
                    borderTop: `1px solid ${token.colorBorderSecondary}`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                }}
            >
                <Tooltip title="Settings" placement="right">
                    <Button
                        type="text"
                        icon={<SettingOutlined style={{ fontSize: 16, color: token.colorTextSecondary }} />}
                        onClick={() => setIsSettingsVisible(true)}
                        style={{ width: collapsed ? 40 : '100%' }}
                    >
                        {!collapsed && <span style={{ fontSize: 13, color: token.colorTextSecondary }}>Settings</span>}
                    </Button>
                </Tooltip>
                <Button
                    type="text"
                    icon={
                        collapsed ? (
                            <MenuUnfoldOutlined style={{ fontSize: 14, color: token.colorTextSecondary }} />
                        ) : (
                            <MenuFoldOutlined style={{ fontSize: 14, color: token.colorTextSecondary }} />
                        )
                    }
                    onClick={() => setCollapsed(!collapsed)}
                    style={{ width: collapsed ? 40 : '100%' }}
                >
                    {!collapsed && <span style={{ fontSize: 12, color: token.colorTextTertiary }}>Collapse</span>}
                </Button>
            </div>
        </Sider>
    );
};

export default AppSidebar;
