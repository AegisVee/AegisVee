import React, { useState, useEffect } from 'react';
import { Tag, Space, Typography } from 'antd';
import { DashboardOutlined, ThunderboltOutlined } from '@ant-design/icons';

const { Text } = Typography;

const PerformanceOverlay = () => {
    const [latency, setLatency] = useState(0);
    const [fps, setFps] = useState(60);

    useEffect(() => {
        // Intercept fetch to capture latency from custom header
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const start = performance.now();
            const response = await originalFetch(...args);
            const end = performance.now();

            // Try to get X-Process-Time from header
            const backendLatency = response.headers.get('X-Process-Time');
            if (backendLatency) {
                setLatency(parseFloat(backendLatency) * 1000); // Convert to ms
            } else {
                setLatency(end - start); // Fallback to network latency
            }
            return response;
        };

        // FPS tracking
        let frameCount = 0;
        let lastTime = performance.now();
        const updateFps = () => {
            frameCount++;
            const now = performance.now();
            if (now - lastTime >= 1000) {
                setFps(frameCount);
                frameCount = 0;
                lastTime = now;
            }
            requestAnimationFrame(updateFps);
        };
        const handle = requestAnimationFrame(updateFps);

        return () => {
            window.fetch = originalFetch;
            cancelAnimationFrame(handle);
        };
    }, []);

    const latencyColor = latency < 50 ? '#52c41a' : latency < 200 ? '#faad14' : '#ff4d4f';

    return (
        <div style={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.8)',
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid #444',
            backdropFilter: 'blur(4px)',
            pointerEvents: 'none'
        }}>
            <Space direction="vertical" size={0}>
                <Space>
                    <DashboardOutlined style={{ color: '#00b96b' }} />
                    <Text style={{ color: '#aaa', fontSize: '12px' }}>API Latency:</Text>
                    <Tag color={latencyColor} style={{ border: 'none', margin: 0, fontWeight: 'bold' }}>
                        {latency.toFixed(1)}ms
                    </Tag>
                </Space>
                <Space>
                    <ThunderboltOutlined style={{ color: '#faad14' }} />
                    <Text style={{ color: '#aaa', fontSize: '12px' }}>UI Performance:</Text>
                    <Text style={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}>{fps} FPS</Text>
                </Space>
            </Space>
        </div>
    );
};

export default PerformanceOverlay;
