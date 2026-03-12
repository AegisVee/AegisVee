import React, { useState, useEffect, useRef } from 'react';
import { Card, Row, Col, Progress, Statistic, Typography, Space, Tag, Spin } from 'antd';
import { DashboardOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { api } from '../../services/api';

const { Title, Text } = Typography;

const PerformanceMonitor = () => {
  const [hardware, setHardware] = useState(null);
  const [gpuStats, setGpuStats] = useState(null);
  const [systemStats, setSystemStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  useEffect(() => {
    loadInitial();
    // Auto-refresh every 3 seconds
    intervalRef.current = setInterval(refreshStats, 3000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const loadInitial = async () => {
    setLoading(true);
    try {
      const [hw, gpu, sys] = await Promise.all([
        api.getHardwareInfo(),
        api.getGPUStats().catch(() => null),
        api.getSystemStats().catch(() => null),
      ]);
      setHardware(hw);
      setGpuStats(gpu);
      setSystemStats(sys);
    } catch (e) {
      console.error('Failed to load hardware info:', e);
    } finally {
      setLoading(false);
    }
  };

  const refreshStats = async () => {
    try {
      const [gpu, sys] = await Promise.all([
        api.getGPUStats().catch(() => null),
        api.getSystemStats().catch(() => null),
      ]);
      setGpuStats(gpu);
      setSystemStats(sys);
    } catch (e) {
      // Silent refresh failure
    }
  };

  if (loading) {
    return <Spin size="large" style={{ display: 'block', margin: '80px auto' }} />;
  }

  const tierColors = { light: 'orange', standard: 'blue', full: 'green' };

  return (
    <div>
      <Title level={4}>Performance Monitor</Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        Real-time system resource usage and AI inference performance.
      </Text>

      {/* Hardware Overview */}
      <Card title="Hardware Overview" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col span={6}>
            <Statistic title="CPU" value={hardware?.cpu_name || 'Unknown'} valueStyle={{ fontSize: 14 }} />
          </Col>
          <Col span={4}>
            <Statistic title="CPU Cores" value={hardware?.cpu_cores || 0} />
          </Col>
          <Col span={4}>
            <Statistic title="Total RAM" value={`${hardware?.ram_total_gb || 0} GB`} />
          </Col>
          <Col span={4}>
            <Statistic title="GPU" value={hardware?.gpu_name || 'None'} valueStyle={{ fontSize: 14 }} />
          </Col>
          <Col span={3}>
            <Statistic title="VRAM" value={hardware?.gpu_vram_gb ? `${hardware.gpu_vram_gb} GB` : 'N/A'} />
          </Col>
          <Col span={3}>
            <Space direction="vertical" align="center">
              <Text type="secondary">AI Tier</Text>
              <Tag color={tierColors[hardware?.recommended_tier] || 'default'} style={{ fontSize: 14, padding: '4px 12px' }}>
                {hardware?.recommended_tier?.toUpperCase() || 'UNKNOWN'}
              </Tag>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Live Stats */}
      <Row gutter={16}>
        <Col span={8}>
          <Card title="CPU Usage" size="small">
            <Progress
              type="circle"
              percent={Math.round(systemStats?.cpu_percent || 0)}
              strokeColor={{ '0%': '#108ee9', '100%': '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="RAM Usage" size="small">
            <Progress
              type="circle"
              percent={Math.round(systemStats?.memory_percent || 0)}
              format={() => `${systemStats?.memory_used_gb || 0} / ${systemStats?.memory_total_gb || 0} GB`}
              strokeColor={{ '0%': '#52c41a', '100%': '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card
            title={
              <Space>
                GPU Usage
                {gpuStats?.gpu_name && gpuStats.gpu_name !== 'None' ? (
                  <Tag color="green">Active</Tag>
                ) : (
                  <Tag>N/A</Tag>
                )}
              </Space>
            }
            size="small"
          >
            {gpuStats?.gpu_name && gpuStats.gpu_name !== 'None' ? (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Progress
                  type="circle"
                  percent={Math.round(gpuStats.vram_percent || 0)}
                  format={() => `${gpuStats.vram_used_gb || 0} / ${gpuStats.vram_total_gb || 0} GB`}
                  strokeColor={{ '0%': '#722ed1', '100%': '#ff4d4f' }}
                />
                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic
                      title="GPU Load"
                      value={gpuStats.gpu_utilization_percent || 0}
                      suffix="%"
                      valueStyle={{ fontSize: 16 }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="Temp"
                      value={gpuStats.temperature_c || 0}
                      suffix="°C"
                      valueStyle={{ fontSize: 16, color: gpuStats.temperature_c > 80 ? '#ff4d4f' : undefined }}
                    />
                  </Col>
                </Row>
              </Space>
            ) : (
              <Text type="secondary">No GPU detected or nvidia-smi unavailable.</Text>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default PerformanceMonitor;
