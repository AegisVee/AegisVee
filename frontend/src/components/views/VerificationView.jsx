/**
 * VerificationView — SYS.4 + SYS.5 Verification Management View
 *
 * Displays:
 * - VerificationMeasure table (unified with legacy TestScript)
 * - VerificationResult summary per measure
 * - Execute button to record a verification result
 * - VerificationMeasureSelectionSet list
 */

import React, { useState, useMemo } from "react";
import {
  Table,
  Button,
  Space,
  Tag,
  Tabs,
  Modal,
  Form,
  Input,
  Select,
  Row,
  Col,
  Card,
  Statistic,
  Badge,
  Typography,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useVerification } from "../../hooks/useVerification";

const { Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const RESULT_CONFIG = {
  pass: { color: "success", icon: <CheckCircleOutlined /> },
  fail: { color: "error", icon: <CloseCircleOutlined /> },
  blocked: { color: "warning", icon: <ClockCircleOutlined /> },
  pending: { color: "default", icon: <ClockCircleOutlined /> },
};

// ─── Execute Measure Modal ─────────────────────────────────────
function ExecuteModal({ open, measure, onOk, onCancel }) {
  const [form] = Form.useForm();

  React.useEffect(() => {
    if (open) form.resetFields();
  }, [open, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    onOk(values);
  };

  return (
    <Modal
      title={`Record Result — ${measure?.title || measure?.id}`}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      okText="Record"
    >
      <Form form={form} layout="vertical">
        <Form.Item label="Result" name="result" rules={[{ required: true }]}>
          <Select>
            <Option value="pass">Pass</Option>
            <Option value="fail">Fail</Option>
            <Option value="blocked">Blocked</Option>
            <Option value="pending">Pending</Option>
          </Select>
        </Form.Item>
        <Form.Item label="Summary" name="summary">
          <TextArea rows={3} placeholder="Describe what happened..." />
        </Form.Item>
      </Form>
    </Modal>
  );
}

// ─── Measure Form Modal ────────────────────────────────────────
function MeasureFormModal({ open, initialValues, onOk, onCancel, title }) {
  const [form] = Form.useForm();

  React.useEffect(() => {
    if (open) {
      form.setFieldsValue(initialValues || {
        technique: "test",
        script_type: "manual",
        measure_type: "system",
      });
    }
  }, [open, initialValues, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    onOk(values);
  };

  return (
    <Modal
      title={title}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      width={700}
      okText="Save"
    >
      <Form form={form} layout="vertical" size="small">
        <Form.Item label="Title" name="title" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Row gutter={12}>
          <Col span={8}>
            <Form.Item label="Technique" name="technique">
              <Select>
                <Option value="test">Test</Option>
                <Option value="analysis">Analysis</Option>
                <Option value="inspection">Inspection</Option>
                <Option value="review">Review</Option>
                <Option value="simulation">Simulation</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Script Type" name="script_type">
              <Select>
                <Option value="manual">Manual</Option>
                <Option value="hil">HIL</Option>
                <Option value="automated">Automated</Option>
                <Option value="exploratory">Exploratory</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Measure Type" name="measure_type">
              <Select>
                <Option value="system">System (SYS.5)</Option>
                <Option value="integration">Integration (SYS.4)</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <Form.Item label="Pass Criteria" name="pass_criteria">
          <TextArea rows={2} />
        </Form.Item>
        <Form.Item label="Environment" name="environment">
          <Input placeholder="e.g. HIL, SIL, bench, field" />
        </Form.Item>
        <Form.Item label="Content / Script" name="content">
          <TextArea rows={4} />
        </Form.Item>
      </Form>
    </Modal>
  );
}

// ─── Main View ────────────────────────────────────────────────
export default function VerificationView({ projectId }) {
  const {
    measures,
    results,
    selectionSets,
    loading,
    stats,
    createMeasure,
    updateMeasure,
    deleteMeasure,
    executeMeasure,
    getLatestResult,
    createSelectionSet,
  } = useVerification(projectId);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingMeasure, setEditingMeasure] = useState(null);
  const [executeTarget, setExecuteTarget] = useState(null);

  // Handlers
  const handleCreate = async (values) => {
    await createMeasure(values);
    setModalOpen(false);
  };

  const handleEdit = async (values) => {
    await updateMeasure(editingMeasure.id, values);
    setEditingMeasure(null);
  };

  const handleExecute = async (values) => {
    await executeMeasure(executeTarget.id, values);
    setExecuteTarget(null);
  };

  const handleDelete = (m) => {
    Modal.confirm({
      title: `Delete ${m.id}?`,
      content: m.title,
      okType: "danger",
      onOk: () => deleteMeasure(m.id),
    });
  };

  // Measure columns
  const measureColumns = [
    {
      title: "ID",
      dataIndex: "id",
      width: 90,
      render: (id) => <Text code>{id}</Text>,
    },
    {
      title: "Title",
      dataIndex: "title",
      ellipsis: true,
    },
    {
      title: "Technique",
      dataIndex: "technique",
      width: 100,
      render: (v) => <Tag>{v}</Tag>,
    },
    {
      title: "Type",
      dataIndex: "measure_type",
      width: 120,
      render: (v) => (
        <Tag color={v === "system" ? "blue" : "purple"}>{v}</Tag>
      ),
    },
    {
      title: "Last Result",
      width: 110,
      render: (_, row) => {
        const r = getLatestResult(row.id);
        if (!r) return <Text type="secondary">None</Text>;
        const cfg = RESULT_CONFIG[r.result] || RESULT_CONFIG.pending;
        return <Badge status={cfg.color} text={r.result} />;
      },
    },
    {
      title: "",
      width: 130,
      render: (_, row) => (
        <Space size={4}>
          <Tooltip title="Record Result">
            <Button
              size="small"
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={() => setExecuteTarget(row)}
            />
          </Tooltip>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => setEditingMeasure(row)}
          />
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(row)}
          />
        </Space>
      ),
    },
  ];

  const tabItems = [
    {
      key: "measures",
      label: `Measures (${measures.length})`,
      children: (
        <>
          <Space style={{ marginBottom: 12 }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setModalOpen(true)}
            >
              New Measure
            </Button>
          </Space>
          <Table
            dataSource={measures}
            columns={measureColumns}
            rowKey="id"
            size="small"
            loading={loading}
            pagination={{ pageSize: 15 }}
            scroll={{ x: 700 }}
          />
        </>
      ),
    },
    {
      key: "results",
      label: `Results (${results.length})`,
      children: (
        <Table
          dataSource={results}
          rowKey="id"
          size="small"
          columns={[
            { title: "ID", dataIndex: "id", width: 90 },
            { title: "Measure ID", dataIndex: "measure_id", width: 110 },
            {
              title: "Result",
              dataIndex: "result",
              width: 90,
              render: (v) => {
                const cfg = RESULT_CONFIG[v] || RESULT_CONFIG.pending;
                return <Badge status={cfg.color} text={v} />;
              },
            },
            { title: "Summary", dataIndex: "summary", ellipsis: true },
            { title: "Date", dataIndex: "created_at", width: 170 },
          ]}
          pagination={{ pageSize: 15 }}
        />
      ),
    },
    {
      key: "sets",
      label: `Selection Sets (${selectionSets.length})`,
      children: (
        <Table
          dataSource={selectionSets}
          rowKey="id"
          size="small"
          columns={[
            { title: "ID", dataIndex: "id", width: 90 },
            { title: "Title", dataIndex: "title", ellipsis: true },
            { title: "Entry Criteria", dataIndex: "entry_criteria", ellipsis: true },
            { title: "Exit Criteria", dataIndex: "exit_criteria", ellipsis: true },
            {
              title: "Measures",
              dataIndex: "measure_ids",
              render: (ids) => <Tag>{(ids || []).length} measures</Tag>,
            },
          ]}
          pagination={{ pageSize: 10 }}
        />
      ),
    },
  ];

  return (
    <div style={{ padding: 16 }}>
      {/* Stats */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        {[
          { title: "Total Measures", value: stats.totalMeasures },
          { title: "Passed", value: stats.passedMeasures, valueStyle: { color: "#52c41a" } },
          { title: "Failed", value: stats.failedMeasures, valueStyle: { color: "#ff4d4f" } },
          { title: "Executed %", value: `${stats.executedPercent}%`, valueStyle: { color: "#1677ff" } },
        ].map(({ title, value, valueStyle }) => (
          <Col key={title} span={6}>
            <Card size="small">
              <Statistic title={title} value={value} valueStyle={valueStyle} />
            </Card>
          </Col>
        ))}
      </Row>

      <Tabs items={tabItems} />

      {/* Create Modal */}
      <MeasureFormModal
        open={modalOpen}
        title="New Verification Measure"
        onOk={handleCreate}
        onCancel={() => setModalOpen(false)}
      />

      {/* Edit Modal */}
      <MeasureFormModal
        open={!!editingMeasure}
        title={`Edit ${editingMeasure?.id}`}
        initialValues={editingMeasure}
        onOk={handleEdit}
        onCancel={() => setEditingMeasure(null)}
      />

      {/* Execute Modal */}
      <ExecuteModal
        open={!!executeTarget}
        measure={executeTarget}
        onOk={handleExecute}
        onCancel={() => setExecuteTarget(null)}
      />
    </div>
  );
}
