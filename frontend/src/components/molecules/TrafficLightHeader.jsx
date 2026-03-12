import React from 'react';
import StatusBadge from '../atoms/StatusBadge';
import { Typography } from 'antd';

const { Title } = Typography;

/**
 * TrafficLightHeader Molecule
 * Combines a Title and a StatusBadge.
 * 
 * @param {string} title - Card Title
 * @param {string} status - 'success' | 'warning' | 'error'
 * @param {string} statusText - Text for the badge
 */
const TrafficLightHeader = ({ title, status, statusText }) => {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <Title level={4} style={{ margin: 0, color: 'var(--text-primary)', fontWeight: 600 }}>
                {title}
            </Title>
            <StatusBadge status={status} text={statusText} />
        </div>
    );
};

export default TrafficLightHeader;
