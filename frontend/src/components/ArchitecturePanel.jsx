import React, { useState } from 'react';
import { Card, Typography, Space, Button } from 'antd';
import { ApiOutlined, GatewayOutlined, DashboardOutlined, PlusOutlined, AppstoreAddOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

// Simple Node Component
const Node = ({ title, icon, x, y, inputs = [], outputs = [] }) => (
    <Card
        size="small"
        title={<Space><span style={{ color: '#00b96b' }}>{icon}</span> <Text style={{ color: 'white' }}>{title}</Text></Space>}
        style={{
            position: 'absolute',
            left: x,
            top: y,
            width: 200,
            background: '#2a2a2a',
            borderColor: '#424242',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
        }}
        headStyle={{ borderBottom: '1px solid #424242', color: 'white' }}
    >
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {inputs.map(i => <div key={i} style={{ display: 'flex', alignItems: 'center' }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1890ff', marginRight: 4 }} /> <Text style={{ fontSize: 12, color: '#aaa' }}>{i}</Text></div>)}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                {outputs.map(o => <div key={o} style={{ display: 'flex', alignItems: 'center' }}><Text style={{ fontSize: 12, color: '#aaa' }}>{o}</Text> <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#52c41a', marginLeft: 4 }} /></div>)}
            </div>
        </div>
    </Card>
);

const ArchitecturePanel = () => {
    const [nodes, setNodes] = useState([
        { id: 1, title: "Throttle Sensor", icon: <DashboardOutlined />, x: 100, y: 150, outputs: ['raw_val', 'status'] },
        { id: 2, title: "Speed Sensor", icon: <DashboardOutlined />, x: 100, y: 350, outputs: ['kph', 'validity'] },
        { id: 3, title: "ECU_Main", icon: <ApiOutlined />, x: 450, y: 250, inputs: ['throttle_in', 'speed_in'], outputs: ['torque_req', 'gear_cmd'] },
        { id: 4, title: "Gearbox Actuator", icon: <GatewayOutlined />, x: 800, y: 250, inputs: ['gear_cmd'], outputs: ['current_gear'] },
    ]);

    const handleAddNode = () => {
        const newNode = {
            id: Date.now(),
            title: "New Component",
            icon: <AppstoreAddOutlined />,
            x: 450,
            y: 450,
            inputs: ['in_1'],
            outputs: ['out_1']
        };
        setNodes([...nodes, newNode]);
    };

    return (
        <div style={{
            height: '100%',
            width: '100%',
            background: '#121212',
            position: 'relative',
            overflow: 'hidden',
            backgroundImage: 'radial-gradient(#333 1px, transparent 1px)',
            backgroundSize: '20px 20px'
        }}>
            <div style={{ padding: 16, position: 'absolute', zIndex: 10, display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <div>
                    <Title level={4} style={{ color: 'white', margin: 0 }}>System Architecture: Powertrain Control</Title>
                    <Text type="secondary">Edit system components and interfaces</Text>
                </div>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAddNode} style={{ marginRight: 32 }}>Add Node</Button>
            </div>

            {/* Render Nodes */}
            {nodes.map(node => (
                <Node key={node.id} {...node} />
            ))}

            {/* Simple SVG Lines for connections (Static for now) */}
            <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                <path d="M 300 200 C 375 200, 375 290, 450 290" stroke="#555" strokeWidth="2" fill="none" />
                <path d="M 300 400 C 375 400, 375 310, 450 310" stroke="#555" strokeWidth="2" fill="none" />
                <path d="M 650 300 L 800 300" stroke="#555" strokeWidth="2" fill="none" />
            </svg>

        </div>
    );
};

export default ArchitecturePanel;
