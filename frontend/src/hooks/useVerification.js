/**
 * useVerification — SYS.4/SYS.5 Verification domain hook
 *
 * Manages:
 * - VerificationMeasure (WP 08-60) — unified with legacy TestScript
 * - VerificationMeasureSelectionSet (WP 08-58)
 * - VerificationResult (WP 15-52)
 * - VerificationMeasureData (WP 03-50)
 */

import { useState, useCallback, useEffect } from "react";
import {
  verificationMeasureApi,
  selectionSetApi,
  verificationResultApi,
  verificationDataApi,
} from "../services/verificationApi";

export function useVerification(projectId) {
  const [measures, setMeasures] = useState([]);
  const [selectionSets, setSelectionSets] = useState([]);
  const [results, setResults] = useState([]);
  const [verificationData, setVerificationData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ============================================================
  // Load
  // ============================================================

  const loadMeasures = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await verificationMeasureApi.list(projectId);
      setMeasures(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const loadResults = useCallback(async () => {
    if (!projectId) return;
    try {
      const data = await verificationResultApi.list(projectId);
      setResults(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to load verification results:", e);
    }
  }, [projectId]);

  const loadSelectionSets = useCallback(async () => {
    if (!projectId) return;
    try {
      const data = await selectionSetApi.list(projectId);
      setSelectionSets(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to load selection sets:", e);
    }
  }, [projectId]);

  const loadAll = useCallback(async () => {
    await Promise.all([
      loadMeasures(),
      loadResults(),
      loadSelectionSets(),
    ]);
  }, [loadMeasures, loadResults, loadSelectionSets]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // ============================================================
  // VerificationMeasure CRUD
  // ============================================================

  const createMeasure = useCallback(
    async (data) => {
      const created = await verificationMeasureApi.create(projectId, data);
      setMeasures((prev) => [...prev, created]);
      return created;
    },
    [projectId]
  );

  const updateMeasure = useCallback(
    async (vmId, data) => {
      const updated = await verificationMeasureApi.update(projectId, vmId, data);
      setMeasures((prev) =>
        prev.map((m) => (m.id === vmId ? updated : m))
      );
      return updated;
    },
    [projectId]
  );

  const deleteMeasure = useCallback(
    async (vmId) => {
      await verificationMeasureApi.delete(projectId, vmId);
      setMeasures((prev) => prev.filter((m) => m.id !== vmId));
    },
    [projectId]
  );

  const executeMeasure = useCallback(
    async (vmId, resultData) => {
      const result = await verificationMeasureApi.execute(projectId, vmId, resultData);
      setResults((prev) => [...prev, result]);
      return result;
    },
    [projectId]
  );

  // ============================================================
  // VerificationMeasureSelectionSet CRUD
  // ============================================================

  const createSelectionSet = useCallback(
    async (data) => {
      const created = await selectionSetApi.create(projectId, data);
      setSelectionSets((prev) => [...prev, created]);
      return created;
    },
    [projectId]
  );

  const updateSelectionSet = useCallback(
    async (ssId, data) => {
      const updated = await selectionSetApi.update(projectId, ssId, data);
      setSelectionSets((prev) =>
        prev.map((s) => (s.id === ssId ? updated : s))
      );
      return updated;
    },
    [projectId]
  );

  const deleteSelectionSet = useCallback(
    async (ssId) => {
      await selectionSetApi.delete(projectId, ssId);
      setSelectionSets((prev) => prev.filter((s) => s.id !== ssId));
    },
    [projectId]
  );

  // ============================================================
  // VerificationResult CRUD
  // ============================================================

  const createResult = useCallback(
    async (data) => {
      const created = await verificationResultApi.create(projectId, data);
      setResults((prev) => [...prev, created]);
      return created;
    },
    [projectId]
  );

  const updateResult = useCallback(
    async (vrId, data) => {
      const updated = await verificationResultApi.update(projectId, vrId, data);
      setResults((prev) =>
        prev.map((r) => (r.id === vrId ? updated : r))
      );
      return updated;
    },
    [projectId]
  );

  const deleteResult = useCallback(
    async (vrId) => {
      await verificationResultApi.delete(projectId, vrId);
      setResults((prev) => prev.filter((r) => r.id !== vrId));
    },
    [projectId]
  );

  // ============================================================
  // Derived helpers
  // ============================================================

  /** Get results for a specific verification measure */
  const getResultsForMeasure = useCallback(
    (vmId) => results.filter((r) => r.measure_id === vmId),
    [results]
  );

  /** Get the latest result (by created_at) for a measure */
  const getLatestResult = useCallback(
    (vmId) => {
      const measureResults = results.filter((r) => r.measure_id === vmId);
      return measureResults.sort((a, b) =>
        (b.created_at || "").localeCompare(a.created_at || "")
      )[0] || null;
    },
    [results]
  );

  /** Summary statistics */
  const stats = {
    totalMeasures: measures.length,
    passedMeasures: results.filter((r) => r.result === "pass").length,
    failedMeasures: results.filter((r) => r.result === "fail").length,
    pendingMeasures: measures.length - results.filter((r) => ["pass", "fail"].includes(r.result)).length,
    executedPercent:
      measures.length > 0
        ? Math.round((results.length / measures.length) * 100)
        : 0,
  };

  return {
    measures,
    selectionSets,
    results,
    verificationData,
    loading,
    error,
    stats,
    // Measure ops
    loadMeasures,
    createMeasure,
    updateMeasure,
    deleteMeasure,
    executeMeasure,
    // SelectionSet ops
    loadSelectionSets,
    createSelectionSet,
    updateSelectionSet,
    deleteSelectionSet,
    // Result ops
    loadResults,
    createResult,
    updateResult,
    deleteResult,
    getResultsForMeasure,
    getLatestResult,
    // Refresh all
    loadAll,
  };
}
