import React from 'react';

/**
 * TimelineNode Atom
 * The circular node on the vertical timeline.
 * 
 * @param {boolean} active - Is this the current step?
 * @param {boolean} completed - Is this step done?
 */
const TimelineNode = ({ active, completed }) => {
    const styles = {
        width: '16px',
        height: '16px',
        borderRadius: '50%',
        backgroundColor: active ? 'var(--brand-primary)' : (completed ? 'var(--brand-primary)' : 'var(--bg-card)'),
        border: `2px solid ${active || completed ? 'var(--brand-primary)' : 'var(--border-subtle)'}`,
        boxShadow: active ? 'var(--brand-glow)' : 'none',
        zIndex: 2,
        transition: 'all 0.3s ease',
        position: 'relative'
    };

    return <div style={styles} />;
};

export default TimelineNode;
