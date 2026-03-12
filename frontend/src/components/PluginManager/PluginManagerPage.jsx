import React, { useState, useEffect } from 'react';
import { Card, List, Button, Tag, Typography, Space, Progress, Popconfirm, message, Spin, Segmented, Empty } from 'antd';
import { DownloadOutlined, DeleteOutlined, CheckCircleOutlined, AppstoreOutlined } from '@ant-design/icons';
import { api } from '../../services/api';

const { Title, Text } = Typography;

const TYPE_LABELS = {
  runtime: { label: 'Runtime', color: 'blue' },
  model: { label: 'Model', color: 'green' },
  vector_store: { label: 'Vector Store', color: 'purple' },
  connector: { label: 'Connector', color: 'orange' },
};

const STATUS_CONFIG = {
  available: { color: 'default', text: 'Available' },
  downloading: { color: 'processing', text: 'Downloading...' },
  installed: { color: 'success', text: 'Installed' },
  error: { color: 'error', text: 'Error' },
};

const PluginManagerPage = () => {
  const [plugins, setPlugins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [operating, setOperating] = useState({});

  useEffect(() => {
    loadPlugins();
  }, []);

  const loadPlugins = async () => {
    setLoading(true);
    try {
      const data = await api.getPlugins();
      setPlugins(data);
    } catch (e) {
      console.error('Failed to load plugins:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleInstall = async (pluginId) => {
    setOperating((prev) => ({ ...prev, [pluginId]: 'installing' }));
    try {
      await api.installPlugin(pluginId);
      message.success('Plugin installed');
      await loadPlugins();
    } catch (e) {
      message.error(`Install failed: ${e.message}`);
    } finally {
      setOperating((prev) => ({ ...prev, [pluginId]: null }));
    }
  };

  const handleUninstall = async (pluginId) => {
    setOperating((prev) => ({ ...prev, [pluginId]: 'uninstalling' }));
    try {
      await api.uninstallPlugin(pluginId);
      message.success('Plugin uninstalled');
      await loadPlugins();
    } catch (e) {
      message.error(`Uninstall failed: ${e.message}`);
    } finally {
      setOperating((prev) => ({ ...prev, [pluginId]: null }));
    }
  };

  const filteredPlugins = filter === 'all'
    ? plugins
    : filter === 'installed'
    ? plugins.filter((p) => p.status === 'installed')
    : plugins.filter((p) => p.type === filter);

  if (loading) {
    return <Spin size="large" style={{ display: 'block', margin: '80px auto' }} />;
  }

  return (
    <div style={{ padding: 24, height: '100%', overflow: 'auto' }}>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            <AppstoreOutlined style={{ marginRight: 8 }} />
            Plugin Manager
          </Title>
          <Text type="secondary">Manage AI runtimes, models, and integrations.</Text>
        </div>
        <Segmented
          value={filter}
          onChange={setFilter}
          options={[
            { label: 'All', value: 'all' },
            { label: 'Installed', value: 'installed' },
            { label: 'Runtime', value: 'runtime' },
            { label: 'Model', value: 'model' },
            { label: 'Vector Store', value: 'vector_store' },
          ]}
        />
      </Space>

      {filteredPlugins.length === 0 ? (
        <Empty description="No plugins match this filter." />
      ) : (
        <List
          grid={{ gutter: 16, xs: 1, sm: 2, md: 2, lg: 3, xl: 3 }}
          dataSource={filteredPlugins}
          renderItem={(plugin) => {
            const typeConfig = TYPE_LABELS[plugin.type] || { label: plugin.type, color: 'default' };
            const statusConfig = STATUS_CONFIG[plugin.status] || STATUS_CONFIG.available;
            const isOperating = !!operating[plugin.id];

            return (
              <List.Item>
                <Card size="small" hoverable>
                  <Space direction="vertical" size={8} style={{ width: '100%' }}>
                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                      <Text strong>{plugin.display_name || plugin.name}</Text>
                      <Tag color={typeConfig.color}>{typeConfig.label}</Tag>
                    </Space>

                    <Text type="secondary" style={{ fontSize: 12 }}>{plugin.description}</Text>

                    <Space>
                      <Tag>{plugin.size_mb >= 1000 ? `${(plugin.size_mb / 1000).toFixed(1)} GB` : `${plugin.size_mb} MB`}</Tag>
                      <Tag color={statusConfig.color}>{statusConfig.text}</Tag>
                    </Space>

                    {plugin.status === 'downloading' && (
                      <Progress percent={Math.round(plugin.download_progress * 100)} size="small" />
                    )}

                    <div style={{ marginTop: 8 }}>
                      {plugin.status === 'installed' ? (
                        <Popconfirm
                          title="Uninstall this plugin?"
                          onConfirm={() => handleUninstall(plugin.id)}
                        >
                          <Button
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            loading={isOperating}
                          >
                            Uninstall
                          </Button>
                        </Popconfirm>
                      ) : (
                        <Button
                          type="primary"
                          size="small"
                          icon={<DownloadOutlined />}
                          loading={isOperating}
                          onClick={() => handleInstall(plugin.id)}
                        >
                          Install
                        </Button>
                      )}
                    </div>
                  </Space>
                </Card>
              </List.Item>
            );
          }}
        />
      )}
    </div>
  );
};

export default PluginManagerPage;
