import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, Typography, Space, Popconfirm, message, Spin, Empty } from 'antd';
import { DeleteOutlined, StarOutlined, ReloadOutlined } from '@ant-design/icons';
import { api } from '../../services/api';

const { Title, Text } = Typography;

const InstalledModels = () => {
  const [models, setModels] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [modelData, settingsData] = await Promise.all([
        api.getAIModels(),
        api.getAISettings(),
      ]);
      setModels(modelData);
      setSettings(settingsData);
    } catch (e) {
      console.error('Failed to load models:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (modelName) => {
    try {
      await api.deleteAIModel(modelName);
      message.success(`Model ${modelName} deleted`);
      await loadData();
    } catch (e) {
      message.error(`Failed to delete: ${e.message}`);
    }
  };

  const isDefault = (modelName) => {
    if (!settings) return false;
    return settings.function_mappings?.some((m) => m.model_name === modelName);
  };

  const columns = [
    {
      title: 'Model',
      dataIndex: 'name',
      key: 'name',
      render: (name) => (
        <Space>
          <Text strong>{name}</Text>
          {isDefault(name) && <Tag color="blue">Active</Tag>}
        </Space>
      ),
    },
    {
      title: 'Size',
      dataIndex: 'size_mb',
      key: 'size_mb',
      width: 100,
      render: (mb) =>
        mb >= 1000 ? `${(mb / 1000).toFixed(1)} GB` : `${mb} MB`,
    },
    {
      title: 'Family',
      dataIndex: 'family',
      key: 'family',
      width: 120,
      render: (f) => f || '-',
    },
    {
      title: 'Quantization',
      dataIndex: 'quantization',
      key: 'quantization',
      width: 100,
      render: (q) => q || '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          <Popconfirm
            title={`Delete ${record.name}?`}
            onConfirm={() => handleDelete(record.name)}
            okText="Delete"
            cancelText="Cancel"
          >
            <Button danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (loading) {
    return <Spin size="large" style={{ display: 'block', margin: '80px auto' }} />;
  }

  return (
    <div>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>Installed Models</Title>
          <Text type="secondary">Models currently available on your machine.</Text>
        </div>
        <Button icon={<ReloadOutlined />} onClick={loadData}>Refresh</Button>
      </Space>

      {models.length === 0 ? (
        <Empty description="No models installed. Visit Model Marketplace to install one." />
      ) : (
        <Table
          columns={columns}
          dataSource={models}
          rowKey="name"
          size="middle"
          pagination={false}
        />
      )}
    </div>
  );
};

export default InstalledModels;
