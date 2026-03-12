import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Tag, Typography, Space, Progress, message, Spin, Badge } from 'antd';
import { DownloadOutlined, CheckCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { api } from '../../services/api';

const { Text, Title } = Typography;

const TYPE_COLORS = {
  runtime: 'blue',
  model: 'green',
  vector_store: 'purple',
  connector: 'orange',
};

const ModelMarketplace = () => {
  const [plugins, setPlugins] = useState([]);
  const [hardware, setHardware] = useState(null);
  const [loading, setLoading] = useState(true);
  const [installing, setInstalling] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pluginData, hwData] = await Promise.all([
        api.getPlugins(),
        api.getHardwareInfo(),
      ]);
      setPlugins(pluginData);
      setHardware(hwData);
    } catch (e) {
      console.error('Failed to load marketplace data:', e);
    } finally {
      setLoading(false);
    }
  };

  const getCompatibility = (plugin) => {
    if (!hardware || !plugin.hardware_requirements) return 'compatible';
    const req = plugin.hardware_requirements;
    if (req.min_ram_gb > hardware.ram_total_gb) return 'exceeds';
    if (req.min_vram_gb > 0 && req.min_vram_gb > hardware.gpu_vram_gb) return 'exceeds';
    if (hardware.recommended_tier === 'full') return 'recommended';
    if (hardware.recommended_tier === 'standard' && req.min_ram_gb <= 16) return 'recommended';
    if (hardware.recommended_tier === 'light' && req.min_ram_gb <= 8) return 'recommended';
    return 'compatible';
  };

  const handleInstall = async (pluginId) => {
    setInstalling((prev) => ({ ...prev, [pluginId]: true }));
    try {
      await api.installPlugin(pluginId);
      message.success('Plugin installed successfully');
      await loadData();
    } catch (e) {
      message.error(`Installation failed: ${e.message}`);
    } finally {
      setInstalling((prev) => ({ ...prev, [pluginId]: false }));
    }
  };

  if (loading) {
    return <Spin size="large" style={{ display: 'block', margin: '80px auto' }} />;
  }

  return (
    <div>
      <Title level={4}>Model Marketplace</Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        Browse and install AI models and plugins. All models run locally on your machine.
      </Text>

      <Row gutter={[16, 16]}>
        {plugins.map((plugin) => {
          const compat = getCompatibility(plugin);
          const isInstalled = plugin.status === 'installed';
          const isInstalling = installing[plugin.id] || plugin.status === 'downloading';

          return (
            <Col xs={24} sm={12} lg={8} key={plugin.id}>
              <Badge.Ribbon
                text={compat === 'recommended' ? 'Recommended' : compat === 'exceeds' ? 'High Spec' : null}
                color={compat === 'recommended' ? 'green' : compat === 'exceeds' ? 'red' : 'transparent'}
                style={{ display: compat === 'compatible' ? 'none' : undefined }}
              >
                <Card
                  hoverable
                  size="small"
                  style={{ height: '100%' }}
                  actions={[
                    isInstalled ? (
                      <Space key="installed">
                        <CheckCircleOutlined style={{ color: '#52c41a' }} />
                        <Text type="success">Installed</Text>
                      </Space>
                    ) : compat === 'exceeds' ? (
                      <Space key="exceeds">
                        <WarningOutlined style={{ color: '#faad14' }} />
                        <Text type="warning">Exceeds Hardware</Text>
                      </Space>
                    ) : (
                      <Button
                        key="install"
                        type="link"
                        icon={<DownloadOutlined />}
                        loading={isInstalling}
                        onClick={() => handleInstall(plugin.id)}
                      >
                        Install
                      </Button>
                    ),
                  ]}
                >
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Space>
                      <Text strong>{plugin.display_name || plugin.name}</Text>
                      <Tag color={TYPE_COLORS[plugin.type]}>{plugin.type}</Tag>
                    </Space>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {plugin.description}
                    </Text>
                    <Space>
                      <Tag>{plugin.size_mb >= 1000 ? `${(plugin.size_mb / 1000).toFixed(1)} GB` : `${plugin.size_mb} MB`}</Tag>
                      <Tag>v{plugin.version}</Tag>
                    </Space>
                    {isInstalling && (
                      <Progress percent={Math.round(plugin.download_progress * 100)} size="small" />
                    )}
                  </Space>
                </Card>
              </Badge.Ribbon>
            </Col>
          );
        })}
      </Row>
    </div>
  );
};

export default ModelMarketplace;
