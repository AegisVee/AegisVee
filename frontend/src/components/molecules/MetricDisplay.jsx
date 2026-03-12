import React from 'react';
import { Typography } from 'antd';

const { Text } = Typography;

/**
 * MetricDisplay Molecule
 * Displays a key metric with a label.
 * 
 * @param {string} label - Metric Label
 * @param {string} value - Metric Value
 * @param {string} unit - Optional unit
 * @param {string} trend - Optional trend (+5%)
 */
const MetricDisplay = ({ label, value, unit, trend }) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Text style={{ color: 'var(--text-tertiary)', fontSize: '12px', marginBottom: '4px' }}>
                {label.toUpperCase()}
            </Text>
            <div style={{ display: 'flex', alignItems: 'baseline' }}>
                <Text style={{ color: 'var(--text-primary)', fontSize: '24px', fontWeight: 600, lineHeight: 1 }}>
                    {value}
                </Text>
                {unit && (
                    <Text style={{ color: 'var(--text-secondary)', fontSize: '14px', marginLeft: '4px' }}>
                        {unit}
                    </Text>
                )}
                {trend && (
                    <Text style={{
                        color: trend.startsWith('+') ? 'var(--status-green)' : 'var(--status-red)',
                        fontSize: '12px',
                        marginLeft: '8px',
                        fontWeight: 500
                    }}>
                        {trend}
                    </Text>
                )}
            </div>
        </div>
    );
};

export default MetricDisplay;
