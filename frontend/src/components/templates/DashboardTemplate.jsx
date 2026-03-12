import React from 'react';
import TrafficLightCard from '../organisms/TrafficLightCard';
import { Row, Col, Typography, Button, theme } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

/**
 * DashboardTemplate
 * The "Hub" view showing high-level status of all projects/modules.
 */
import { api } from '../../services/api';
import { Spin, message } from 'antd';
import AddProjectModal from '../organisms/AddProjectModal';

const DashboardTemplate = ({ onProjectSelect }) => {
    const { token } = theme.useToken();
    const [projects, setProjects] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [isModalVisible, setIsModalVisible] = React.useState(false);
    const fileInputRef = React.useRef(null);

    const fetchProjects = async () => {
        setLoading(true);
        try {
            const data = await api.getProjects();
            setProjects(Array.isArray(data) ? data : []);
        } catch (error) {
            message.error("Failed to load projects");
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchProjects();
    }, []);

    const handleProjectCreated = (newProject) => {
        setProjects([...projects, newProject]);
    };

    const handleExportSystem = async () => {
        try {
            const [projData, reqData] = await Promise.all([
                api.getProjects(),
                api.getRequirements()
            ]);

            // For dashboard export, we might not have graph data loaded.
            // We can export just the data, or fetch graph if available (but graph is inside GraphCanvas).
            // Strategy: Export Data Only. Import will preserve data.
            // Or better: If we want full unified file, we should try to get graph data too?
            // Since graph state is local to GraphCanvas, we can't easily get it here unless we store it in backend.
            // Assumption: Backend logic.py has graph? No.
            // Simplified: Export Projects + Requirements. Graph layout will be reset or default.
            // Improv: If we want graph layout, we must save graph to backend first.
            // Current "Save Project" in OS saves graph json locally.
            // Let's stick to Projects + Requirements for Dashboard export.

            const { formatExportData } = await import('../../utils/fileUtils');
            const data = formatExportData(projData, reqData, [], []); // Empty nodes/edges

            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", `aegis_system_${Date.now()}.aegis`);
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();

        } catch (e) {
            message.error("Failed to export system");
            console.error(e);
        }
    };

    const handleImportSystem = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const { parseImportData } = await import('../../utils/fileUtils');
                const parsed = parseImportData(e.target.result);

                // Sync to backend
                await api.syncSystem({
                    projects: parsed.projects,
                    requirements: parsed.requirements
                });

                message.success("System data imported successfully");
                fetchProjects(); // Refresh view

            } catch (err) {
                console.error(err);
                message.error("Failed to import system file");
            }
        };
        reader.readAsText(file);
    };

    return (
        <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <Title level={2} style={{ color: token.colorText, marginBottom: '8px' }}>Project state overview</Title>
                    <Text style={{ color: token.colorTextSecondary }}>Real-time quality gates and compliance status across all vehicle modules.</Text>
                </div>
                <div style={{ display: 'flex', gap: '24px' }}>
                    <Button onClick={handleExportSystem}>Export System</Button>
                    <input
                        type="file"
                        accept=".aegis,.json"
                        style={{ display: 'none' }}
                        ref={fileInputRef}
                        onChange={handleImportSystem}
                    />
                    <Button onClick={() => fileInputRef.current?.click()}>Import System</Button>
                    <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>Add Project</Button>
                </div>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
                    <Spin size="large" tip="Loading projects..." />
                </div>
            ) : (
                <Row gutter={[24, 24]}>
                    {projects.map(project => (
                        <Col key={project.id} xs={24} md={12} lg={8}>
                            <TrafficLightCard
                                {...project}
                                onClick={() => onProjectSelect && onProjectSelect(project.id)}
                                onDelete={() => {
                                    if (confirm('Are you sure you want to delete this project?')) {
                                        api.deleteProject(project.id)
                                            .then(() => {
                                                message.success('Project deleted');
                                                setProjects(projects.filter(p => p.id !== project.id));
                                            })
                                            .catch(() => message.error('Failed to delete project'));
                                    }
                                }}
                                style={{ height: '100%' }}
                            />
                        </Col>
                    ))}
                </Row>
            )}

            <AddProjectModal
                visible={isModalVisible}
                onClose={() => setIsModalVisible(false)}
                onSuccess={handleProjectCreated}
            />
        </div>
    );
};

export default DashboardTemplate;
