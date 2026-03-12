import React, { useState } from 'react';
import { Modal, Input, Button, Spin, Alert, Typography, List, Divider } from 'antd';

const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;

const ImpactAnalysisModal = ({ visible, onClose, targetNode, graphData }) => {
    const [changeDescription, setChangeDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const handleAnalyze = async () => {
        if (!changeDescription.trim()) return;

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const payload = {
                target_node_id: targetNode.id,
                change_description: changeDescription,
                graph_data: graphData
            };

            const response = await fetch('http://localhost:8000/api/logic/impact_analysis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error('Analysis failed');
            }

            const data = await response.json();
            setResult(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setResult(null);
        setChangeDescription('');
        setError(null);
        onClose();
    };

    return (
        <Modal
            title={<><span className="text-xl">⚡ Intelligent Impact Analysis</span> <span className="text-gray-400 text-sm ml-2">Target: {targetNode?.data?.title}</span></>}
            open={visible}
            onCancel={handleClose}
            footer={null}
            width={700}
            className="dark-modal"
        >
            {!result ? (
                <div className="flex flex-col gap-4">
                    <Alert
                        message="Describe the proposed change"
                        description="E.g., 'Switch battery to Molicel P45B', 'Increase motor torque to 5Nm'"
                        type="info"
                        showIcon
                    />
                    <TextArea
                        rows={4}
                        placeholder="Enter change description..."
                        value={changeDescription}
                        onChange={(e) => setChangeDescription(e.target.value)}
                        className="bg-gray-800 text-white border-gray-600 focus:border-blue-500"
                    />
                    <div className="flex justify-end">
                        <Button
                            type="primary"
                            onClick={handleAnalyze}
                            loading={loading}
                            disabled={!changeDescription}
                            size="large"
                            className="bg-blue-600"
                        >
                            Analyze Impact
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-2">
                    {/* Summary Section */}
                    <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                        <div className="flex justify-between items-center mb-2">
                            <Title level={4} style={{ color: 'white', margin: 0 }}>Analysis Report</Title>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${result.analysis.risk_level === 'High' ? 'bg-red-900 text-red-200' :
                                result.analysis.risk_level === 'Medium' ? 'bg-yellow-900 text-yellow-200' :
                                    'bg-green-900 text-green-200'
                                }`}>
                                RISK LEVEL: {result.analysis.risk_level.toUpperCase()}
                            </span>
                        </div>
                        <Paragraph style={{ color: '#d1d5db' }}>
                            {result.analysis.summary}
                        </Paragraph>
                    </div>

                    {/* Conflicts */}
                    <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                        <Title level={5} style={{ color: '#f87171', marginTop: 0 }}>⚠️ Potential Conflicts & Risks</Title>
                        <List
                            dataSource={result.analysis.conflicts}
                            renderItem={(item) => (
                                <List.Item className="text-gray-300 border-b border-gray-700">
                                    <Text className="text-gray-300">• {item}</Text>
                                </List.Item>
                            )}
                        />
                    </div>

                    {/* Recommendation */}
                    <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                        <Title level={5} style={{ color: '#34d399', marginTop: 0 }}>💡 Recommendation</Title>
                        <Paragraph style={{ color: '#d1d5db', margin: 0 }}>
                            {result.analysis.recommendation}
                        </Paragraph>
                    </div>

                    {/* Impacted Nodes Traceability */}
                    <Divider style={{ borderColor: '#4b5563' }} orientation="left"><span className="text-gray-400">Traceability Impact</span></Divider>
                    <div className="flex flex-wrap gap-2">
                        {result.impact_graph.map(id => (
                            <div key={id} className={`px-3 py-1 rounded border text-xs ${id === targetNode.id
                                ? 'bg-blue-900 border-blue-700 text-blue-200'
                                : 'bg-gray-700 border-gray-600 text-gray-300'
                                }`}>
                                {id}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default ImpactAnalysisModal;
