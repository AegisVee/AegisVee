import React, { useState, useEffect } from 'react';
import { Card, Radio, Button, Input, Tag, Typography, Space, Descriptions, message, Spin } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, ApiOutlined } from '@ant-design/icons';
import { api } from '../../services/api';

const { Title, Text } = Typography;

const PROVIDERS = [
  {
    key: 'ollama',
    name: 'Ollama',
    description: 'Simplest local model management. One-command install. Recommended for new users.',
    defaultUrl: 'http://localhost:11434',
  },
  {
    key: 'llamacpp',
    name: 'llama.cpp',
    description: 'High-performance C++ inference engine. Supports GGUF format. For advanced users.',
    defaultUrl: '',
    comingSoon: true,
  },
  {
    key: 'onnxruntime',
    name: 'ONNX Runtime',
    description: "Microsoft's inference engine. Best GPU acceleration on Windows.",
    defaultUrl: '',
    comingSoon: true,
  },
];

const InferenceSettings = () => {
  const [settings, setSettings] = useState(null);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState({});
  const [testResults, setTestResults] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [settingsData, providerData] = await Promise.all([
        api.getAISettings(),
        api.getAIProviders(),
      ]);
      setSettings(settingsData);
      setProviders(providerData);
      // Set initial test results from provider status
      const results = {};
      providerData.forEach((p) => {
        results[p.name] = p.available;
      });
      setTestResults(results);
    } catch (e) {
      console.error('Failed to load settings:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleProviderChange = async (providerKey) => {
    if (!settings) return;
    const updated = { ...settings, active_provider: providerKey };
    try {
      await api.updateAISettings(updated);
      setSettings(updated);
      message.success(`Switched to ${providerKey}`);
    } catch (e) {
      message.error('Failed to update provider');
    }
  };

  const handleTestConnection = async (providerKey) => {
    setTesting((prev) => ({ ...prev, [providerKey]: true }));
    try {
      const providerConfig = PROVIDERS.find((p) => p.key === providerKey);
      const result = await api.testAIProvider(providerKey, providerConfig?.defaultUrl);
      setTestResults((prev) => ({ ...prev, [providerKey]: result.available }));
      message[result.available ? 'success' : 'warning'](
        result.available ? `${providerKey} is connected` : `${providerKey} is not available`
      );
    } catch (e) {
      setTestResults((prev) => ({ ...prev, [providerKey]: false }));
      message.error('Connection test failed');
    } finally {
      setTesting((prev) => ({ ...prev, [providerKey]: false }));
    }
  };

  if (loading) {
    return <Spin size="large" style={{ display: 'block', margin: '80px auto' }} />;
  }

  return (
    <div>
      <Title level={4}>Inference Engine</Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        Choose which inference engine to use for AI features. All options run 100% locally.
      </Text>

      <Radio.Group
        value={settings?.active_provider}
        onChange={(e) => handleProviderChange(e.target.value)}
        style={{ width: '100%' }}
      >
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          {PROVIDERS.map((p) => (
            <Card key={p.key} size="small" style={{ width: '100%' }}>
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Space>
                    <Radio value={p.key} disabled={p.comingSoon}>
                      <Text strong>{p.name}</Text>
                    </Radio>
                    {p.comingSoon && <Tag>Coming Soon</Tag>}
                    {testResults[p.key] === true && (
                      <Tag icon={<CheckCircleOutlined />} color="success">Connected</Tag>
                    )}
                    {testResults[p.key] === false && !p.comingSoon && (
                      <Tag icon={<CloseCircleOutlined />} color="error">Offline</Tag>
                    )}
                  </Space>
                  {!p.comingSoon && (
                    <Button
                      size="small"
                      icon={<ApiOutlined />}
                      loading={testing[p.key]}
                      onClick={() => handleTestConnection(p.key)}
                    >
                      Test
                    </Button>
                  )}
                </Space>
                <Text type="secondary" style={{ fontSize: 13 }}>{p.description}</Text>
                {!p.comingSoon && p.defaultUrl && (
                  <Descriptions size="small" column={1}>
                    <Descriptions.Item label="Endpoint">{p.defaultUrl}</Descriptions.Item>
                  </Descriptions>
                )}
              </Space>
            </Card>
          ))}
        </Space>
      </Radio.Group>
    </div>
  );
};

export default InferenceSettings;
