/**
 * useCompliance — ASPICE Compliance domain hook
 *
 * Manages:
 * - ASPICE SYS.1-SYS.5 scorecard
 * - Work product status
 * - BGB Rating Rules check
 * - Consistency checks + auto-generate evidence
 * - Compliance summary
 */

import { useState, useCallback } from "react";
import { complianceApi } from "../services/complianceApi";

export function useCompliance(projectId) {
  const [scorecard, setScorecard] = useState(null);
  const [workProducts, setWorkProducts] = useState([]);
  const [bgbCheck, setBgbCheck] = useState(null);
  const [consistencyReport, setConsistencyReport] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ============================================================
  // Scorecard
  // ============================================================

  const loadScorecard = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await complianceApi.getScorecard(projectId);
      setScorecard(data);
      return data;
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // ============================================================
  // Work Products
  // ============================================================

  const loadWorkProducts = useCallback(async () => {
    if (!projectId) return;
    try {
      const data = await complianceApi.getWorkProductStatus(projectId);
      setWorkProducts(Array.isArray(data) ? data : []);
      return data;
    } catch (e) {
      console.error("Failed to load work product status:", e);
    }
  }, [projectId]);

  // ============================================================
  // BGB Rules
  // ============================================================

  const loadBgbCheck = useCallback(async () => {
    if (!projectId) return;
    try {
      const data = await complianceApi.checkBgbRules(projectId);
      setBgbCheck(data);
      return data;
    } catch (e) {
      console.error("Failed to load BGB check:", e);
    }
  }, [projectId]);

  // ============================================================
  // Consistency
  // ============================================================

  const runConsistencyChecks = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const data = await complianceApi.runConsistencyChecks(projectId);
      setConsistencyReport(data);
      return data;
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const generateConsistencyEvidence = useCallback(async () => {
    if (!projectId) return;
    const result = await complianceApi.generateConsistencyEvidence(projectId);
    return result;
  }, [projectId]);

  // ============================================================
  // Summary
  // ============================================================

  const loadSummary = useCallback(async () => {
    if (!projectId) return;
    try {
      const data = await complianceApi.getSummary(projectId);
      setSummary(data);
      return data;
    } catch (e) {
      console.error("Failed to load compliance summary:", e);
    }
  }, [projectId]);

  // ============================================================
  // Load All
  // ============================================================

  const loadAll = useCallback(async () => {
    if (!projectId) return;
    await Promise.all([
      loadScorecard(),
      loadWorkProducts(),
      loadBgbCheck(),
      loadSummary(),
    ]);
  }, [loadScorecard, loadWorkProducts, loadBgbCheck, loadSummary]);

  // ============================================================
  // Derived helpers
  // ============================================================

  const getProcessScore = useCallback(
    (processKey) => {
      if (!scorecard?.processes) return null;
      return scorecard.processes[processKey] || null;
    },
    [scorecard]
  );

  const overallPercent = scorecard?.overall?.percent ?? 0;
  const populatedWorkProducts = workProducts.filter(
    (wp) => wp.status === "populated"
  ).length;

  return {
    scorecard,
    workProducts,
    bgbCheck,
    consistencyReport,
    summary,
    loading,
    error,
    overallPercent,
    populatedWorkProducts,
    // Actions
    loadAll,
    loadScorecard,
    loadWorkProducts,
    loadBgbCheck,
    runConsistencyChecks,
    generateConsistencyEvidence,
    loadSummary,
    // Helpers
    getProcessScore,
  };
}
