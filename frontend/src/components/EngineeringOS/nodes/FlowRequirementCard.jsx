import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Avatar, Tag, Tooltip } from 'antd';
import { CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons';

/**
 * Flow-style requirement card node for the tree view.
 * Matches Flow Engineering's design exactly:
 * - Orange "Requirement" type label header
 * - REQ-ID + Title
 * - Status indicator (green check / red X)
 * - Colored tag badges
 * - Assignee avatar
 */

const TAG_COLORS = {
    'Released': 'green',
    'Assumption': 'orange',
    'Work in Progress': 'gold',
    'Pending review': 'blue',
    'Draft': 'default',
    'Approved': 'cyan',
    'Verified': 'green',
    'Rejected': 'red',
    // Category tags
    'Launch vehicle': 'purple',
    'Payload': 'geekblue',
    'Propulsion system': 'magenta',
    'Attitude control system': 'volcano',
    'Stage 1': 'lime',
    'Stage 2': 'gold',
};

const getTagColor = (tag) => TAG_COLORS[tag] || 'default';

const isVerified = (status) => {
    return ['Verified', 'Released', 'Approved'].includes(status);
};

const FlowRequirementCard = ({ data, selected }) => {
    const {
        id,
        title,
        status = 'Draft',
        tags = [],
        assignee = '',
        assignee_avatar = '',
        req_type = 'functional',
    } = data;

    const verified = isVerified(status);
    const displayTags = tags.length > 0 ? tags : (status !== 'Draft' ? [status] : []);

    return (
        <div
            style={{
                background: '#ffffff',
                border: selected ? '2px solid #0EA5E9' : '1px solid #E2E8F0',
                borderRadius: 8,
                minWidth: 220,
                maxWidth: 300,
                boxShadow: selected
                    ? '0 0 0 2px rgba(14,165,233,0.2)'
                    : '0 1px 3px rgba(0,0,0,0.08)',
                overflow: 'hidden',
                transition: 'all 0.2s ease',
            }}
        >
            <Handle
                type="target"
                position={Position.Top}
                style={{
                    background: '#94A3B8',
                    width: 8,
                    height: 8,
                    border: '2px solid #fff',
                    top: -4,
                }}
            />

            {/* Type label header — orange like Flow */}
            <div
                style={{
                    background: '#FFF7ED',
                    borderBottom: '1px solid #FED7AA',
                    padding: '4px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                }}
            >
                <span
                    style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: '#EA580C',
                        textTransform: 'capitalize',
                        letterSpacing: '0.02em',
                    }}
                >
                    Requirement
                </span>
            </div>

            {/* Body */}
            <div style={{ padding: '8px 12px 10px' }}>
                {/* REQ-ID + Title */}
                <div style={{ marginBottom: 6 }}>
                    <span
                        style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: '#64748B',
                            fontFamily: 'monospace',
                            marginRight: 6,
                        }}
                    >
                        {id}
                    </span>
                    <span
                        style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: '#1E293B',
                            lineHeight: '1.3',
                        }}
                    >
                        {title || 'Untitled'}
                    </span>
                </div>

                {/* Bottom row: Status + Tags + Assignee */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        flexWrap: 'wrap',
                    }}
                >
                    {/* Verification status icon */}
                    <Tooltip title={verified ? 'Verified' : 'Not verified'}>
                        {verified ? (
                            <CheckCircleFilled
                                style={{ color: '#22C55E', fontSize: 14 }}
                            />
                        ) : (
                            <CloseCircleFilled
                                style={{ color: '#EF4444', fontSize: 14 }}
                            />
                        )}
                    </Tooltip>

                    {/* Tags */}
                    {displayTags.map((tag, idx) => (
                        <Tag
                            key={idx}
                            color={getTagColor(tag)}
                            style={{
                                fontSize: 10,
                                lineHeight: '18px',
                                padding: '0 6px',
                                margin: 0,
                                borderRadius: 4,
                            }}
                        >
                            {tag}
                        </Tag>
                    ))}

                    {/* Spacer */}
                    <div style={{ flex: 1 }} />

                    {/* Assignee avatar */}
                    {assignee && (
                        <Tooltip title={assignee}>
                            <Avatar
                                size={22}
                                style={{
                                    backgroundColor: '#0EA5E9',
                                    fontSize: 10,
                                    fontWeight: 600,
                                }}
                                src={assignee_avatar || undefined}
                            >
                                {assignee.charAt(0).toUpperCase()}
                            </Avatar>
                        </Tooltip>
                    )}
                </div>
            </div>

            <Handle
                type="source"
                position={Position.Bottom}
                style={{
                    background: '#94A3B8',
                    width: 8,
                    height: 8,
                    border: '2px solid #fff',
                    bottom: -4,
                }}
            />
        </div>
    );
};

export default memo(FlowRequirementCard);
