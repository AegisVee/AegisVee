import React, { useState, useEffect } from 'react';
import { Modal, Steps, Card, Row, Col, Button, Typography, Space, Tag, Statistic, Spin, Radio, Result } from 'antd';
import { LaptopOutlined, RocketOutlined, CheckCircleOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { api } from '../../services/api';

const { Title, Text, Paragraph } = Typography;

const TIERS = [
  {
    key: 'skip',
    label: 'Skip AI',
    description: 'Use AegisVee without AI features. You can enable AI later from Settings.',
    size: '0 MB',
    tag: null,
  },
  {
    key: 'light',
    label: 'Light AI',
    description: 'Small language model (2-4 GB). Fast inference, basic requirement analysis.',
    size: '~2-4 GB',
    tag: 'Qwen 2.5 3B / Phi-3 Mini',
  },
  {
    key: 'standard',
    label: 'Standard AI',
    description: 'Medium language model (4-8 GB). Full requirement analysis, code generation, RAG.',
    size: '~4-8 GB',
    tag: 'Gemma 3 4B / Llama 3.1 8B',
  },
  {
    key: 'full',
    label: 'Full AI Suite',
    description: 'Multiple models + vector store. Maximum capability for complex engineering projects.',
    size: '~10-20 GB',
    tag: 'All models + ChromaDB',
  },
];

const SetupWizard = ({ onComplete, onSkip }) => {
  const [current, setCurrent] = useState(0);
  const [hardware, setHardware] = useState(null);
  const [loadingHW, setLoadingHW] = useState(true);
  const [selectedTier, setSelectedTier] = useState('skip');

  useEffect(() => {
    detectHardware();
  }, []);

  const detectHardware = async () => {
    setLoadingHW(true);
    try {
      const hw = await api.getHardwareInfo();
      setHardware(hw);
      setSelectedTier(hw.recommended_tier || 'light');
    } catch (e) {
      console.error('Hardware detection failed:', e);
      setHardware({
        cpu_name: 'Detection failed',
        cpu_cores: 0,
        ram_total_gb: 0,
        gpu_name: 'Unknown',
        gpu_vram_gb: 0,
        recommended_tier: 'light',
      });
    } finally {
      setLoadingHW(false);
    }
  };

  const tierColors = { light: '#faad14', standard: '#1890ff', full: '#52c41a' };

  const steps = [
    {
      title: 'Hardware',
      icon: <LaptopOutlined />,
      content: (
        <div>
          <Title level={4}>Hardware Detection</Title>
          <Paragraph type="secondary">
            AegisVee has scanned your system to recommend the best AI configuration.
          </Paragraph>

          {loadingHW ? (
            <Spin size="large" style={{ display: 'block', margin: '40px auto' }} />
          ) : (
            <Card size="small">
              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <Statistic title="CPU" value={hardware?.cpu_name || 'Unknown'} valueStyle={{ fontSize: 14 }} />
                </Col>
                <Col span={4}>
                  <Statistic title="Cores" value={hardware?.cpu_cores || 0} />
                </Col>
                <Col span={4}>
                  <Statistic title="RAM" value={`${hardware?.ram_total_gb || 0} GB`} />
                </Col>
                <Col span={4}>
                  <Statistic title="GPU" value={hardware?.gpu_name || 'None'} valueStyle={{ fontSize: 14 }} />
                </Col>
                <Col span={4}>
                  <Statistic title="VRAM" value={hardware?.gpu_vram_gb ? `${hardware.gpu_vram_gb} GB` : 'N/A'} />
                </Col>
              </Row>
              <div style={{ marginTop: 16, textAlign: 'center' }}>
                <Text>Recommended tier: </Text>
                <Tag color={tierColors[hardware?.recommended_tier] || 'default'} style={{ fontSize: 14, padding: '4px 12px' }}>
                  {hardware?.recommended_tier?.toUpperCase() || 'LIGHT'}
                </Tag>
              </div>
            </Card>
          )}
        </div>
      ),
    },
    {
      title: 'AI Setup',
      icon: <RocketOutlined />,
      content: (
        <div>
          <Title level={4}>Choose AI Configuration</Title>
          <Paragraph type="secondary">
            Select your AI setup. You can change this anytime from the AI Settings page.
          </Paragraph>

          <Radio.Group
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value)}
            style={{ width: '100%' }}
          >
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              {TIERS.map((tier) => {
                const isRecommended = tier.key === hardware?.recommended_tier;
                return (
                  <Card
                    key={tier.key}
                    size="small"
                    hoverable
                    style={{
                      border: selectedTier === tier.key ? '2px solid #00b96b' : undefined,
                    }}
                    onClick={() => setSelectedTier(tier.key)}
                  >
                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                      <Space>
                        <Radio value={tier.key} />
                        <div>
                          <Space>
                            <Text strong>{tier.label}</Text>
                            {isRecommended && <Tag color="green">Recommended</Tag>}
                          </Space>
                          <br />
                          <Text type="secondary" style={{ fontSize: 12 }}>{tier.description}</Text>
                          {tier.tag && (
                            <>
                              <br />
                              <Tag style={{ marginTop: 4 }}>{tier.tag}</Tag>
                            </>
                          )}
                        </div>
                      </Space>
                      <Text type="secondary">{tier.size}</Text>
                    </Space>
                  </Card>
                );
              })}
            </Space>
          </Radio.Group>
        </div>
      ),
    },
    {
      title: 'Ready',
      icon: <CheckCircleOutlined />,
      content: (
        <Result
          status="success"
          title="You're All Set!"
          subTitle={
            selectedTier === 'skip'
              ? 'AegisVee is ready. You can enable AI features later from AI Settings.'
              : `AegisVee is ready with ${selectedTier} AI configuration. Visit AI Settings to manage models.`
          }
          extra={
            <Button type="primary" size="large" onClick={onComplete}>
              Start Using AegisVee
            </Button>
          }
        />
      ),
    },
  ];

  return (
    <Modal
      open
      width={700}
      closable
      onCancel={onSkip}
      footer={
        current < 2 ? (
          <Space>
            <Button onClick={onSkip}>Skip Setup</Button>
            {current > 0 && <Button onClick={() => setCurrent(current - 1)}>Back</Button>}
            <Button type="primary" onClick={() => setCurrent(current + 1)}>
              {current === 0 ? 'Next' : 'Confirm'}
            </Button>
          </Space>
        ) : null
      }
      title={
        <Space>
          <ThunderboltOutlined style={{ color: '#00b96b' }} />
          <span>Welcome to AegisVee</span>
        </Space>
      }
    >
      <Steps current={current} items={steps} style={{ marginBottom: 24 }} />
      {steps[current].content}
    </Modal>
  );
};

export default SetupWizard;
