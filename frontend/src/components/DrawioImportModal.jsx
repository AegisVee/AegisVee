import React, { useState } from 'react';
import {
    Modal, Upload, Button, Table, Input, Tag, Space,
    Typography, Alert, Spin, notification
} from 'antd';
import { InboxOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { api } from '../services/api';

const { Dragger } = Upload;
const { Text } = Typography;

/**
 * DrawioImportModal
 * -----------------
 * Upload a .drawio file → preview AI-generated requirement drafts → confirm import.
 *
 * Props:
 *   open         : boolean
 *   onClose      : () => void
 *   onImported   : (requirements: array) => void  — called after confirmed import
 */
export default function DrawioImportModal({ open, onClose, onImported, projectId }) {
    const [step, setStep] = useState('upload');   // 'upload' | 'preview' | 'importing'
    const [parsing, setParsing] = useState(false);
    const [preview, setPreview] = useState([]);   // requirements_preview from backend
    const [blocks, setBlocks] = useState([]);

    const handleUpload = async ({ file }) => {
        if (!file.name.endsWith('.drawio')) {
            notification.error({ message: 'Only .drawio files are supported' });
            return;
        }
        setParsing(true);
        try {
            const result = await api.importProjectDrawio(projectId, file);
            if (!result.blocks || result.blocks.length === 0) {
                notification.warning({ message: 'No labelled blocks found in the diagram.' });
                setParsing(false);
                return;
            }
            // Add editable state to each preview row
            setPreview(result.requirements_preview.map(r => ({ ...r, _editing: false })));
            setBlocks(result.blocks);
            setStep('preview');
        } catch (e) {
            notification.error({ message: `Parse failed: ${e.message}` });
        } finally {
            setParsing(false);
        }
    };

    const handleDescriptionChange = (blockId, value) => {
        setPreview(prev => prev.map(r => r.block_id === blockId ? { ...r, description: value } : r));
    };

    const handleConfirm = async () => {
        setStep('importing');
        try {
            const result = await api.confirmProjectDrawioImport(projectId, preview);
            notification.success({
                message: `Imported ${result.imported_count} requirement(s) from draw.io`,
                icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />
            });
            if (onImported) onImported(result.requirements);
            handleClose();
        } catch (e) {
            notification.error({ message: `Import failed: ${e.message}` });
            setStep('preview');
        }
    };

    const handleClose = () => {
        setStep('upload');
        setPreview([]);
        setBlocks([]);
        onClose();
    };

    const previewColumns = [
        {
            title: 'Block',
            dataIndex: 'block_label',
            width: 150,
            render: (label) => <Tag color="blue">{label}</Tag>
        },
        {
            title: 'AI-Generated Requirement (editable)',
            dataIndex: 'description',
            render: (text, record) => (
                <Input.TextArea
                    value={text}
                    autoSize={{ minRows: 2, maxRows: 4 }}
                    onChange={e => handleDescriptionChange(record.block_id, e.target.value)}
                />
            )
        }
    ];

    const footer = step === 'preview' ? (
        <Space>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="primary" onClick={handleConfirm} loading={step === 'importing'}>
                Import {preview.length} Requirement{preview.length !== 1 ? 's' : ''}
            </Button>
        </Space>
    ) : (
        <Button onClick={handleClose}>Close</Button>
    );

    return (
        <Modal
            title="Import from draw.io System Block Diagram"
            open={open}
            onCancel={handleClose}
            footer={footer}
            width={860}
            destroyOnClose
        >
            {step === 'upload' && (
                <Spin spinning={parsing} tip="Parsing diagram and generating requirements...">
                    <Alert
                        type="info"
                        showIcon
                        style={{ marginBottom: 16 }}
                        message="Supported format: uncompressed .drawio (mxGraph XML)"
                        description="Each labelled block in the diagram will generate one AI-drafted requirement. You can edit them before importing."
                    />
                    <Dragger
                        accept=".drawio"
                        multiple={false}
                        showUploadList={false}
                        customRequest={handleUpload}
                        style={{ padding: '20px 0' }}
                    >
                        <p className="ant-upload-drag-icon">
                            <InboxOutlined />
                        </p>
                        <p className="ant-upload-text">Click or drag a .drawio file here</p>
                        <p className="ant-upload-hint">
                            Export your diagram from draw.io desktop via File → Export as → XML (uncompressed)
                        </p>
                    </Dragger>
                </Spin>
            )}

            {step === 'preview' && (
                <>
                    <Alert
                        type="success"
                        showIcon
                        style={{ marginBottom: 12 }}
                        message={`Found ${blocks.length} block(s). Review and edit the generated requirements below.`}
                    />
                    <Table
                        dataSource={preview}
                        columns={previewColumns}
                        rowKey="block_id"
                        pagination={false}
                        size="small"
                        scroll={{ y: 400 }}
                    />
                </>
            )}

            {step === 'importing' && (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <Spin size="large" tip="Importing requirements..." />
                </div>
            )}
        </Modal>
    );
}
