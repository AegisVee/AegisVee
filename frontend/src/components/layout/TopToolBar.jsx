import React from 'react';
import { Button, Tooltip, Space } from 'antd';
import {
    LeftOutlined,
    UndoOutlined,
    ShareAltOutlined,
    UserAddOutlined,
    EllipsisOutlined
} from '@ant-design/icons';

/**
 * TopToolBar matches the aesthetic of the provided iOS/Notes-style 
 * floating navigation toolbar. It features a dotted/beige background 
 * container with a distinct left back button and a grouped right pill-shaped container.
 */
const TopToolBar = ({
    title = "", // Optional text next to back button
    onBack,
    onUndo,
    onShare,
    onCollaborate,
    onMore,
}) => {
    // Styling inspired by the provided reference image
    const containerStyle = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 24px',
        // Slight beige background as seen in the mockup
        backgroundColor: '#e6dbb9',
        // Simulated dotted pattern if we wanted an exact match, but solid beige is safer
        // backgroundImage: 'radial-gradient(#bcae8d 1px, transparent 1px)',
        // backgroundSize: '20px 20px',
        width: '100%',
        boxSizing: 'border-box'
    };

    const circularBtnStyle = {
        width: 44,
        height: 44,
        borderRadius: '50%',
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: 'none',
        color: '#8b7a55',
        fontSize: '18px'
    };

    const pillContainerStyle = {
        display: 'flex',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: '24px',
        padding: '4px 8px',
        gap: '4px'
    };

    const iconBtnStyle = {
        color: '#8b7a55',
        fontSize: '18px',
        border: 'none',
        background: 'transparent',
        boxShadow: 'none'
    };

    return (
        <div style={containerStyle}>
            {/* Left Area: Back Button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {onBack && (
                    <Button
                        icon={<LeftOutlined />}
                        onClick={onBack}
                        style={circularBtnStyle}
                    />
                )}
                {title && <span style={{ color: '#8b7a55', fontWeight: 600, fontSize: '16px' }}>{title}</span>}
            </div>

            {/* Right Area: Pill-shaped Action Group */}
            <div style={pillContainerStyle}>
                {onUndo && (
                    <Tooltip title="Undo">
                        <Button icon={<UndoOutlined />} onClick={onUndo} style={iconBtnStyle} />
                    </Tooltip>
                )}

                {onShare && (
                    <Tooltip title="Share">
                        <Button icon={<ShareAltOutlined />} onClick={onShare} style={iconBtnStyle} />
                    </Tooltip>
                )}

                {onCollaborate && (
                    <Tooltip title="Collaborate">
                        <Button
                            icon={<UserAddOutlined style={{ color: '#6abf98' }} />} // Giving it a slightly distinctive color as seen in the green circle
                            onClick={onCollaborate}
                            style={iconBtnStyle}
                        />
                    </Tooltip>
                )}

                {onMore && (
                    <Tooltip title="More actions">
                        <Button icon={<EllipsisOutlined />} onClick={onMore} style={iconBtnStyle} />
                    </Tooltip>
                )}
            </div>
        </div>
    );
};

export default TopToolBar;
