import React from 'react';
import CardContainer from '../atoms/CardContainer';
import TrafficLightHeader from '../molecules/TrafficLightHeader';
import MetricDisplay from '../molecules/MetricDisplay';
import { Row, Col } from 'antd';

/**
 * TrafficLightCard Organism
 * A comprehensive card displaying status, metrics, and content.
 * Used for Quality Gates, Coverage Reports, etc.
 * 
 * @param {string} title - Card Title
 * @param {string} status - 'success' | 'warning' | 'error'
 * @param {string} statusText - Text for the badge
 * @param {Array} metrics - Array of { label, value, unit, trend }
 * @param {ReactNode} children - Additional content (charts, lists)
 */
const TrafficLightCard = ({ title, status, statusText, metrics = [], children, style, onClick, onDelete }) => {
    return (
        <CardContainer style={{ ...style, position: 'relative' }} onClick={onClick}>
            {onDelete && (
                <div
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                    style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        cursor: 'pointer',
                        color: '#666',
                        zIndex: 10
                    }}
                    className="delete-icon hover:text-red-500"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </div>
            )}
            <TrafficLightHeader title={title} status={status} statusText={statusText} />

            {metrics.length > 0 && (
                <Row gutter={[16, 16]} style={{ marginBottom: children ? '24px' : 0 }}>
                    {metrics.map((metric, index) => (
                        <Col key={index} span={24 / metrics.length}>
                            <MetricDisplay {...metric} />
                        </Col>
                    ))}
                </Row>
            )}

            {children && (
                <div style={{ marginTop: '16px' }}>
                    {children}
                </div>
            )}
        </CardContainer>
    );
};

export default TrafficLightCard;
