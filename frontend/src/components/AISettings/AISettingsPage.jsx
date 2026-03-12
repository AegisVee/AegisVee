import React, { useState } from 'react';
import { Layout, Menu, Typography, theme } from 'antd';
import {
  ShopOutlined,
  DatabaseOutlined,
  SettingOutlined,
  BranchesOutlined,
  DashboardOutlined,
} from '@ant-design/icons';
import ModelMarketplace from './ModelMarketplace';
import InstalledModels from './InstalledModels';
import InferenceSettings from './InferenceSettings';
import FunctionMapping from './FunctionMapping';
import PerformanceMonitor from './PerformanceMonitor';

const { Sider, Content } = Layout;
const { Title } = Typography;

const MENU_ITEMS = [
  { key: 'marketplace', icon: <ShopOutlined />, label: 'Model Marketplace' },
  { key: 'installed', icon: <DatabaseOutlined />, label: 'Installed Models' },
  { key: 'inference', icon: <SettingOutlined />, label: 'Inference Engine' },
  { key: 'mapping', icon: <BranchesOutlined />, label: 'Function Mapping' },
  { key: 'performance', icon: <DashboardOutlined />, label: 'Performance' },
];

const AISettingsPage = () => {
  const [activeSection, setActiveSection] = useState('marketplace');
  const { token } = theme.useToken();

  const renderContent = () => {
    switch (activeSection) {
      case 'marketplace':
        return <ModelMarketplace />;
      case 'installed':
        return <InstalledModels />;
      case 'inference':
        return <InferenceSettings />;
      case 'mapping':
        return <FunctionMapping />;
      case 'performance':
        return <PerformanceMonitor />;
      default:
        return <ModelMarketplace />;
    }
  };

  return (
    <Layout style={{ height: '100%', background: token.colorBgContainer }}>
      <Sider
        width={220}
        style={{
          background: token.colorBgContainer,
          borderRight: `1px solid ${token.colorBorderSecondary}`,
          padding: '16px 0',
        }}
      >
        <div style={{ padding: '0 16px 16px' }}>
          <Title level={5} style={{ margin: 0 }}>AI Settings</Title>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[activeSection]}
          onClick={(e) => setActiveSection(e.key)}
          items={MENU_ITEMS}
          style={{ border: 'none' }}
        />
      </Sider>
      <Content style={{ padding: 24, overflow: 'auto' }}>
        {renderContent()}
      </Content>
    </Layout>
  );
};

export default AISettingsPage;
