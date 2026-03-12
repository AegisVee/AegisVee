import React, { useState, useRef, useContext, useEffect } from 'react';
import { Table, Input, InputNumber, Button, Tag, Popconfirm, Form, Space, Empty } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';

const EditableContext = React.createContext(null);

const EditableRow = ({ index, ...props }) => {
  const [form] = Form.useForm();
  return (
    <Form form={form} component={false}>
      <EditableContext.Provider value={form}>
        <tr {...props} />
      </EditableContext.Provider>
    </Form>
  );
};

const EditableCell = ({
  title,
  editable,
  inputType,
  children,
  dataIndex,
  record,
  handleSave,
  ...restProps
}) => {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef(null);
  const form = useContext(EditableContext);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editing]);

  const toggleEdit = () => {
    setEditing(true);
    form.setFieldsValue({ [dataIndex]: record[dataIndex] });
  };

  const save = async () => {
    try {
      const values = await form.validateFields();
      setEditing(false);
      handleSave({ ...record, ...values });
    } catch {
      // validation failed, keep editing
    }
  };

  let childNode = children;

  if (editable) {
    if (editing) {
      const inputProps = {
        ref: inputRef,
        onPressEnter: save,
        onBlur: save,
        size: 'small',
      };

      childNode = (
        <Form.Item style={{ margin: 0 }} name={dataIndex}>
          {inputType === 'number' ? (
            <InputNumber {...inputProps} style={{ width: '100%' }} />
          ) : (
            <Input {...inputProps} />
          )}
        </Form.Item>
      );
    } else {
      childNode = (
        <div
          className="editable-cell-value-wrap"
          style={{
            padding: '4px 8px',
            cursor: 'pointer',
            borderRadius: 4,
            minHeight: 24,
            lineHeight: '24px',
          }}
          onClick={toggleEdit}
        >
          {children}
        </div>
      );
    }
  }

  return <td {...restProps}>{childNode}</td>;
};

const EngineeringValuesTable = ({ values = [], onChange, readOnly = false }) => {
  const handleSave = (row) => {
    const newData = values.map((item) => {
      if (item.id !== row.id) return item;
      const updated = { ...item, ...row };
      const val = parseFloat(updated.value);
      const margin = parseFloat(updated.margin_percent);
      if (!isNaN(val) && !isNaN(margin)) {
        updated.worst_case = +(val * (1 + margin / 100)).toPrecision(10);
      }
      return updated;
    });
    onChange?.(newData);
  };

  const handleDelete = (id) => {
    onChange?.(values.filter((item) => item.id !== id));
  };

  const handleAdd = () => {
    const newVal = {
      id: `val-${Date.now().toString(36)}`,
      name: '',
      formula: '',
      value: 0,
      unit: '',
      display_unit: '',
      margin_percent: 0,
      worst_case: 0,
      tags: [],
      vali_type: 'float',
    };
    onChange?.([...values, newVal]);
  };

  const handleAddTag = (record) => {
    const tag = prompt('Enter tag name:');
    if (!tag || !tag.trim()) return;
    const updated = {
      ...record,
      tags: [...(record.tags || []), tag.trim()],
    };
    handleSave(updated);
  };

  const handleRemoveTag = (record, removedTag) => {
    const updated = {
      ...record,
      tags: (record.tags || []).filter((t) => t !== removedTag),
    };
    handleSave(updated);
  };

  const baseColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      width: 180,
      editable: !readOnly,
      inputType: 'text',
    },
    {
      title: 'Formula',
      dataIndex: 'formula',
      width: 160,
      editable: !readOnly,
      inputType: 'text',
      render: (text) => (
        <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{text || '-'}</span>
      ),
    },
    {
      title: 'Value',
      dataIndex: 'value',
      width: 100,
      editable: !readOnly,
      inputType: 'number',
      render: (val) => (
        <span style={{ fontFamily: 'monospace' }}>{val ?? '-'}</span>
      ),
    },
    {
      title: 'Unit',
      dataIndex: 'unit',
      width: 60,
      editable: !readOnly,
      inputType: 'text',
    },
    {
      title: 'Margin %',
      dataIndex: 'margin_percent',
      width: 90,
      editable: !readOnly,
      inputType: 'number',
      render: (val) => (val != null ? `${val}%` : '-'),
    },
    {
      title: 'Worst Case',
      dataIndex: 'worst_case',
      width: 110,
      render: (val) => (
        <span style={{ fontFamily: 'monospace', color: '#cf1322' }}>
          {val != null ? val : '-'}
        </span>
      ),
    },
    {
      title: 'Tags',
      dataIndex: 'tags',
      width: 180,
      render: (tags, record) => (
        <Space size={[0, 4]} wrap>
          {(tags || []).map((tag) => (
            <Tag
              key={tag}
              closable={!readOnly}
              onClose={(e) => {
                e.preventDefault();
                handleRemoveTag(record, tag);
              }}
              color="#0EA5E9"
              style={{ marginInlineEnd: 4 }}
            >
              {tag}
            </Tag>
          ))}
          {!readOnly && (
            <Tag
              onClick={() => handleAddTag(record)}
              style={{
                borderStyle: 'dashed',
                cursor: 'pointer',
                background: 'transparent',
              }}
            >
              <PlusOutlined /> Tag
            </Tag>
          )}
        </Space>
      ),
    },
  ];

  if (!readOnly) {
    baseColumns.push({
      title: '',
      width: 50,
      render: (_, record) => (
        <Popconfirm
          title="Delete this value?"
          onConfirm={() => handleDelete(record.id)}
          okText="Yes"
          cancelText="No"
        >
          <Button type="text" size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    });
  }

  const columns = baseColumns.map((col) => {
    if (!col.editable) return col;
    return {
      ...col,
      onCell: (record) => ({
        record,
        editable: col.editable,
        dataIndex: col.dataIndex,
        title: col.title,
        inputType: col.inputType,
        handleSave,
      }),
    };
  });

  return (
    <div style={{ width: '100%' }}>
      <Table
        components={{
          body: {
            row: EditableRow,
            cell: EditableCell,
          },
        }}
        bordered
        dataSource={values}
        columns={columns}
        rowKey="id"
        pagination={false}
        size="small"
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No engineering values defined. Click '+ Add Value' to create one."
            />
          ),
        }}
        style={{ marginBottom: 12 }}
      />
      {!readOnly && (
        <Button
          type="dashed"
          onClick={handleAdd}
          icon={<PlusOutlined />}
          style={{ width: '100%' }}
        >
          Add Value
        </Button>
      )}
    </div>
  );
};

export default EngineeringValuesTable;
