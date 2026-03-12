import React from 'react';
import { Table, Tag, Progress, Card, Row, Col, Typography } from 'antd';
import { CheckCircleFilled, CloseCircleFilled, WarningFilled } from '@ant-design/icons';

const { Title, Text } = Typography;

const CoveragePanel = () => {
    // Mock Data based on the "Coverage" image
    const data = [
        {
            key: '1',
            reqId: 'REQ_13_Statement_1',
            signals: ['In_Throttle', 'In_Speed', 'FSM_var', 'Out_Gear'],
            status: 'Pass',
            coverage: 100,
        },
        {
            key: '2',
            reqId: 'REQ_13_Decision_1',
            signals: ['In_Throttle', 'In_Speed'],
            status: 'Pass',
            coverage: 100,
        },
        {
            key: '3',
            reqId: 'REQ_13_DC_1',
            signals: ['In_Throttle', 'In_Speed', 'FSM_var', 'Out_Gear'],
            status: 'Pass',
            coverage: 100,
        },
        {
            key: '4',
            reqId: 'REQ_13_DC_2',
            signals: ['In_Throttle', 'In_Speed', 'FSM_var', 'Out_Gear'],
            status: 'Fail',
            coverage: 85,
        },
        {
            key: '5',
            reqId: 'REQ_13_DC_3',
            signals: ['In_Throttle', 'In_Speed'],
            status: 'Warning',
            coverage: 60,
        },
    ];

    const columns = [
        {
            title: 'Requirement ID',
            dataIndex: 'reqId',
            key: 'reqId',
            render: (text) => <Text strong style={{ color: '#ccc' }}>{text}</Text>,
        },
        {
            title: 'Signals',
            dataIndex: 'signals',
            key: 'signals',
            render: (signals) => (
                <>
                    {signals.map((signal) => (
                        <Tag color="blue" key={signal} style={{ marginRight: 4, marginBottom: 4 }}>
                            {signal}
                        </Tag>
                    ))}
                </>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                let color = 'default';
                let icon = null;
                if (status === 'Pass') {
                    color = 'success';
                    icon = <CheckCircleFilled />;
                } else if (status === 'Fail') {
                    color = 'error';
                    icon = <CloseCircleFilled />;
                } else if (status === 'Warning') {
                    color = 'warning';
                    icon = <WarningFilled />;
                }
                return (
                    <Tag icon={icon} color={color}>
                        {status.toUpperCase()}
                    </Tag>
                );
            },
        },
        {
            title: 'Coverage',
            dataIndex: 'coverage',
            key: 'coverage',
            render: (percent) => (
                <Progress percent={percent} size="small" status={percent === 100 ? 'success' : percent < 80 ? 'exception' : 'active'} />
            ),
        },
    ];

    return (
        <div style={{ padding: 24, height: '100%', overflowY: 'auto', background: '#1c1c1c' }}>
            <Title level={3} style={{ color: 'white', marginBottom: 24 }}>Coverage Dashboard</Title>

            <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col span={8}>
                    <Card bordered={false} style={{ background: '#2a2a2a' }}>
                        <Title level={5} style={{ color: '#aaa', marginTop: 0 }}>Decision Condition</Title>
                        <Progress type="dashboard" percent={100} format={() => <span style={{ color: '#52c41a' }}>100%</span>} width={80} />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card bordered={false} style={{ background: '#2a2a2a' }}>
                        <Title level={5} style={{ color: '#aaa', marginTop: 0 }}>Statement</Title>
                        <Progress type="dashboard" percent={92} format={() => <span style={{ color: '#1890ff' }}>92%</span>} width={80} />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card bordered={false} style={{ background: '#2a2a2a' }}>
                        <Title level={5} style={{ color: '#aaa', marginTop: 0 }}>MCDC</Title>
                        <Progress type="dashboard" percent={85} format={() => <span style={{ color: '#faad14' }}>85%</span>} width={80} />
                    </Card>
                </Col>
            </Row>

            <Table
                columns={columns}
                dataSource={data}
                pagination={false}
                style={{ background: '#1c1c1c' }}
                rowClassName={() => 'dark-row'}
            />
        </div>
    );
};

export default CoveragePanel;
