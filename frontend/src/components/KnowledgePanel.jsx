import React, { useState, useEffect } from 'react';
import { Card, List, Tag, Button, Upload, Typography, Space, Tooltip } from 'antd';
import { CloudUploadOutlined, FileTextOutlined, CheckCircleOutlined, SyncOutlined, DesktopOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { api } from '../services/api';

const { Text, Title } = Typography;

const KnowledgePanel = () => {
    const [hwInfo, setHwInfo] = useState(null);
    const [documents, setDocuments] = useState([
        { id: 1, name: 'System_Architecture.pdf', status: 'indexed', size: '2.4 MB' },
        { id: 2, name: 'API_Reference.md', status: 'pending', size: '120 KB' },
        { id: 3, name: 'User_Guide.docx', status: 'processing', size: '1.1 MB' },
    ]);

    useEffect(() => {
        const fetchHardware = async () => {
            try {
                const info = await api.getHardwareInfo();
                setHwInfo(info);
            } catch (err) {
                console.error("Failed to load hardware info", err);
            }
        };
        fetchHardware();
    }, []);

    const gpuStatus = hwInfo?.gpu_cuda_available ? (
        <Tooltip title={`GPU: ${hwInfo.gpu_name} (${hwInfo.gpu_vram_gb}GB VRAM)`}>
            <Tag color="success" icon={<ThunderboltOutlined />}>GPU Accelerated</Tag>
        </Tooltip>
    ) : (
        <Tooltip title={hwInfo ? `CPU: ${hwInfo.cpu_name}` : 'Checking hardware...'}>
            <Tag color="warning" icon={<DesktopOutlined />}>CPU Only</Tag>
        </Tooltip>
    );

    return (
        <div style={{ padding: '24px', height: '100%', overflowY: 'auto' }}>
            <Card
                title={
                    <Space size="large">
                        <Title level={4} style={{ margin: 0 }}>Knowledge Base</Title>
                        {gpuStatus}
                    </Space>
                }
                extra={
                    <Upload>
                        <Button icon={<CloudUploadOutlined />}>Upload Document</Button>
                    </Upload>
                }
                style={{ height: '100%' }}
            >
                <List
                    itemLayout="horizontal"
                    dataSource={documents}
                    renderItem={item => (
                        <List.Item
                            actions={[
                                item.status === 'indexed' ? (
                                    <Tag color="success" icon={<CheckCircleOutlined />}>Indexed</Tag>
                                ) : item.status === 'processing' ? (
                                    <Tag color="processing" icon={<SyncOutlined spin />}>Processing</Tag>
                                ) : (
                                    <Tag color="warning" icon={<CloudUploadOutlined />}>Pending</Tag>
                                )
                            ]}
                        >
                            <List.Item.Meta
                                avatar={<FileTextOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
                                title={<Text strong>{item.name}</Text>}
                                description={`Size: ${item.size}`}
                            />
                        </List.Item>
                    )}
                />
            </Card>
        </div>
    );
};

export default KnowledgePanel;
