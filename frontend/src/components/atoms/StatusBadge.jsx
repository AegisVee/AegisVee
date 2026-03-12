import React from 'react';

/**
 * StatusBadge Atom
 * Displays a glowing status indicator (Red, Yellow, Green).
 * 
 * @param {string} status - 'success' | 'warning' | 'error' | 'default'
 * @param {string} text - Optional text label
 */
const StatusBadge = ({ status = 'default', text }) => {
    const getStyles = () => {
        switch (status) {
            case 'success':
                return {
                    color: 'var(--status-green)',
                    backgroundColor: 'var(--status-green-bg)',
                    boxShadow: 'var(--status-green-glow)',
                    border: '1px solid var(--status-green)'
                };
            case 'warning':
                return {
                    color: 'var(--status-yellow)',
                    backgroundColor: 'var(--status-yellow-bg)',
                    boxShadow: 'var(--status-yellow-glow)',
                    border: '1px solid var(--status-yellow)'
                };
            case 'error':
                return {
                    color: 'var(--status-red)',
                    backgroundColor: 'var(--status-red-bg)',
                    boxShadow: 'var(--status-red-glow)',
                    border: '1px solid var(--status-red)'
                };
            default:
                return {
                    color: 'var(--text-secondary)',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid var(--border-subtle)'
                };
        }
    };

    const styles = {
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 600,
        transition: 'all 0.3s ease',
        ...getStyles()
    };

    return (
        <span style={styles}>
            <span style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: 'currentColor',
                marginRight: text ? 8 : 0,
                boxShadow: '0 0 5px currentColor'
            }} />
            {text && text.toUpperCase()}
        </span>
    );
};

export default StatusBadge;
