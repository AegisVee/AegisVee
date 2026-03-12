import React, { useState } from 'react';
import { Form, Input, Button, Checkbox, Typography, Card, ConfigProvider, theme } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const Login = ({ onLogin }) => {
    const [loading, setLoading] = useState(false);

    const onFinish = (values) => {
        setLoading(true);
        // Mock authentication delay
        setTimeout(() => {
            setLoading(false);
            onLogin(values.username);
        }, 1000);
    };

    return (
        <ConfigProvider
            theme={{
                algorithm: theme.darkAlgorithm,
                token: {
                    colorPrimary: '#00b96b',
                    colorBgContainer: '#1c1c1c',
                },
            }}
        >
            <div style={{
                height: '100vh',
                width: '100vw',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                background: 'var(--bg-app)',
                backgroundImage: 'radial-gradient(var(--border-subtle) 1px, transparent 1px)',
                backgroundSize: '20px 20px'
            }}>
                <Card
                    style={{ width: 400, background: 'var(--bg-panel)', borderColor: 'var(--border-focus)', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}
                    bordered={false}
                >
                    <div style={{ textAlign: 'center', marginBottom: 32 }}>
                        <Title level={2} style={{ color: 'var(--brand-primary)', marginBottom: 8 }}>AegisVee</Title>
                        <Text type="secondary">AI-Powered Compliance & Validation</Text>
                    </div>

                    <Form
                        name="login"
                        initialValues={{ remember: true }}
                        onFinish={onFinish}
                        layout="vertical"
                        size="large"
                    >
                        <Form.Item
                            name="username"
                            rules={[{ required: true, message: 'Please input your Username!' }]}
                        >
                            <Input prefix={<UserOutlined />} placeholder="Username" />
                        </Form.Item>

                        <Form.Item
                            name="password"
                            rules={[{ required: true, message: 'Please input your Password!' }]}
                        >
                            <Input.Password prefix={<LockOutlined />} placeholder="Password" />
                        </Form.Item>

                        <Form.Item>
                            <Form.Item name="remember" valuePropName="checked" noStyle>
                                <Checkbox>Remember me</Checkbox>
                            </Form.Item>
                            <a style={{ float: 'right', color: 'var(--brand-primary)' }} href="">
                                Forgot password?
                            </a>
                        </Form.Item>

                        <Form.Item>
                            <Button type="primary" htmlType="submit" block loading={loading} style={{ background: 'var(--brand-primary)', borderColor: 'var(--brand-primary)' }}>
                                Log in
                            </Button>
                        </Form.Item>

                        <div style={{ textAlign: 'center' }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>v0.1.0 MVP Build</Text>
                        </div>
                    </Form>
                </Card>
            </div>
        </ConfigProvider>
    );
};

export default Login;
