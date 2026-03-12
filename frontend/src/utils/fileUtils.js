/**
 * fileUtils.js
 * Helpers for handling .aegis project files.
 */

export const formatExportData = (projects, requirements, nodes = [], edges = []) => {
    return {
        version: "1.0",
        meta: {
            exportedBy: "AegisVee",
            timestamp: new Date().toISOString()
        },
        data: {
            projects: Array.isArray(projects) ? projects : [],
            requirements: Array.isArray(requirements) ? requirements : [],
            graph: {
                nodes: Array.isArray(nodes) ? nodes : [],
                edges: Array.isArray(edges) ? edges : []
            }
        }
    };
};

export const parseImportData = (jsonContent) => {
    try {
        const parsed = typeof jsonContent === 'string' ? JSON.parse(jsonContent) : jsonContent;

        // Basic validation
        if (!parsed.data) {
            console.warn("Invalid .aegis file: missing root data property");
            // Try legacy format support if needed (e.g. just graph data)
            if (parsed.nodes && parsed.edges) {
                return {
                    projects: [],
                    requirements: [],
                    graph: { nodes: parsed.nodes, edges: parsed.edges }
                };
            }
            throw new Error("Invalid file format");
        }

        return {
            projects: parsed.data.projects || [],
            requirements: parsed.data.requirements || [],
            graph: {
                nodes: parsed.data.graph?.nodes || [],
                edges: parsed.data.graph?.edges || []
            }
        };
    } catch (e) {
        console.error("Failed to parse .aegis file", e);
        throw e;
    }
};
