/**
 * RequirementsView — SYS.1 + SYS.2 Requirements Management View
 *
 * Displays:
 * - RequirementNode table with inline editing
 * - RequirementAttribute side panel
 * - Filters by level (stakeholder/system), status, req_type
 * - AI analysis trigger (delegates to existing RAG flow)
 */

import React, { useState, useMemo } from "react";
import {
  Table,
  Button,
  Space,
  Tag,
  Select,
  Drawer,
  Form,
  Input,
  Modal,
  Tooltip,
  Statistic,
  Row,
  Col,
  Card,
  Typography,
  Badge,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  LinkOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import { useRequirements } from "../../hooks/useRequirements";

const { Text, Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// ─── Status colors ────────────────────────────────────────────
const STATUS_COLORS = {
  Draft: "default",
  "In Review": "processing",
  Approved: "blue",
  Verified: "success",
  Rejected: "error",
};

const LEVEL_COLORS = {
  stakeholder: "purple",
  system: "blue",
};

const PRIORITY_COLORS = {
  critical: "red",
  high: "orange",
  medium: "gold",
  low: "default",
};

// ─── Requirement Form Modal ────────────────────────────────────
function RequirementFormModal({ open, initialValues, onOk, onCancel, title }) {
  const [form] = Form.useForm();

  React.useEffect(() => {
    if (open) {
      form.setFieldsValue(initialValues || {
        level: "system",
        req_type: "functional",
        status: "Draft",
        priority: "medium",
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
        <Row gutter={12}>
          <Col span={16}>
            <Form.Item label="Title" name="title" rules={[{ required: true }]}>
              <Input placeholder="Brief requirement title" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="ID" name="id">
              <Input placeholder="Auto-generated if empty" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Description" name="description" rules={[{ required: true }]}>
          <TextArea rows={3} placeholder="Full requirement statement" />
        </Form.Item>

        <Row gutter={12}>
          <Col span={6}>
            <Form.Item label="Level" name="level">
              <Select>
                <Option value="stakeholder">Stakeholder</Option>
                <Option value="system">System</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Type" name="req_type">
              <Select>
                <Option value="functional">Functional</Option>
                <Option value="non_functional">Non-Functional</Option>
                <Option value="interface">Interface</Option>
                <Option value="constraint">Constraint</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Status" name="status">
              <Select>
                {Object.keys(STATUS_COLORS).map((s) => (
                  <Option key={s} value={s}>{s}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Priority" name="priority">
              <Select>
                <Option value="critical">Critical</Option>
                <Option value="high">High</Option>
                <Option value="medium">Medium</Option>
                <Option value="low">Low</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={12}>
          <Col span={8}>
            <Form.Item label="Functional Group" name="functional_group">
              <Input placeholder="e.g. ACC, ABS, LKA" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Variant" name="variant">
              <Input placeholder="e.g. Base, Sport" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Release" name="release">
              <Input placeholder="e.g. v1.0" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Test Steps" name="testSteps">
          <TextArea rows={2} placeholder="Step-by-step test procedure" />
        </Form.Item>

        <Form.Item label="Expected Result" name="expectedResult">
          <Input placeholder="What should happen" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

// ─── Main View ────────────────────────────────────────────────
export default function RequirementsView({ projectId }) {
  const {
    requirements,
    loading,
    createRequirement,
    updateRequirement,
    deleteRequirement,
  } = useRequirements(projectId);

  const [filters, setFilters] = useState({ level: "", status: "", req_type: "" });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingReq, setEditingReq] = useState(null);

  // ─── Filtered data ─────────────────────────────────────────
  const filtered = useMemo(() => {
    return requirements.filter((r) => {
      if (filters.level && r.level !== filters.level) return false;
      if (filters.status && r.status !== filters.status) return false;
      if (filters.req_type && r.req_type !== filters.req_type) return false;
      return true;
    });
  }, [requirements, filters]);

  // ─── Stats ─────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total: requirements.length,
    verified: requirements.filter((r) => r.status === "Verified").length,
    stakeholder: requirements.filter((r) => r.level === "stakeholder").length,
    system: requirements.filter((r) => r.level === "system").length,
  }), [requirements]);

  // ─── Handlers ──────────────────────────────────────────────
  const handleCreate = async (values) => {
    await createRequirement(values);
    setModalOpen(false);
  };

  const handleEdit = async (values) => {
    await updateRequirement(editingReq.id, values);
    setEditingReq(null);
  };

  const handleDelete = (req) => {
    Modal.confirm({
      title: `Delete ${req.id}?`,
      content: req.title || req.description?.slice(0, 60),
      okType: "danger",
      onOk: () => deleteRequirement(req.id),
    });
  };

  // ─── Columns ───────────────────────────────────────────────
  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      width: 100,
      render: (id) => <Text code>{id}</Text>,
    },
    {
      title: "Title",
      dataIndex: "title",
      ellipsis: true,
      render: (title, row) => (
        <Tooltip title={row.description}>
          <Text>{title || row.description?.slice(0, 80)}</Text>
        </Tooltip>
      ),
    },
    {
      title: "Level",
      dataIndex: "level",
      width: 110,
      render: (v) => <Tag color={LEVEL_COLORS[v] || "default"}>{v}</Tag>,
    },
    {
      title: "Type",
      dataIndex: "req_type",
      width: 120,
      render: (v) => <Tag>{v}</Tag>,
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 110,
      render: (v) => <Badge status={STATUS_COLORS[v] || "default"} text={v} />,
    },
    {
      title: "Priority",
      dataIndex: "priority",
      width: 90,
      render: (v) => <Tag color={PRIORITY_COLORS[v] || "default"}>{v}</Tag>,
    },
    {
      title: "Traced",
      width: 70,
      render: (_, row) => {
        const hasLinks =
          (row.linkedTestIds?.length > 0) ||
          (row.linked_test_ids?.length > 0);
        return hasLinks ? (
          <Tag color="green" icon={<LinkOutlined />}>Yes</Tag>
        ) : (
          <Tag color="warning">None</Tag>
        );
      },
    },
    {
      title: "",
      width: 80,
      render: (_, row) => (
        <Space size={4}>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => setEditingReq(row)}
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

  return (
    <div style={{ padding: 16 }}>
      {/* Stats */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        {[
          { title: "Total", value: stats.total },
          { title: "Verified", value: stats.verified, valueStyle: { color: "#52c41a" } },
          { title: "Stakeholder", value: stats.stakeholder, valueStyle: { color: "#722ed1" } },
          { title: "System", value: stats.system, valueStyle: { color: "#1677ff" } },
        ].map(({ title, value, valueStyle }) => (
          <Col key={title} span={6}>
            <Card size="small">
              <Statistic title={title} value={value} valueStyle={valueStyle} />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Toolbar */}
      <Space style={{ marginBottom: 12 }} wrap>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setModalOpen(true)}
        >
          New Requirement
        </Button>
        <Select
          placeholder="Level"
          allowClear
          style={{ width: 140 }}
          value={filters.level || undefined}
          onChange={(v) => setFilters((f) => ({ ...f, level: v || "" }))}
        >
          <Option value="stakeholder">Stakeholder</Option>
          <Option value="system">System</Option>
        </Select>
        <Select
          placeholder="Status"
          allowClear
          style={{ width: 140 }}
          value={filters.status || undefined}
          onChange={(v) => setFilters((f) => ({ ...f, status: v || "" }))}
        >
          {Object.keys(STATUS_COLORS).map((s) => (
            <Option key={s} value={s}>{s}</Option>
          ))}
        </Select>
        <Select
          placeholder="Type"
          allowClear
          style={{ width: 160 }}
          value={filters.req_type || undefined}
          onChange={(v) => setFilters((f) => ({ ...f, req_type: v || "" }))}
        >
          {["functional", "non_functional", "interface", "constraint"].map((t) => (
            <Option key={t} value={t}>{t}</Option>
          ))}
        </Select>
      </Space>

      {/* Table */}
      <Table
        dataSource={filtered}
        columns={columns}
        rowKey="id"
        size="small"
        loading={loading}
        pagination={{ pageSize: 20, showSizeChanger: true }}
        scroll={{ x: 900 }}
      />

      {/* Create Modal */}
      <RequirementFormModal
        open={modalOpen}
        title="New Requirement"
        onOk={handleCreate}
        onCancel={() => setModalOpen(false)}
      />

      {/* Edit Modal */}
      <RequirementFormModal
        open={!!editingReq}
        title={`Edit ${editingReq?.id || ""}`}
        initialValues={editingReq}
        onOk={handleEdit}
        onCancel={() => setEditingReq(null)}
      />
    </div>
  );
}
