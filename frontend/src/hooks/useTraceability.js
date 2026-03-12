/**
 * useTraceability — Traceability domain hook
 *
 * Manages TraceabilityLink CRUD plus:
 * - Traceability matrix generation
 * - Coverage statistics
 * - Gap detection
 * - Impact analysis
 */

import { useState, useCallback, useEffect } from "react";
import { traceabilityApi } from "../services/traceabilityApi";

export function useTraceability(projectId) {
  const [links, setLinks] = useState([]);
  const [matrix, setMatrix] = useState(null);
  const [coverage, setCoverage] = useState(null);
  const [gaps, setGaps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [matrixLoading, setMatrixLoading] = useState(false);
  const [error, setError] = useState(null);

  // ============================================================
  // Load Links
  // ============================================================

  const loadLinks = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await traceabilityApi.listLinks(projectId);
      setLinks(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadLinks();
  }, [loadLinks]);

  // ============================================================
  // TraceabilityLink CRUD
  // ============================================================

  const createLink = useCallback(
    async (data) => {
      const created = await traceabilityApi.createLink(projectId, data);
      setLinks((prev) => [...prev, created]);
      return created;
    },
    [projectId]
  );

  const deleteLink = useCallback(
    async (linkId) => {
      await traceabilityApi.deleteLink(projectId, linkId);
      setLinks((prev) => prev.filter((l) => l.id !== linkId));
    },
    [projectId]
  );

  const getLinksForEntity = useCallback(
    (entityId) => links.filter(
      (l) => l.source_id === entityId || l.target_id === entityId
    ),
    [links]
  );

  // ============================================================
  // Matrix
  // ============================================================

  const loadMatrix = useCallback(async () => {
    if (!projectId) return;
    setMatrixLoading(true);
    try {
      const data = await traceabilityApi.getMatrix(projectId);
      setMatrix(data);
    } catch (e) {
      console.error("Failed to load traceability matrix:", e);
    } finally {
      setMatrixLoading(false);
    }
  }, [projectId]);

  // ============================================================
  // Coverage
  // ============================================================

  const loadCoverage = useCallback(async () => {
    if (!projectId) return;
    try {
      const data = await traceabilityApi.getCoverage(projectId);
      setCoverage(data);
    } catch (e) {
      console.error("Failed to load traceability coverage:", e);
    }
  }, [projectId]);

  // ============================================================
  // Gaps
  // ============================================================

  const loadGaps = useCallback(async () => {
    if (!projectId) return;
    try {
      const data = await traceabilityApi.getGaps(projectId);
      setGaps(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to load traceability gaps:", e);
    }
  }, [projectId]);

  // ============================================================
  // Impact Analysis (on-demand)
  // ============================================================

  const analyzeImpact = useCallback(
    async (entityId, entityType = "") => {
      return traceabilityApi.getImpact(projectId, entityId, entityType);
    },
    [projectId]
  );

  // ============================================================
  // Chain Traversal (on-demand)
  // ============================================================

  const getChain = useCallback(
    async (entityId, maxDepth = 10) => {
      return traceabilityApi.getChain(projectId, entityId, maxDepth);
    },
    [projectId]
  );

  return {
    links,
    matrix,
    coverage,
    gaps,
    loading,
    matrixLoading,
    error,
    // Link ops
    loadLinks,
    createLink,
    deleteLink,
    getLinksForEntity,
    // Matrix ops
    loadMatrix,
    // Coverage ops
    loadCoverage,
    // Gap ops
    loadGaps,
    // On-demand analysis
    analyzeImpact,
    getChain,
  };
}
