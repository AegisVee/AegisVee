import React from 'react';
import { Steps, Typography, Card } from 'antd';

const { Title } = Typography;

const TestStepsBlock = () => {
    const items = [
        {
            title: 'Step 1',
            description: 'Initialize HIL environment and connect to ECU.',
        },
        {
            title: 'Step 2',
            description: 'Set vehicle speed to 50 km/h via CAN bus.',
        },
        {
            title: 'Step 3',
            description: 'Inject "Brake Pressed" signal.',
        },
        {
            title: 'Step 4',
            description: 'Verify ACC status changes to "Standby" within 200ms.',
        },
    ];

    return (
        <Card
            title={<Title level={5} style={{ margin: 0 }}>Generated Test Steps</Title>}
            bordered={false}
            style={{ height: '100%', background: '#1c1c1c' }}
            headStyle={{ borderBottom: '1px solid #303030' }}
        >
            <Steps
                direction="vertical"
                current={1} // Mocking current progress
                items={items}
                size="small"
            />
        </Card>
    );
};

export default TestStepsBlock;
