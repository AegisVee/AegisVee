import { useMemo } from 'react';
import dagre from '@dagrejs/dagre';

/**
 * Hook that computes a hierarchical tree layout using dagre.
 * Takes flat requirements array (with parent_id) and returns
 * positioned nodes + edges for @xyflow/react.
 */

const NODE_WIDTH = 260;
const NODE_HEIGHT = 90;
const RANK_SEP = 80;  // vertical gap between levels
const NODE_SEP = 30;  // horizontal gap between siblings

/**
 * Build flow nodes and edges from a flat list of requirements.
 * @param {Array} requirements - flat array of requirement objects with parent_id
 * @param {string|null} selectedNodeId - currently selected node ID
 * @returns {{ nodes: Array, edges: Array }}
 */
export function useTreeLayout(requirements, selectedNodeId = null) {
    return useMemo(() => {
        if (!requirements || requirements.length === 0) {
            return { nodes: [], edges: [] };
        }

        // Create dagre graph
        const g = new dagre.graphlib.Graph();
        g.setDefaultEdgeLabel(() => ({}));
        g.setGraph({
            rankdir: 'TB',     // Top to Bottom
            ranksep: RANK_SEP,
            nodesep: NODE_SEP,
            marginx: 40,
            marginy: 40,
        });

        // Add nodes
        requirements.forEach((req) => {
            g.setNode(req.id, {
                width: NODE_WIDTH,
                height: NODE_HEIGHT,
            });
        });

        // Add edges (parent → child)
        const edges = [];
        requirements.forEach((req) => {
            if (req.parent_id) {
                // Only add edge if parent exists in our set
                const parentExists = requirements.some(r => r.id === req.parent_id);
                if (parentExists) {
                    g.setEdge(req.parent_id, req.id);
                    edges.push({
                        id: `e-${req.parent_id}-${req.id}`,
                        source: req.parent_id,
                        target: req.id,
                        type: 'smoothstep',
                        style: {
                            stroke: '#CBD5E1',
                            strokeWidth: 1.5,
                        },
                        animated: false,
                    });
                }
            }
        });

        // Compute layout
        dagre.layout(g);

        // Convert dagre positions to xyflow nodes
        const nodes = requirements.map((req) => {
            const nodeWithPosition = g.node(req.id);
            return {
                id: req.id,
                type: 'flowRequirement',
                position: {
                    x: (nodeWithPosition?.x ?? 0) - NODE_WIDTH / 2,
                    y: (nodeWithPosition?.y ?? 0) - NODE_HEIGHT / 2,
                },
                data: { ...req },
                selected: req.id === selectedNodeId,
            };
        });

        return { nodes, edges };
    }, [requirements, selectedNodeId]);
}

/**
 * Build a tree structure from flat requirements for the sidebar hierarchy.
 * @param {Array} requirements - flat array with parent_id
 * @returns {Array} tree roots with children arrays
 */
export function buildHierarchyTree(requirements) {
    if (!requirements || requirements.length === 0) return [];

    const byId = {};
    requirements.forEach(r => {
        byId[r.id] = { ...r, children: [] };
    });

    const roots = [];
    requirements.forEach(r => {
        const node = byId[r.id];
        if (r.parent_id && byId[r.parent_id]) {
            byId[r.parent_id].children.push(node);
        } else {
            roots.push(node);
        }
    });

    return roots;
}

/**
 * Count total descendants of a tree node.
 */
export function countDescendants(node) {
    if (!node.children || node.children.length === 0) return 0;
    return node.children.reduce(
        (sum, child) => sum + 1 + countDescendants(child),
        0
    );
}

export default useTreeLayout;
