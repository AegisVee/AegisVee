import React from 'react';
import TimelineItem from '../molecules/TimelineItem';

/**
 * VerticalTimeline Organism
 * Displays a list of steps in a vertical timeline.
 * 
 * @param {Array} steps - Array of { time, title, description, active, completed }
 */
const VerticalTimeline = ({ steps = [] }) => {
    return (
        <div style={{ padding: '16px 0' }}>
            {steps.map((step, index) => (
                <TimelineItem
                    key={index}
                    {...step}
                    last={index === steps.length - 1}
                />
            ))}
        </div>
    );
};

export default VerticalTimeline;
