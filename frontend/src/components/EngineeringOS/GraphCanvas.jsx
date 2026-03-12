import React, { useCallback, useState, useEffect } from 'react';
import {
    ReactFlow,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import FlowRequirementCard from './nodes/FlowRequirementCard';
import TraceabilityEdge from './edges/TraceabilityEdge';
import { useTreeLayout } from './useTreeLayout';

/**
 * v3.0 GraphCanvas — Flow Engineering-style tree view.
 * Light theme, dagre hierarchical layout, FlowRequirementCard nodes only.
 */

const nodeTypes = {
    flowRequirement: FlowRequirementCard,
};

const edgeTypes = {
    traceability: TraceabilityEdge,
};

const defaultEdgeOptions = {
    type: 'smoothstep',
    style: { stroke: '#CBD5E1', strokeWidth: 1.5 },
    animated: false,
};

const GraphCanvasContent = ({
    requirements = [],
    selectedNodeId,
    onNodeSelect,
    onNodeDoubleClick,
}) => {
    // Compute tree layout from requirements
    const { nodes: layoutNodes, edges: layoutEdges } = useTreeLayout(
        requirements,
        selectedNodeId
    );

    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    // Update nodes/edges when layout changes
    useEffect(() => {
        setNodes(layoutNodes);
        setEdges(layoutEdges);
    }, [layoutNodes, layoutEdges, setNodes, setEdges]);

    const onNodeClick = useCallback(
        (event, node) => {
            if (onNodeSelect) onNodeSelect(node.id);
        },
        [onNodeSelect]
    );

    const handleNodeDoubleClick = useCallback(
        (event, node) => {
            if (onNodeDoubleClick) onNodeDoubleClick(node.id);
        },
        [onNodeDoubleClick]
    );

    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                background: '#FAFBFC',
            }}
        >
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                defaultEdgeOptions={defaultEdgeOptions}
                onNodeClick={onNodeClick}
                onNodeDoubleClick={handleNodeDoubleClick}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                minZoom={0.1}
                maxZoom={2}
                proOptions={{ hideAttribution: true }}
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable={true}
                colorMode="light"
            >
                <Controls
                    position="bottom-right"
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                        border: '1px solid #E2E8F0',
                        borderRadius: 8,
                        overflow: 'hidden',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                    }}
                    showInteractive={false}
                />
                <Background
                    color="#E2E8F0"
                    gap={24}
                    size={1}
                    variant="dots"
                />
            </ReactFlow>
        </div>
    );
};

const GraphCanvas = ({
    requirements = [],
    selectedNodeId,
    onNodeSelect,
    onNodeDoubleClick,
}) => (
    <ReactFlowProvider>
        <GraphCanvasContent
            requirements={requirements}
            selectedNodeId={selectedNodeId}
            onNodeSelect={onNodeSelect}
            onNodeDoubleClick={onNodeDoubleClick}
        />
    </ReactFlowProvider>
);

export default GraphCanvas;
