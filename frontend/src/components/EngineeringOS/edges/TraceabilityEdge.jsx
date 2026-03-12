import React from 'react';
import { BaseEdge, getBezierPath, EdgeLabelRenderer } from '@xyflow/react';

const TraceabilityEdge = ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    data,
}) => {
    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    return (
        <>
            <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
            {data?.label && (
                <EdgeLabelRenderer>
                    <div
                        style={{
                            position: 'absolute',
                            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                            fontSize: 10,
                            pointerEvents: 'all',
                        }}
                        className="nodrag nopan bg-gray-900 text-gray-300 px-2 py-1 rounded border border-gray-700 shadow-sm"
                    >
                        {data.label}
                    </div>
                </EdgeLabelRenderer>
            )}
        </>
    );
};

export default TraceabilityEdge;
