import React, { useState } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import { api } from '../../services/api';

const AddProjectModal = ({ visible, onClose, onSuccess }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);
            const newProject = await api.createProject(values.title);
            message.success('Project created successfully');
            form.resetFields();
            onSuccess(newProject);
            onClose();
        } catch (error) {
            console.error(error);
            message.error('Failed to create project');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title="Create New Project"
            open={visible}
            onOk={handleOk}
            onCancel={onClose}
            confirmLoading={loading}
        >
            <Form form={form} layout="vertical">
                <Form.Item
                    name="title"
                    label="Project Name"
                    rules={[{ required: true, message: 'Please enter a project name' }]}
                >
                    <Input placeholder="e.g. Braking System Module V2" />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default React.memo(AddProjectModal);
