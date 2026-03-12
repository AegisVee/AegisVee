import React from 'react';
import { Modal, Typography, Button, Badge, Card, Divider } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

const TestReportModal = ({ visible, onClose, reportData }) => {
    if (!reportData) return null;

    const isPass = reportData.status === 'PASS';
    const statusColor = isPass ? '#52c41a' : '#ff4d4f';
    const StatusIcon = isPass ? CheckCircleOutlined : CloseCircleOutlined;

    const handleDownloadPDF = () => {
        window.print();
    };

    // Add print styles dynamically or assume they are global. 
    // For this component, we'll inject a style tag for simplicity in this MVP.
    React.useEffect(() => {
        const style = document.createElement('style');
        style.innerHTML = `
            @media print {
                body * {
                    visibility: hidden;
                }
                #test-report-modal-content, #test-report-modal-content * {
                    visibility: visible;
                }
                #test-report-modal-content {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                }
                .ant-modal-footer, .ant-modal-close {
                    display: none !important;
                }
            }
        `;
        document.head.appendChild(style);
        return () => document.head.removeChild(style);
    }, []);

    return (
        <Modal
            title={<Title level={4} style={{ margin: 0 }}>Test Execution Report</Title>}
            open={visible}
            onCancel={onClose}
            footer={[
                <Button key="close" onClick={onClose}>Close</Button>,
                <Button key="download" type="primary" onClick={handleDownloadPDF}>Download PDF</Button>
            ]}
            width={800}
            styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
        >
            <div id="test-report-modal-content">
                <div id="test-report-modal-body">
                    <StatusIcon style={{ fontSize: '48px', color: statusColor }} />
                    <div>
                        <Title level={3} style={{ margin: 0, color: statusColor }}>
                            {isPass ? 'TEST PASSED' : 'TEST FAILED'}
                        </Title>
                        <Text type="secondary">Executed on {new Date().toLocaleString()}</Text>
                    </div>
                    <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <ClockCircleOutlined />
                            <Text strong>Duration</Text>
                        </div>
                        <Text>{reportData.duration || 'N/A'}</Text>
                    </div>


                    <Card title="Execution Summary" size="small" style={{ marginBottom: '24px' }}>
                        <Paragraph>
                            <Text strong>Test Case:</Text> {reportData.testName || 'Unknown'}
                        </Paragraph>
                        <Paragraph>
                            <Text strong>Result:</Text> <Badge status={isPass ? 'success' : 'error'} text={isPass ? 'Passed' : 'Failed'} />
                        </Paragraph>
                    </Card>

                    <Title level={5}>Console Output</Title>
                    <div style={{
                        background: '#1e1e1e',
                        color: '#d4d4d4',
                        padding: '16px',
                        borderRadius: '8px',
                        fontFamily: 'monospace',
                        whiteSpace: 'pre-wrap',
                        maxHeight: '300px',
                        overflowY: 'auto'
                    }}>
                        {reportData.output}
                    </div>
                </div>
            </div>
        </Modal >
    );
};

export default TestReportModal;
