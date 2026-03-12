import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Drawer,
  Tabs,
  Tag,
  Badge,
  Input,
  Select,
  Button,
  Descriptions,
  Table,
  Progress,
  Segmented,
  Typography,
  Space,
  Divider,
  Tooltip,
  Card,
  Empty,
} from 'antd';
import {
  CloseOutlined,
  EditOutlined,
  CheckOutlined,
  PlusOutlined,
  SendOutlined,
  LinkOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';

const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_OPTIONS = ['Draft', 'In Review', 'Approved', 'Verified', 'Rejected'];
const STATUS_COLORS = {
  Draft: '#94A3B8',
  'In Review': '#F59E0B',
  Approved: '#22C55E',
  Verified: '#0EA5E9',
  Rejected: '#EF4444',
};

const PRIORITY_OPTIONS = ['critical', 'high', 'medium', 'low'];
const PRIORITY_COLORS = {
  critical: '#EF4444',
  high: '#F97316',
  medium: '#3B82F6',
  low: '#22C55E',
};

const PRIMARY_COLOR = '#0EA5E9';

// ---------------------------------------------------------------------------
// Helper: format a date string for display
// ---------------------------------------------------------------------------
const formatDate = (dateStr) => {
  if (!dateStr) return '--';
  try {
    return new Date(dateStr).toLocaleString();
  } catch {
    return dateStr;
  }
};

// ---------------------------------------------------------------------------
// Helper: short display ID for a requirement
// ---------------------------------------------------------------------------
const shortId = (id) => {
  if (!id) return '';
  // If it already looks like REQ-xx, return as-is
  if (/^REQ-/i.test(id)) return id;
  // Take last few chars for a short reference
  const tail = id.replace(/-/g, '').slice(-4);
  return `REQ-${tail}`;
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Editable inline text */
const EditableText = ({ value, onChange, multiline = false, placeholder = '' }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? '');

  useEffect(() => {
    setDraft(value ?? '');
  }, [value]);

  const commit = () => {
    setEditing(false);
    if (draft !== value) {
      onChange?.(draft);
    }
  };

  if (editing) {
    const Component = multiline ? TextArea : Input;
    return (
      <Component
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onPressEnter={multiline ? undefined : commit}
        placeholder={placeholder}
        autoSize={multiline ? { minRows: 2, maxRows: 6 } : undefined}
        style={{ width: '100%' }}
      />
    );
  }

  return (
    <div
      onClick={() => setEditing(true)}
      style={{
        cursor: 'pointer',
        padding: '4px 8px',
        borderRadius: 4,
        border: '1px solid transparent',
        transition: 'border-color 0.2s',
        minHeight: multiline ? 48 : 'auto',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#E2E8F0';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'transparent';
      }}
    >
      {value ? (
        <Text style={multiline ? { whiteSpace: 'pre-wrap', color: '#334155' } : { fontWeight: 600, fontSize: 18, color: '#0F172A' }}>
          {value}
        </Text>
      ) : (
        <Text type="secondary" italic>{placeholder || 'Click to edit'}</Text>
      )}
      <EditOutlined style={{ marginLeft: 8, color: '#94A3B8', fontSize: 12 }} />
    </div>
  );
};

/** Status badge dot */
const StatusBadge = ({ status }) => (
  <Badge
    color={STATUS_COLORS[status] || '#94A3B8'}
    text={<Text style={{ color: STATUS_COLORS[status] || '#94A3B8', fontWeight: 500 }}>{status}</Text>}
  />
);

/** Priority tag */
const PriorityTag = ({ priority }) => {
  const color = PRIORITY_COLORS[priority] || '#3B82F6';
  return (
    <Tag
      style={{
        color,
        borderColor: color,
        background: `${color}10`,
        textTransform: 'capitalize',
        fontWeight: 500,
      }}
    >
      {priority}
    </Tag>
  );
};

// ---------------------------------------------------------------------------
// Tab: Overview
// ---------------------------------------------------------------------------
const OverviewTab = ({ requirement, requirements, onChange }) => {
  const [tagInput, setTagInput] = useState('');
  const [tagInputVisible, setTagInputVisible] = useState(false);

  const parent = useMemo(
    () => requirements?.find((r) => r.id === requirement?.parent_id),
    [requirements, requirement?.parent_id]
  );

  const children = useMemo(
    () => requirements?.filter((r) => r.parent_id === requirement?.id) || [],
    [requirements, requirement?.id]
  );

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !(requirement.tags || []).includes(tag)) {
      onChange?.({ tags: [...(requirement.tags || []), tag] });
    }
    setTagInput('');
    setTagInputVisible(false);
  };

  const handleRemoveTag = (removed) => {
    onChange?.({ tags: (requirement.tags || []).filter((t) => t !== removed) });
  };

  const engineeringColumns = [
    { title: 'Name', dataIndex: 'name', key: 'name', width: 140 },
    { title: 'Value', dataIndex: 'value', key: 'value', width: 90, render: (v) => v ?? '--' },
    { title: 'Unit', dataIndex: 'unit', key: 'unit', width: 70 },
    { title: 'Margin%', dataIndex: 'margin_percent', key: 'margin_percent', width: 80, render: (v) => (v != null ? `${v}%` : '--') },
    { title: 'Worst Case', dataIndex: 'worst_case', key: 'worst_case', width: 100, render: (v) => v ?? '--' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Metadata fields */}
      <Descriptions column={1} size="small" bordered labelStyle={{ width: 120, background: '#F8FAFC', fontWeight: 500, color: '#475569' }}>
        <Descriptions.Item label="Status">
          <Select
            value={requirement?.status || 'Draft'}
            onChange={(val) => onChange?.({ status: val })}
            style={{ width: '100%' }}
            size="small"
            options={STATUS_OPTIONS.map((s) => ({
              value: s,
              label: <StatusBadge status={s} />,
            }))}
          />
        </Descriptions.Item>

        <Descriptions.Item label="Priority">
          <Select
            value={requirement?.priority || 'medium'}
            onChange={(val) => onChange?.({ priority: val })}
            style={{ width: '100%' }}
            size="small"
            options={PRIORITY_OPTIONS.map((p) => ({
              value: p,
              label: <PriorityTag priority={p} />,
            }))}
          />
        </Descriptions.Item>

        <Descriptions.Item label="Owner">
          <Input
            size="small"
            value={requirement?.assignee || ''}
            placeholder="Unassigned"
            onChange={(e) => onChange?.({ assignee: e.target.value })}
            style={{ width: '100%' }}
          />
        </Descriptions.Item>

        <Descriptions.Item label="Type">
          <Text style={{ textTransform: 'capitalize' }}>{requirement?.req_type || 'functional'}</Text>
        </Descriptions.Item>

        <Descriptions.Item label="Level">
          <Text>{requirement?.level_label || '--'}</Text>
        </Descriptions.Item>

        <Descriptions.Item label="Tags">
          <Space size={4} wrap>
            {(requirement?.tags || []).map((tag) => (
              <Tag key={tag} closable onClose={() => handleRemoveTag(tag)}>
                {tag}
              </Tag>
            ))}
            {tagInputVisible ? (
              <Input
                autoFocus
                size="small"
                style={{ width: 100 }}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onBlur={handleAddTag}
                onPressEnter={handleAddTag}
              />
            ) : (
              <Tag
                onClick={() => setTagInputVisible(true)}
                style={{ borderStyle: 'dashed', cursor: 'pointer' }}
              >
                <PlusOutlined /> Add
              </Tag>
            )}
          </Space>
        </Descriptions.Item>

        <Descriptions.Item label="Parent">
          {parent ? (
            <a style={{ color: PRIMARY_COLOR }}>
              {shortId(parent.id)} - {parent.title}
            </a>
          ) : (
            <Text type="secondary">None</Text>
          )}
        </Descriptions.Item>

        <Descriptions.Item label="Children">
          {children.length > 0 ? (
            <Space direction="vertical" size={2} style={{ width: '100%' }}>
              {children.map((c) => (
                <Text key={c.id} style={{ color: PRIMARY_COLOR, cursor: 'pointer' }}>
                  {shortId(c.id)} - {c.title}
                </Text>
              ))}
            </Space>
          ) : (
            <Text type="secondary">None</Text>
          )}
        </Descriptions.Item>

        <Descriptions.Item label="Created">
          <Text type="secondary">{formatDate(requirement?.created_at)}</Text>
        </Descriptions.Item>

        <Descriptions.Item label="Updated">
          <Text type="secondary">{formatDate(requirement?.updated_at)}</Text>
        </Descriptions.Item>
      </Descriptions>

      {/* Engineering Values */}
      {(requirement?.engineering_values || []).length > 0 && (
        <div>
          <Text strong style={{ display: 'block', marginBottom: 8, color: '#0F172A' }}>
            Engineering Values
          </Text>
          <Table
            dataSource={requirement.engineering_values}
            columns={engineeringColumns}
            rowKey={(r) => r.id || r.name}
            size="small"
            pagination={false}
            bordered
            style={{ background: '#fff' }}
          />
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Tab: Steps
// ---------------------------------------------------------------------------
const StepsTab = ({ requirement, onChange }) => {
  const steps = useMemo(() => {
    const raw = requirement?.test_steps || '';
    if (!raw.trim()) return [];
    return raw
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((text, idx) => ({
        key: idx,
        text: text.replace(/^\d+[\.\)\-]\s*/, ''),
        checked: false,
        verdict: 'NA',
      }));
  }, [requirement?.test_steps]);

  const [stepStates, setStepStates] = useState(steps);

  useEffect(() => {
    setStepStates(steps);
  }, [steps]);

  const updateStep = (idx, patch) => {
    setStepStates((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, ...patch } : s))
    );
  };

  if (stepStates.length === 0) {
    return <Empty description="No test steps defined" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {stepStates.map((step, idx) => (
        <div
          key={idx}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 12px',
            background: step.checked ? '#F0FDF4' : '#FAFAFA',
            borderRadius: 6,
            border: '1px solid #E2E8F0',
          }}
        >
          <input
            type="checkbox"
            checked={step.checked}
            onChange={(e) => updateStep(idx, { checked: e.target.checked })}
            style={{ accentColor: PRIMARY_COLOR, width: 16, height: 16, cursor: 'pointer' }}
          />
          <Text
            style={{
              flex: 1,
              textDecoration: step.checked ? 'line-through' : 'none',
              color: step.checked ? '#94A3B8' : '#334155',
            }}
          >
            {idx + 1}. {step.text}
          </Text>
          <Segmented
            size="small"
            options={['Pass', 'Fail', 'NA']}
            value={step.verdict}
            onChange={(val) => updateStep(idx, { verdict: val })}
            style={{ flexShrink: 0 }}
          />
        </div>
      ))}

      {requirement?.expected_result && (
        <div style={{ marginTop: 12, padding: '10px 14px', background: '#F0F9FF', borderRadius: 6, border: `1px solid ${PRIMARY_COLOR}30` }}>
          <Text strong style={{ color: PRIMARY_COLOR, display: 'block', marginBottom: 4 }}>
            Expected Result
          </Text>
          <Text style={{ color: '#334155' }}>{requirement.expected_result}</Text>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Tab: Runs
// ---------------------------------------------------------------------------
const MOCK_RUNS = [
  { run: 1, owner: 'System', status: 'Passed', date: '2026-03-10T14:30:00Z', progress: 100 },
  { run: 2, owner: 'CI Pipeline', status: 'Running', date: '2026-03-11T09:00:00Z', progress: 65 },
];

const RunsTab = ({ requirement, onRunClick }) => {
  const columns = [
    {
      title: 'Run #',
      dataIndex: 'run',
      key: 'run',
      width: 70,
      render: (v) => <Text strong>#{v}</Text>,
    },
    { title: 'Owner', dataIndex: 'owner', key: 'owner', width: 110 },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s) => {
        const color = s === 'Passed' ? '#22C55E' : s === 'Failed' ? '#EF4444' : '#F59E0B';
        return <Badge color={color} text={s} />;
      },
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 130,
      render: (d) => formatDate(d),
    },
    {
      title: 'Progress',
      dataIndex: 'progress',
      key: 'progress',
      width: 120,
      render: (p) => <Progress percent={p} size="small" strokeColor={PRIMARY_COLOR} />,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="primary" icon={<PlusOutlined />} size="small" style={{ background: PRIMARY_COLOR, borderColor: PRIMARY_COLOR }}>
          New Run
        </Button>
      </div>
      <Table
        dataSource={MOCK_RUNS}
        columns={columns}
        rowKey="run"
        size="small"
        pagination={false}
        onRow={(record) => ({
          onClick: () => onRunClick?.(record),
          style: { cursor: 'pointer' },
        })}
      />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Tab: Test Plans
// ---------------------------------------------------------------------------
const TestPlansTab = ({ requirement }) => {
  const ids = requirement?.linked_test_ids || requirement?.linkedTestIds || [];

  if (ids.length === 0) {
    return <Empty description="No linked test plans" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {ids.map((tpId) => (
        <Card
          key={tpId}
          size="small"
          hoverable
          style={{ borderLeft: `3px solid ${PRIMARY_COLOR}` }}
        >
          <Space>
            <LinkOutlined style={{ color: PRIMARY_COLOR }} />
            <Text>{tpId}</Text>
          </Space>
        </Card>
      ))}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Tab: Requirements (parent + children)
// ---------------------------------------------------------------------------
const RequirementsTab = ({ requirement, requirements }) => {
  const parent = useMemo(
    () => requirements?.find((r) => r.id === requirement?.parent_id),
    [requirements, requirement?.parent_id]
  );

  const children = useMemo(
    () => requirements?.filter((r) => r.parent_id === requirement?.id) || [],
    [requirements, requirement?.id]
  );

  const ReqCard = ({ req, label }) => (
    <Card
      size="small"
      hoverable
      style={{ borderLeft: `3px solid ${PRIMARY_COLOR}`, cursor: 'pointer' }}
    >
      <Space direction="vertical" size={2} style={{ width: '100%' }}>
        <Space>
          {label && (
            <Tag color={label === 'Parent' ? 'blue' : 'cyan'} style={{ fontSize: 11 }}>
              {label === 'Parent' ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {label}
            </Tag>
          )}
          <Text strong style={{ color: PRIMARY_COLOR }}>{shortId(req.id)}</Text>
        </Space>
        <Text>{req.title || 'Untitled'}</Text>
      </Space>
    </Card>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Text strong style={{ color: '#475569' }}>Parent</Text>
      {parent ? (
        <ReqCard req={parent} label="Parent" />
      ) : (
        <Text type="secondary">No parent requirement</Text>
      )}

      <Divider style={{ margin: '8px 0' }} />

      <Text strong style={{ color: '#475569' }}>Children ({children.length})</Text>
      {children.length > 0 ? (
        children.map((c) => <ReqCard key={c.id} req={c} label="Child" />)
      ) : (
        <Text type="secondary">No child requirements</Text>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Tab: Dependencies
// ---------------------------------------------------------------------------
const DependenciesTab = ({ requirement }) => {
  const apis = requirement?.linked_apis || requirement?.linkedApis || [];
  const testIds = requirement?.linked_test_ids || requirement?.linkedTestIds || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <Text strong style={{ display: 'block', marginBottom: 8, color: '#475569' }}>
          <ArrowUpOutlined style={{ marginRight: 4 }} />
          Linked APIs
        </Text>
        {apis.length > 0 ? (
          <Space wrap>
            {apis.map((a) => (
              <Tag key={a} color="geekblue">{a}</Tag>
            ))}
          </Space>
        ) : (
          <Text type="secondary">None</Text>
        )}
      </div>

      <div>
        <Text strong style={{ display: 'block', marginBottom: 8, color: '#475569' }}>
          <ArrowDownOutlined style={{ marginRight: 4 }} />
          Linked Test IDs
        </Text>
        {testIds.length > 0 ? (
          <Space wrap>
            {testIds.map((t) => (
              <Tag key={t} color="cyan">{t}</Tag>
            ))}
          </Space>
        ) : (
          <Text type="secondary">None</Text>
        )}
      </div>

      <Divider />
      <Text type="secondary" italic>
        Full upstream/downstream traceability view coming soon.
      </Text>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main Drawer
// ---------------------------------------------------------------------------
const RequirementDetailDrawer = ({
  open,
  onClose,
  requirement,
  requirements = [],
  projectId,
  onSave,
  onRefresh,
  onRunClick,
}) => {
  const [localReq, setLocalReq] = useState(requirement);
  const [comment, setComment] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  // Sync local state when requirement prop changes
  useEffect(() => {
    setLocalReq(requirement);
    setActiveTab('overview');
  }, [requirement]);

  const handleFieldChange = useCallback(
    (patch) => {
      setLocalReq((prev) => {
        const updated = { ...prev, ...patch };
        onSave?.(updated);
        return updated;
      });
    },
    [onSave]
  );

  const handleSendComment = () => {
    if (!comment.trim()) return;
    // Future: persist comment
    setComment('');
  };

  if (!localReq) return null;

  const tabItems = [
    {
      key: 'overview',
      label: 'Overview',
      children: (
        <OverviewTab
          requirement={localReq}
          requirements={requirements}
          onChange={handleFieldChange}
        />
      ),
    },
    {
      key: 'steps',
      label: 'Steps',
      children: <StepsTab requirement={localReq} onChange={handleFieldChange} />,
    },
    {
      key: 'runs',
      label: 'Runs',
      children: <RunsTab requirement={localReq} onRunClick={onRunClick} />,
    },
    {
      key: 'testplans',
      label: 'Test Plans',
      children: <TestPlansTab requirement={localReq} />,
    },
    {
      key: 'requirements',
      label: 'Requirements',
      children: <RequirementsTab requirement={localReq} requirements={requirements} />,
    },
    {
      key: 'dependencies',
      label: 'Dependencies',
      children: <DependenciesTab requirement={localReq} />,
    },
  ];

  return (
    <Drawer
      open={open}
      onClose={onClose}
      placement="right"
      width={560}
      closable={false}
      styles={{
        header: { display: 'none' },
        body: {
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        },
      }}
    >
      {/* ---- Header ---- */}
      <div
        style={{
          padding: '16px 20px 0 20px',
          borderBottom: '1px solid #F1F5F9',
          flexShrink: 0,
        }}
      >
        {/* Top row: close + req ID */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <Button
            type="text"
            icon={<CloseOutlined />}
            onClick={onClose}
            size="small"
            style={{ color: '#64748B' }}
          />
          <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
            {shortId(localReq.id)}
          </Text>
          <div style={{ flex: 1 }} />
          <StatusBadge status={localReq.status || 'Draft'} />
        </div>

        {/* Title (editable) */}
        <div style={{ marginBottom: 4 }}>
          <EditableText
            value={localReq.title}
            onChange={(title) => handleFieldChange({ title })}
            placeholder="Requirement title"
          />
        </div>

        {/* Description (editable) */}
        <div style={{ marginBottom: 12 }}>
          <EditableText
            value={localReq.description}
            onChange={(description) => handleFieldChange({ description })}
            multiline
            placeholder="Add a description..."
          />
        </div>
      </div>

      {/* ---- Tabs ---- */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0 20px' }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="small"
          style={{ height: '100%' }}
          tabBarStyle={{ marginBottom: 12, borderBottom: '1px solid #F1F5F9' }}
        />
      </div>

      {/* ---- Bottom comment bar ---- */}
      <div
        style={{
          padding: '12px 20px',
          borderTop: '1px solid #F1F5F9',
          background: '#FAFAFA',
          flexShrink: 0,
          display: 'flex',
          gap: 8,
          alignItems: 'flex-end',
        }}
      >
        <Input.TextArea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Write a comment..."
          autoSize={{ minRows: 1, maxRows: 3 }}
          style={{ flex: 1, borderRadius: 6 }}
          onPressEnter={(e) => {
            if (!e.shiftKey) {
              e.preventDefault();
              handleSendComment();
            }
          }}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSendComment}
          disabled={!comment.trim()}
          style={{ background: PRIMARY_COLOR, borderColor: PRIMARY_COLOR, borderRadius: 6 }}
        />
      </div>
    </Drawer>
  );
};

export default RequirementDetailDrawer;
