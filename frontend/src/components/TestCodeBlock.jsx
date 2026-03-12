import React from 'react';
import { Typography, Card } from 'antd';
import { CopyOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const codeSnippet = `
def test_acc_disengage_on_brake():
    # Step 1: Initialize
    hil.connect()
    
    # Step 2: Set Speed
    hil.set_signal("Vehicle_Speed", 50)
    assert hil.get_signal("ACC_State") == "Active"
    
    # Step 3: Inject Brake
    hil.set_signal("Brake_Pedal", 1)
    
    # Step 4: Verify
    time.sleep(0.2)
    assert hil.get_signal("ACC_State") == "Standby"
`;

const TestCodeBlock = () => {
    return (
        <Card
            title={<Title level={5} style={{ margin: 0 }}>Generated Test Code</Title>}
            extra={<CopyOutlined style={{ cursor: 'pointer', color: '#00b96b' }} />}
            bordered={false}
            style={{ height: '100%', background: '#1c1c1c' }}
            headStyle={{ borderBottom: '1px solid #303030' }}
        >
            <pre style={{
                background: '#121212',
                padding: '12px',
                borderRadius: '4px',
                overflowX: 'auto',
                fontFamily: 'monospace',
                fontSize: '12px',
                color: '#d4d4d4',
                margin: 0
            }}>
                {codeSnippet.trim()}
            </pre>
        </Card>
    );
};

export default TestCodeBlock;
