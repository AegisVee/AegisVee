import React, { useState } from 'react';
import { Typography, Card, Upload, Button, App } from 'antd';
import { UploadOutlined, FilePdfOutlined, ThunderboltOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;

const TrainingDocBlock = () => {
    const { message } = App.useApp();
    const [isTraining, setIsTraining] = useState(false);

    const handleStartTraining = async () => {
        setIsTraining(true);
        try {
            // Call backend API to start training
            const response = await axios.post('http://localhost:8000/api/train');
            if (response.status === 200) {
                message.success('Training started! The model is learning from new documents.');
            } else {
                message.error('Failed to start training.');
            }
        } catch (error) {
            console.error("Training error:", error);
            message.error('Error starting training. Is the backend running?');
        } finally {
            // In a real app, we might poll for status, but here we just reset after a short delay
            // or keep it loading until we get a callback. 
            // Since the backend returns immediately saying "started", we can stop loading.
            setIsTraining(false);
        }
    };

    return (
        <Card
            title={<Title level={5} style={{ margin: 0 }}>Training Documents</Title>}
            bordered={false}
            style={{ height: '100%', background: '#1c1c1c' }}
            headStyle={{ borderBottom: '1px solid #303030' }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', padding: '8px', background: '#121212', borderRadius: '4px' }}>
                    <FilePdfOutlined style={{ fontSize: '24px', color: '#ff4d4f', marginRight: '12px' }} />
                    <div style={{ flex: 1 }}>
                        <Text strong style={{ display: 'block' }}>ACC_Test_Procedure_v1.2.pdf</Text>
                        <Text type="secondary" style={{ fontSize: '12px' }}>Updated 2 days ago</Text>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                    <Upload style={{ flex: 1 }} beforeUpload={() => false}>
                        <Button icon={<UploadOutlined />} block>Upload</Button>
                    </Upload>
                    <Button
                        type="primary"
                        danger
                        icon={<ThunderboltOutlined />}
                        onClick={handleStartTraining}
                        loading={isTraining}
                        style={{ flex: 1 }}
                    >
                        Start Training
                    </Button>
                </div>
            </div>
        </Card>
    );
};

export default TrainingDocBlock;
