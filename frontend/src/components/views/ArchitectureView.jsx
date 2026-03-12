/**
 * ArchitectureView — SYS.3 Architecture Design View
 *
 * Displays:
 * - Architecture element list with type badges
 * - Special Characteristics panel
 * - Create/Edit/Delete architecture elements
 * Note: Full canvas visualization uses the existing GraphCanvas
 *       via the graph view tab; this view provides ASPICE data management.
 */

import React, { useState, useMemo } from "react";
import {
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  Row,
  Col,
  Card,
  Statistic,
  Typography,
  Tabs,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ApartmentOutlined,
} from "@ant-design/icons";
import { useArchitecture } from "../../hooks/useArchitecture";

const { Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const ELEMENT_TYPE_COLORS = {
  component: "blue",
  subsystem: "purple",
  interface: "cyan",
  module: "geekblue",
};

const ASPECT_COLORS = {
  static: "default",
  dynamic: "orange",
};

// ─── Element Form Modal ────────────────────────────────────────
function ElementFormModal({ open, initialValues, onOk, onCancel, title }) {
  const [form] = Form.useForm();

  React.useEffect(() => {
    if (open) {
      form.setFieldsValue(initialValues || {
        element_type: "component",
        aspect: "static",
        interfaces: [],
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
      width={600}
      okText="Save"
    >
      <Form form={form} layout="vertical" size="small">
        <Row gutter={12}>
          <Col span={16}>
            <Form.Item label="Name" name="name" rules={[{ required: true }]}>
              <Input placeholder="Component name" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="ID" name="id">
              <Input placeholder="Auto-generated" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={12}>
          <Col span={12}>
            <Form.Item label="Element Type" name="element_type">
              <Select>
                <Option value="component">Component</Option>
                <Option value="subsystem">Subsystem</Option>
                <Option value="interface">Interface</Option>
                <Option value="module">Module</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Aspect" name="aspect">
              <Select>
                <Option value="static">Static</Option>
                <Option value="dynamic">Dynamic</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Description" name="description">
          <TextArea rows={3} />
        </Form.Item>

        <Form.Item label="Behavior Type (for dynamic)" name="behavior_type">
          <Select allowClear placeholder="Optional">
            <Option value="sequence">Sequence</Option>
            <Option value="state_machine">State Machine</Option>
            <Option value="timing">Timing</Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
}

// ─── Special Char Form Modal ───────────────────────────────────
function SpecialCharModal({ open, initialValues, onOk, onCancel, title }) {
  const [form] = Form.useForm();

  React.useEffect(() => {
    if (open) {
      form.setFieldsValue(initialValues || { characteristic_type: "safety" });
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
      okText="Save"
    >
      <Form form={form} layout="vertical" size="small">
        <Form.Item label="Source Element ID" name="source_id" rules={[{ required: true }]}>
          <Input placeholder="ARCH-0001" />
        </Form.Item>
        <Form.Item label="Type" name="characteristic_type">
          <Select>
            <Option value="safety">Safety</Option>
            <Option value="performance">Performance</Option>
            <Option value="reliability">Reliability</Option>
          </Select>
        </Form.Item>
        <Form.Item label="Description" name="description" rules={[{ required: true }]}>
          <TextArea rows={3} />
        </Form.Item>
        <Form.Item label="Rationale" name="rationale">
          <TextArea rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  );
}

// ─── Main View ─────────────────────────────────────────────────
export default function ArchitectureView({ projectId }) {
  const {
    elements,
    specialCharacteristics,
    loading,
    createElement,
    updateElement,
    deleteElement,
    createSpecialCharacteristic,
    updateSpecialCharacteristic,
    deleteSpecialCharacteristic,
  } = useArchitecture(projectId);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingElem, setEditingElem] = useState(null);
  const [scModalOpen, setScModalOpen] = useState(false);
  const [editingSc, setEditingSc] = useState(null);

  // Stats
  const stats = useMemo(() => {
    const byType = {};
    elements.forEach((e) => {
      byType[e.element_type] = (byType[e.element_type] || 0) + 1;
    });
    return {
      total: elements.length,
      dynamic: elements.filter((e) => e.aspect === "dynamic").length,
      specialChars: specialCharacteristics.length,
      byType,
    };
  }, [elements, specialCharacteristics]);

  // Handlers
  const handleCreate = async (values) => {
    await createElement(values);
    setModalOpen(false);
  };

  const handleEdit = async (values) => {
    await updateElement(editingElem.id, values);
    setEditingElem(null);
  };

  const handleDelete = (elem) => {
    Modal.confirm({
      title: `Delete ${elem.id}?`,
      content: elem.name,
      okType: "danger",
      onOk: () => deleteElement(elem.id),
    });
  };

  const handleCreateSc = async (values) => {
    await createSpecialCharacteristic(values);
    setScModalOpen(false);
  };

  const handleDeleteSc = (sc) => {
    Modal.confirm({
      title: `Delete ${sc.id}?`,
      okType: "danger",
      onOk: () => deleteSpecialCharacteristic(sc.id),
    });
  };

  // Columns
  const elementColumns = [
    {
      title: "ID",
      dataIndex: "id",
      width: 100,
      render: (id) => <Text code>{id}</Text>,
    },
    {
      title: "Name",
      dataIndex: "name",
      ellipsis: true,
    },
    {
      title: "Type",
      dataIndex: "element_type",
      width: 110,
      render: (v) => (
        <Tag color={ELEMENT_TYPE_COLORS[v] || "default"}>{v}</Tag>
      ),
    },
    {
      title: "Aspect",
      dataIndex: "aspect",
      width: 90,
      render: (v) => <Tag color={ASPECT_COLORS[v]}>{v}</Tag>,
    },
    {
      title: "Description",
      dataIndex: "description",
      ellipsis: true,
    },
    {
      title: "",
      width: 80,
      render: (_, row) => (
        <Space size={4}>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => setEditingElem(row)}
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

  const scColumns = [
    {
      title: "ID",
      dataIndex: "id",
      width: 90,
      render: (id) => <Text code>{id}</Text>,
    },
    { title: "Source", dataIndex: "source_id", width: 100 },
    {
      title: "Type",
      dataIndex: "characteristic_type",
      width: 110,
      render: (v) => (
        <Tag color={v === "safety" ? "red" : v === "performance" ? "orange" : "blue"}>
          {v}
        </Tag>
      ),
    },
    { title: "Description", dataIndex: "description", ellipsis: true },
    {
      title: "",
      width: 60,
      render: (_, row) => (
        <Button
          size="small"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleDeleteSc(row)}
        />
      ),
    },
  ];

  const tabItems = [
    {
      key: "elements",
      label: `Architecture Elements (${elements.length})`,
      children: (
        <>
          {/* Stats */}
          <Row gutter={12} style={{ marginBottom: 12 }}>
            {[
              { title: "Total", value: stats.total },
              { title: "Dynamic", value: stats.dynamic, valueStyle: { color: "#fa8c16" } },
              { title: "Subsystems", value: stats.byType.subsystem || 0 },
              { title: "Interfaces", value: stats.byType.interface || 0, valueStyle: { color: "#13c2c2" } },
            ].map(({ title, value, valueStyle }) => (
              <Col key={title} span={6}>
                <Card size="small">
                  <Statistic title={title} value={value} valueStyle={valueStyle} />
                </Card>
              </Col>
            ))}
          </Row>

          <Space style={{ marginBottom: 12 }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setModalOpen(true)}
            >
              New Element
            </Button>
          </Space>

          <Table
            dataSource={elements}
            columns={elementColumns}
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
      key: "special",
      label: `Special Characteristics (${specialCharacteristics.length})`,
      children: (
        <>
          <Space style={{ marginBottom: 12 }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setScModalOpen(true)}
            >
              New Characteristic
            </Button>
          </Space>
          <Table
            dataSource={specialCharacteristics}
            columns={scColumns}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 15 }}
          />
        </>
      ),
    },
  ];

  return (
    <div style={{ padding: 16 }}>
      <Tabs items={tabItems} />

      {/* Element Form Modals */}
      <ElementFormModal
        open={modalOpen}
        title="New Architecture Element"
        onOk={handleCreate}
        onCancel={() => setModalOpen(false)}
      />
      <ElementFormModal
        open={!!editingElem}
        title={`Edit ${editingElem?.id}`}
        initialValues={editingElem}
        onOk={handleEdit}
        onCancel={() => setEditingElem(null)}
      />

      {/* Special Char Modals */}
      <SpecialCharModal
        open={scModalOpen}
        title="New Special Characteristic"
        onOk={handleCreateSc}
        onCancel={() => setScModalOpen(false)}
      />
    </div>
  );
}
