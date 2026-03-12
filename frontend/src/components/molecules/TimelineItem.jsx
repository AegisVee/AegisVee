import React from 'react';
import TimelineNode from '../atoms/TimelineNode';
import { Typography } from 'antd';

const { Text } = Typography;

/**
 * TimelineItem Molecule
 * A single step in the vertical timeline.
 * 
 * @param {string} time - Timestamp or Phase Name
 * @param {string} title - Step Title
 * @param {string} description - Step Description
 * @param {boolean} active - Is active?
 * @param {boolean} completed - Is completed?
 * @param {boolean} last - Is last item? (to hide connector line)
 */
const TimelineItem = ({ time, title, description, active, completed, last }) => {
    return (
        <div style={{ display: 'flex', position: 'relative', paddingBottom: last ? 0 : '24px' }}>
            {/* Left: Time/Phase */}
            <div style={{ width: '80px', textAlign: 'right', paddingRight: '16px', paddingTop: '2px' }}>
                <Text style={{ color: active ? 'var(--brand-primary)' : 'var(--text-tertiary)', fontSize: '12px', fontWeight: 600 }}>
                    {time}
                </Text>
            </div>

            {/* Center: Node & Line */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: '16px' }}>
                <TimelineNode active={active} completed={completed} />
                {!last && (
                    <div style={{
                        width: '2px',
                        flex: 1,
                        backgroundColor: completed ? 'var(--brand-primary)' : 'var(--border-subtle)',
                        marginTop: '4px',
                        marginBottom: '4px',
                        opacity: completed ? 0.5 : 1
                    }} />
                )}
            </div>

            {/* Right: Content */}
            <div style={{ flex: 1, paddingTop: '0px' }}>
                <Text style={{
                    color: active ? 'var(--text-primary)' : (completed ? 'var(--text-secondary)' : 'var(--text-tertiary)'),
                    fontWeight: active ? 600 : 400,
                    display: 'block',
                    marginBottom: '4px'
                }}>
                    {title}
                </Text>
                <Text style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>
                    {description}
                </Text>
            </div>
        </div>
    );
};

export default TimelineItem;
