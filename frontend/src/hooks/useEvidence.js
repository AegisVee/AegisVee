/**
 * useEvidence — Evidence domain hook
 *
 * Manages:
 * - ConsistencyEvidence (WP 13-51)
 * - CommunicationEvidence (WP 13-52)
 * - AnalysisResult (WP 15-51)
 */

import { useState, useCallback, useEffect } from "react";
import {
  consistencyEvidenceApi,
  communicationEvidenceApi,
  analysisResultApi,
} from "../services/evidenceApi";

export function useEvidence(projectId) {
  const [consistencyEvidence, setConsistencyEvidence] = useState([]);
  const [communicationEvidence, setCommunicationEvidence] = useState([]);
  const [analysisResults, setAnalysisResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ============================================================
  // Load
  // ============================================================

  const loadConsistencyEvidence = useCallback(async () => {
    if (!projectId) return;
    try {
      const data = await consistencyEvidenceApi.list(projectId);
      setConsistencyEvidence(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to load consistency evidence:", e);
    }
  }, [projectId]);

  const loadCommunicationEvidence = useCallback(async () => {
    if (!projectId) return;
    try {
      const data = await communicationEvidenceApi.list(projectId);
      setCommunicationEvidence(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to load communication evidence:", e);
    }
  }, [projectId]);

  const loadAnalysisResults = useCallback(async () => {
    if (!projectId) return;
    try {
      const data = await analysisResultApi.list(projectId);
      setAnalysisResults(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to load analysis results:", e);
    }
  }, [projectId]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        loadConsistencyEvidence(),
        loadCommunicationEvidence(),
        loadAnalysisResults(),
      ]);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [loadConsistencyEvidence, loadCommunicationEvidence, loadAnalysisResults]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // ============================================================
  // ConsistencyEvidence CRUD
  // ============================================================

  const createConsistencyEvidence = useCallback(
    async (data) => {
      const created = await consistencyEvidenceApi.create(projectId, data);
      setConsistencyEvidence((prev) => [...prev, created]);
      return created;
    },
    [projectId]
  );

  const updateConsistencyEvidence = useCallback(
    async (ceId, data) => {
      const updated = await consistencyEvidenceApi.update(projectId, ceId, data);
      setConsistencyEvidence((prev) =>
        prev.map((ce) => (ce.id === ceId ? updated : ce))
      );
      return updated;
    },
    [projectId]
  );

  const resolveConsistencyEvidence = useCallback(
    async (ceId) => {
      const updated = await consistencyEvidenceApi.resolve(projectId, ceId);
      setConsistencyEvidence((prev) =>
        prev.map((ce) => (ce.id === ceId ? updated : ce))
      );
      return updated;
    },
    [projectId]
  );

  const deleteConsistencyEvidence = useCallback(
    async (ceId) => {
      await consistencyEvidenceApi.delete(projectId, ceId);
      setConsistencyEvidence((prev) => prev.filter((ce) => ce.id !== ceId));
    },
    [projectId]
  );

  // ============================================================
  // CommunicationEvidence CRUD
  // ============================================================

  const createCommunicationEvidence = useCallback(
    async (data) => {
      const created = await communicationEvidenceApi.create(projectId, data);
      setCommunicationEvidence((prev) => [...prev, created]);
      return created;
    },
    [projectId]
  );

  const updateCommunicationEvidence = useCallback(
    async (comId, data) => {
      const updated = await communicationEvidenceApi.update(projectId, comId, data);
      setCommunicationEvidence((prev) =>
        prev.map((com) => (com.id === comId ? updated : com))
      );
      return updated;
    },
    [projectId]
  );

  const deleteCommunicationEvidence = useCallback(
    async (comId) => {
      await communicationEvidenceApi.delete(projectId, comId);
      setCommunicationEvidence((prev) =>
        prev.filter((com) => com.id !== comId)
      );
    },
    [projectId]
  );

  // ============================================================
  // AnalysisResult CRUD
  // ============================================================

  const createAnalysisResult = useCallback(
    async (data) => {
      const created = await analysisResultApi.create(projectId, data);
      setAnalysisResults((prev) => [...prev, created]);
      return created;
    },
    [projectId]
  );

  const updateAnalysisResult = useCallback(
    async (arId, data) => {
      const updated = await analysisResultApi.update(projectId, arId, data);
      setAnalysisResults((prev) =>
        prev.map((ar) => (ar.id === arId ? updated : ar))
      );
      return updated;
    },
    [projectId]
  );

  const deleteAnalysisResult = useCallback(
    async (arId) => {
      await analysisResultApi.delete(projectId, arId);
      setAnalysisResults((prev) => prev.filter((ar) => ar.id !== arId));
    },
    [projectId]
  );

  // Derived
  const openIssues = consistencyEvidence.filter(
    (ce) => ce.status === "open"
  ).length;

  return {
    consistencyEvidence,
    communicationEvidence,
    analysisResults,
    loading,
    error,
    openIssues,
    // Load ops
    loadAll,
    loadConsistencyEvidence,
    loadCommunicationEvidence,
    loadAnalysisResults,
    // ConsistencyEvidence ops
    createConsistencyEvidence,
    updateConsistencyEvidence,
    resolveConsistencyEvidence,
    deleteConsistencyEvidence,
    // CommunicationEvidence ops
    createCommunicationEvidence,
    updateCommunicationEvidence,
    deleteCommunicationEvidence,
    // AnalysisResult ops
    createAnalysisResult,
    updateAnalysisResult,
    deleteAnalysisResult,
  };
}
