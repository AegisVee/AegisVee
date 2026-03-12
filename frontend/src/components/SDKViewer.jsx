import React, { useState, useEffect } from 'react';
import { Table, Input, Card, Tag, Typography, Spin, Alert } from 'antd';
import { SearchOutlined, CodeOutlined, FileTextOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const SDKViewer = () => {
    const [apis, setApis] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchText, setSearchText] = useState('');

    useEffect(() => {
        fetchSDKMetadata();
    }, []);

    const fetchSDKMetadata = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/sdk/metadata');
            if (!response.ok) {
                throw new Error('Failed to fetch SDK metadata');
            }
            const data = await response.json();
            if (data.error) {
                throw new Error(data.error);
            }
            setApis(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            title: 'Function Name',
            dataIndex: 'name',
            key: 'name',
            render: (text) => <Text strong style={{ color: '#61dafb' }}>{text}</Text>,
            sorter: (a, b) => a.name.localeCompare(b.name),
        },
        {
            title: 'Return Type',
            dataIndex: 'return_type',
            key: 'return_type',
            render: (text) => <Tag color="blue">{text}</Tag>,
        },
        {
            title: 'Category',
            dataIndex: 'category',
            key: 'category',
            filters: [
                ...new Set(apis.map(item => item.category))
            ].map(cat => ({ text: cat, value: cat })),
            onFilter: (value, record) => record.category === value,
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            render: (text) => (
                <div style={{ maxHeight: '100px', overflowY: 'auto', whiteSpace: 'pre-wrap', fontSize: '12px' }}>
                    {text || <Text type="secondary">No description</Text>}
                </div>
            ),
        },
    ];

    const filteredApis = apis.filter(api =>
        api.name.toLowerCase().includes(searchText.toLowerCase()) ||
        (api.description && api.description.toLowerCase().includes(searchText.toLowerCase()))
    );

    return (
        <Card
            title={<><CodeOutlined /> SDK Knowledge Base</>}
            style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#141414', border: 'none' }}
            bodyStyle={{ flex: 1, overflow: 'hidden', padding: '10px' }}
            headStyle={{ color: '#fff', borderBottom: '1px solid #303030' }}
        >
            <div style={{ marginBottom: 16 }}>
                <Input
                    placeholder="Search SDK APIs..."
                    prefix={<SearchOutlined />}
                    onChange={e => setSearchText(e.target.value)}
                    style={{ background: '#1f1f1f', border: '1px solid #303030', color: '#fff' }}
                />
            </div>

            {error && <Alert message="Error" description={error} type="error" showIcon style={{ marginBottom: 16 }} />}

            {loading ? (
                <div style={{ textAlign: 'center', padding: '50px' }}>
                    <Spin size="large" />
                    <div style={{ marginTop: 10, color: '#fff' }}>Loading SDK Metadata...</div>
                </div>
            ) : (
                <Table
                    dataSource={filteredApis}
                    columns={columns}
                    rowKey={(record) => record.signature}
                    pagination={{ pageSize: 50, size: 'small' }}
                    scroll={{ y: 'calc(100vh - 300px)' }}
                    size="small"
                    rowClassName="sdk-row"
                    style={{ background: 'transparent' }}
                />
            )}
        </Card>
    );
};

export default SDKViewer;
