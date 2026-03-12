import React from 'react';
import { Layout, Typography, Input, Tooltip, Button, Space, Popover, Avatar, theme } from 'antd';
import { SearchOutlined, QuestionCircleOutlined, BellOutlined, RobotOutlined, ConsoleSqlOutlined } from '@ant-design/icons';

import AiStatusBadge from '../common/AiStatusBadge';

const { Header } = Layout;
const { Text } = Typography;

/**
 * v3.0 AppHeader — Simplified top bar.
 * Only shown for non-Engineering-OS views (Engineering OS has its own toolbar).
 */
const AppHeader = ({
    isSearchVisible,
    setIsSearchVisible,
    setIsHelpVisible,
    setIsNotifVisible,
    onConsoleToggle,
    onChatToggle
}) => {
    const { token } = theme.useToken();

    return (
        <Header
            style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0 20px',
                borderBottom: `1px solid ${token.colorBorderSecondary}`,
                height: 48,
                background: token.colorBgContainer,
            }}
        >
            <div style={{ flexGrow: 1 }} />

            <Space size={4}>
                <Space.Compact style={{ width: 260, marginRight: 8 }}>
                    <Input
                        prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
                        placeholder="Search... (Cmd+K)"
                        variant="filled"
                        onClick={() => setIsSearchVisible(true)}
                        size="small"
                        style={{ borderRadius: 6 }}
                    />
                </Space.Compact>

                <Tooltip title="Help">
                    <Button type="text" size="small" icon={<QuestionCircleOutlined style={{ fontSize: 15 }} />} onClick={() => setIsHelpVisible(true)} />
                </Tooltip>
                <Tooltip title="Notifications">
                    <Button type="text" size="small" icon={<BellOutlined style={{ fontSize: 15 }} />} onClick={() => setIsNotifVisible(true)} />
                </Tooltip>
                <Tooltip title="Console">
                    <Button type="text" size="small" icon={<ConsoleSqlOutlined style={{ fontSize: 15 }} />} onClick={onConsoleToggle} />
                </Tooltip>
                <AiStatusBadge />
                <Tooltip title="AI Assistant">
                    <Button type="text" size="small" icon={<RobotOutlined style={{ color: '#0EA5E9', fontSize: 15 }} />} onClick={onChatToggle} />
                </Tooltip>

                <Popover
                    content={
                        <div style={{ width: 220 }}>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                                <Avatar size={36} style={{ backgroundColor: '#0EA5E9', marginRight: 12, fontWeight: 600 }}>A</Avatar>
                                <div>
                                    <Text strong style={{ display: 'block', fontSize: 14 }}>Alex Chen</Text>
                                    <Text type="secondary" style={{ fontSize: 12 }}>Lead Engineer</Text>
                                </div>
                            </div>
                            <div style={{ borderTop: `1px solid ${token.colorBorderSecondary}`, paddingTop: 8 }}>
                                <Text style={{ fontSize: 12 }}>alex.chen@aegisvee.com</Text>
                            </div>
                        </div>
                    }
                    trigger="click"
                    placement="bottomRight"
                >
                    <Avatar style={{ backgroundColor: '#0EA5E9', marginLeft: 8, cursor: 'pointer', fontWeight: 600 }} size={28}>A</Avatar>
                </Popover>
            </Space>
        </Header>
    );
};

export default AppHeader;
