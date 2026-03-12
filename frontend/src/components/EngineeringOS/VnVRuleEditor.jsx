import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, InputNumber, Row, Col, App } from 'antd';
import { api } from '../../services/api';

const OPERATORS = [
  { value: '<', label: '<' },
  { value: '>', label: '>' },
  { value: '<=', label: '<=' },
  { value: '>=', label: '>=' },
  { value: '==', label: '==' },
  { value: '!=', label: '!=' },
];

const METHODS = [
  { value: 'test', label: 'Test' },
  { value: 'analysis', label: 'Analysis' },
  { value: 'inspection', label: 'Inspection' },
  { value: 'review', label: 'Review' },
  { value: 'simulation', label: 'Simulation' },
];

const VnVRuleEditor = ({ open, onClose, rule, projectId, onSaved }) => {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const isEditing = !!rule;

  useEffect(() => {
    if (open) {
      if (rule) {
        form.setFieldsValue({
          title: rule.title || '',
          requirement_id: rule.requirement_id || '',
          block_id: rule.block_id || '',
          formula: rule.formula || '',
          operator: rule.operator || '<',
          left_value: rule.left_value ?? null,
          left_label: rule.left_label || '',
          right_value: rule.right_value ?? null,
          right_label: rule.right_label || '',
          method: rule.method || 'test',
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, rule, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (isEditing) {
        await api.updateVnVRule(projectId, rule.id, values);
        message.success('Rule updated');
      } else {
        await api.createVnVRule(projectId, values);
        message.success('Rule created');
      }
      onSaved();
    } catch (err) {
      if (err.errorFields) return; // validation error, antd shows inline
      message.error('Failed to save rule');
    }
  };

  return (
    <Modal
      title={isEditing ? 'Edit V&V Rule' : 'Create V&V Rule'}
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      okText={isEditing ? 'Update' : 'Create'}
      okButtonProps={{ style: { backgroundColor: '#0EA5E9', borderColor: '#0EA5E9' } }}
      width={640}
      destroyOnClose
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item
          name="title"
          label="Title"
          rules={[{ required: true, message: 'Title is required' }]}
        >
          <Input placeholder="e.g. Fan mass verification" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="requirement_id" label="Requirement ID">
              <Input placeholder="e.g. REQ-001" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="block_id" label="Block ID">
              <Input placeholder="e.g. BLK-FAN-01" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="formula" label="Formula">
          <Input placeholder='e.g. $Valifan.Mass < $REQ.maximum_fan_mass' />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="operator" label="Operator" initialValue="<">
              <Select options={OPERATORS} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="method" label="Method" initialValue="test">
              <Select options={METHODS} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="left_value" label="Left Value">
              <InputNumber style={{ width: '100%' }} placeholder="0" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="left_label" label="Left Label">
              <Input placeholder="e.g. Actual Mass" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="right_value" label="Right Value">
              <InputNumber style={{ width: '100%' }} placeholder="0" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="right_label" label="Right Label">
              <Input placeholder="e.g. Max Allowed Mass" />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default VnVRuleEditor;
