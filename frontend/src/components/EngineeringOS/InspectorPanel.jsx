import React, { useState, useEffect } from 'react';
import { Drawer, Form, Input, Select, Button, Typography, Space, Divider } from 'antd';
import { CloseOutlined, RobotOutlined } from '@ant-design/icons';
import AegisEditor from '../AegisEditor';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const InspectorPanel = ({ selectedNode, onClose, onUpdate, onGenerateTestPlan }) => {
    const [form] = Form.useForm();
    const [desc, setDesc] = useState('');

    useEffect(() => {
        if (selectedNode) {
            form.setFieldsValue({
                id: selectedNode.data.id || selectedNode.id,
                title: selectedNode.data.title || selectedNode.data.label || 'Untitled',
                type: selectedNode.type,
                status: selectedNode.data.status || 'Draft',
            });
            setDesc(selectedNode.data.description || '');
        }
    }, [selectedNode, form]);

    const handleSave = () => {
        form.validateFields().then(values => {
            const updatedData = {
                ...selectedNode.data,
                id: values.id,
                title: values.title,
                label: values.title, // Sync label/title
                status: values.status,
                description: desc
            };
            onUpdate(selectedNode.id, updatedData);
        });
    };

    if (!selectedNode) return null;

    return (
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-[#1f2937] border-l border-gray-700 shadow-2xl z-40 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-[#111827]">
                <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${selectedNode.type === 'requirement' ? 'bg-blue-500' :
                            selectedNode.type === 'system' ? 'bg-indigo-500' : 'bg-gray-500'
                        }`} />
                    <span className="font-bold text-gray-200">Inspector</span>
                </div>
                <Button type="text" icon={<CloseOutlined className="text-gray-400" />} onClick={onClose} />
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <Form form={form} layout="vertical" onFinish={handleSave}>
                    <Form.Item label={<span className="text-gray-400">ID</span>} name="id">
                        <Input className="bg-gray-800 border-gray-600 text-gray-200" disabled />
                    </Form.Item>

                    <Form.Item label={<span className="text-gray-400">Title</span>} name="title">
                        <Input className="bg-gray-800 border-gray-600 text-gray-200" onChange={handleSave} />
                    </Form.Item>

                    <Form.Item label={<span className="text-gray-400">Type</span>} name="type">
                        <Input className="bg-gray-800 border-gray-600 text-gray-400" disabled />
                    </Form.Item>

                    <Form.Item label={<span className="text-gray-400">Status</span>} name="status">
                        <Select dropdownStyle={{ backgroundColor: '#1f2937' }} className="bg-gray-800 text-gray-200" onChange={handleSave}>
                            <Option value="Draft">Draft</Option>
                            <Option value="Verified">Verified</Option>
                            <Option value="In Progress">In Progress</Option>
                            <Option value="Deprecated">Deprecated</Option>
                        </Select>
                    </Form.Item>
                </Form>

                <Divider className="bg-gray-700" />

                <div className="mb-2 text-gray-400 text-sm">Description (Markdown)</div>
                <div className="h-64 border border-gray-600 rounded overflow-hidden">
                    <AegisEditor value={desc} onChange={(val) => { setDesc(val); handleSave(); }} language="markdown" />
                </div>

                {selectedNode.type === 'requirement' && (
                    <div className="mt-8">
                        <Button
                            type="primary"
                            icon={<RobotOutlined />}
                            block
                            className="bg-gradient-to-r from-blue-600 to-cyan-500 border-0"
                            onClick={onGenerateTestPlan}
                        >
                            AI: Generate Test Plan
                        </Button>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-700 bg-[#111827] text-xs text-gray-500 text-center">
                {selectedNode.id}
            </div>
        </div>
    );
};

export default InspectorPanel;
