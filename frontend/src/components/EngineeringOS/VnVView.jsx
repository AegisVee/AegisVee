import React, { useState, useEffect, useCallback } from 'react';
import {
  Typography,
  Button,
  Table,
  Tag,
  Badge,
  Select,
  Space,
  Popconfirm,
  App,
  Tooltip,
  Empty,
} from 'antd';
import {
  PlusOutlined,
  CheckCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  ThunderboltOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { api } from '../../services/api';
import VnVRuleEditor from './VnVRuleEditor';

const { Title } = Typography;

const STATUS_CONFIG = {
  verified: { color: '#22C55E', label: 'Verified' },
  not_verified: { color: '#EF4444', label: 'Not Verified' },
  error: { color: '#F59E0B', label: 'Error' },
  na: { color: '#94A3B8', label: 'N/A' },
};

const VnVView = ({ projectId }) => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [checkingAll, setCheckingAll] = useState(false);
  const [checkingRuleId, setCheckingRuleId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);

  const { message } = App.useApp();

  const loadRules = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const data = await api.getVnVRules(projectId);
      setRules(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load V&V rules:', err);
      setRules([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  const handleCheckAll = async () => {
    setCheckingAll(true);
    try {
      await api.checkAllVnVRules(projectId);
      message.success('All rules checked');
      await loadRules();
    } catch (err) {
      message.error('Failed to check all rules');
    } finally {
      setCheckingAll(false);
    }
  };

  const handleCheckSingle = async (ruleId) => {
    setCheckingRuleId(ruleId);
    try {
      await api.checkVnVRule(projectId, ruleId);
      message.success('Rule checked');
      await loadRules();
    } catch (err) {
      message.error('Failed to check rule');
    } finally {
      setCheckingRuleId(null);
    }
  };

  const handleDelete = async (ruleId) => {
    try {
      await api.deleteVnVRule(projectId, ruleId);
      message.success('Rule deleted');
      await loadRules();
    } catch (err) {
      message.error('Failed to delete rule');
    }
  };

  const handleEdit = (rule) => {
    setEditingRule(rule);
    setEditorOpen(true);
  };

  const handleCreate = () => {
    setEditingRule(null);
    setEditorOpen(true);
  };

  const handleEditorClose = () => {
    setEditorOpen(false);
    setEditingRule(null);
  };

  const handleSaved = () => {
    handleEditorClose();
    loadRules();
  };

  const filteredRules =
    statusFilter === 'all'
      ? rules
      : rules.filter((r) => r.status === statusFilter);

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      ellipsis: true,
      render: (id) => (
        <Typography.Text code style={{ fontSize: 12 }}>
          {id}
        </Typography.Text>
      ),
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: 'Requirement',
      dataIndex: 'requirement_id',
      key: 'requirement_id',
      width: 140,
      ellipsis: true,
      render: (val) =>
        val ? <Tag>{val}</Tag> : <Typography.Text type="secondary">--</Typography.Text>,
    },
    {
      title: 'Block',
      dataIndex: 'block_id',
      key: 'block_id',
      width: 120,
      ellipsis: true,
      render: (val) =>
        val ? <Tag>{val}</Tag> : <Typography.Text type="secondary">--</Typography.Text>,
    },
    {
      title: 'Formula',
      dataIndex: 'formula',
      key: 'formula',
      width: 240,
      ellipsis: true,
      render: (formula) =>
        formula ? (
          <Tooltip title={formula}>
            <Typography.Text
              code
              style={{ fontSize: 12, maxWidth: 220, display: 'inline-block' }}
              ellipsis
            >
              {formula}
            </Typography.Text>
          </Tooltip>
        ) : (
          <Typography.Text type="secondary">--</Typography.Text>
        ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => {
        const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.na;
        return <Badge color={cfg.color} text={cfg.label} />;
      },
    },
    {
      title: 'Method',
      dataIndex: 'method',
      key: 'method',
      width: 110,
      render: (method) =>
        method ? (
          <Tag style={{ textTransform: 'capitalize' }}>{method}</Tag>
        ) : (
          <Typography.Text type="secondary">--</Typography.Text>
        ),
    },
    {
      title: 'Last Checked',
      dataIndex: 'last_checked',
      key: 'last_checked',
      width: 160,
      render: (val) =>
        val ? (
          <Typography.Text style={{ fontSize: 12 }}>
            {new Date(val).toLocaleString()}
          </Typography.Text>
        ) : (
          <Typography.Text type="secondary">Never</Typography.Text>
        ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 140,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Edit">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Check">
            <Button
              type="text"
              size="small"
              icon={<ThunderboltOutlined />}
              loading={checkingRuleId === record.id}
              onClick={() => handleCheckSingle(record.id)}
            />
          </Tooltip>
          <Popconfirm
            title="Delete this rule?"
            description="This action cannot be undone."
            onConfirm={() => handleDelete(record.id)}
            okText="Delete"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Delete">
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <Space align="center" size="middle">
          <Title level={4} style={{ margin: 0 }}>
            V&V Activities
          </Title>
          <Badge
            count={filteredRules.length}
            showZero
            style={{ backgroundColor: '#0EA5E9' }}
          />
        </Space>

        <Space size="small" wrap>
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 160 }}
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'verified', label: 'Verified' },
              { value: 'not_verified', label: 'Not Verified' },
            ]}
          />
          <Button
            icon={<ReloadOutlined />}
            loading={checkingAll}
            onClick={handleCheckAll}
          >
            Check All
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
            style={{ backgroundColor: '#0EA5E9', borderColor: '#0EA5E9' }}
          >
            + Create Rule
          </Button>
        </Space>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        dataSource={filteredRules}
        rowKey="id"
        loading={loading}
        size="middle"
        scroll={{ x: 1200 }}
        pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (t) => `${t} rules` }}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span>
                  No V&V rules defined. Click <strong>+ Create Rule</strong> to add automated
                  verification.
                </span>
              }
            />
          ),
        }}
        style={{ flex: 1 }}
      />

      {/* Editor Modal */}
      <VnVRuleEditor
        open={editorOpen}
        onClose={handleEditorClose}
        rule={editingRule}
        projectId={projectId}
        onSaved={handleSaved}
      />
    </div>
  );
};

export default VnVView;
