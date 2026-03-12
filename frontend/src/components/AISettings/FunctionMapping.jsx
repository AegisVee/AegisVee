import React, { useState, useEffect } from 'react';
import { Table, Select, Button, Typography, Space, message, Spin } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { api } from '../../services/api';

const { Title, Text } = Typography;

const FUNCTIONS = [
  { key: 'requirement_analysis', label: 'Requirement Analysis', description: 'Analyze requirement quality and suggest improvements' },
  { key: 'test_generation', label: 'Test Generation', description: 'Generate test cases from requirements' },
  { key: 'rag_query', label: 'RAG Query', description: 'Semantic search and document retrieval' },
  { key: 'impact_analysis', label: 'Impact Analysis', description: 'Analyze change impact across requirements' },
  { key: 'code_generation', label: 'Code Generation', description: 'Generate code from requirement specifications' },
];

const FunctionMapping = () => {
  const [mappings, setMappings] = useState([]);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [mappingData, modelData] = await Promise.all([
        api.getAIFunctionMappings(),
        api.getAIModels(),
      ]);
      // Merge with function definitions
      const merged = FUNCTIONS.map((fn) => {
        const existing = mappingData.find((m) => m.function_name === fn.key);
        return {
          ...fn,
          model_name: existing?.model_name || '',
          provider: existing?.provider || 'ollama',
        };
      });
      setMappings(merged);
      setModels(modelData);
    } catch (e) {
      console.error('Failed to load mappings:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleModelChange = (functionKey, modelName) => {
    setMappings((prev) =>
      prev.map((m) =>
        m.key === functionKey ? { ...m, model_name: modelName } : m
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = mappings.map((m) => ({
        function_name: m.key,
        model_name: m.model_name,
        provider: m.provider,
      }));
      await api.updateAIFunctionMappings(payload);
      message.success('Function mappings saved');
    } catch (e) {
      message.error('Failed to save mappings');
    } finally {
      setSaving(false);
    }
  };

  const modelOptions = models.map((m) => ({
    value: m.name,
    label: m.name,
  }));

  const columns = [
    {
      title: 'Feature',
      dataIndex: 'label',
      key: 'label',
      width: 200,
      render: (label, record) => (
        <div>
          <Text strong>{label}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>{record.description}</Text>
        </div>
      ),
    },
    {
      title: 'Assigned Model',
      dataIndex: 'model_name',
      key: 'model_name',
      width: 250,
      render: (value, record) => (
        <Select
          value={value || undefined}
          placeholder="Select model..."
          onChange={(val) => handleModelChange(record.key, val)}
          options={modelOptions}
          style={{ width: '100%' }}
          allowClear
        />
      ),
    },
    {
      title: 'Provider',
      dataIndex: 'provider',
      key: 'provider',
      width: 120,
      render: (p) => p || 'ollama',
    },
  ];

  if (loading) {
    return <Spin size="large" style={{ display: 'block', margin: '80px auto' }} />;
  }

  return (
    <div>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>Function Mapping</Title>
          <Text type="secondary">Assign different models to different AI features.</Text>
        </div>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          loading={saving}
          onClick={handleSave}
        >
          Save Mappings
        </Button>
      </Space>

      <Table
        columns={columns}
        dataSource={mappings}
        rowKey="key"
        size="middle"
        pagination={false}
      />
    </div>
  );
};

export default FunctionMapping;
