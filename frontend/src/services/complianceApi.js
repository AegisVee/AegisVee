/**
 * complianceApi.js — ASPICE Compliance API Service
 *
 * Covers:
 * - ASPICE SYS.1-SYS.5 scorecard
 * - Work product status (13 WP types)
 * - BGB Rating Rules check
 * - Consistency checks
 * - Compliance summary
 */

const API_BASE = "http://localhost:8000/api";

const json = (res) => {
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return res.json();
};

const post = (url, data = {}) =>
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

const base = (projectId) =>
  `${API_BASE}/projects/${projectId}/compliance`;

export const complianceApi = {
  /**
   * Get the full ASPICE SYS.1-SYS.5 compliance scorecard.
   * Returns per-process BP completion rates, overall score,
   * traceability coverage, and consistency gap count.
   */
  getScorecard: (projectId) =>
    fetch(`${base(projectId)}/scorecard`).then(json),

  /**
   * Get status of all 13 ASPICE work product types.
   * Returns each WP type with entity count and populated/empty status.
   */
  getWorkProductStatus: (projectId) =>
    fetch(`${base(projectId)}/work-products`).then(json),

  /**
   * Check BGB Rating Rules compliance.
   * Verifies SYS.2.RL.4, SYS.2.RL.7, SYS.4.RL.1, SYS.4.RL.3.
   */
  checkBgbRules: (projectId) =>
    fetch(`${base(projectId)}/bgb-check`).then(json),

  /**
   * Run all automated consistency checks.
   * Returns traceability gaps, status conflicts, version mismatches.
   */
  runConsistencyChecks: (projectId) =>
    fetch(`${base(projectId)}/consistency`).then(json),

  /**
   * Auto-generate ConsistencyEvidence (WP 13-51) records from detected issues.
   */
  generateConsistencyEvidence: (projectId) =>
    post(`${base(projectId)}/consistency/generate-evidence`).then(json),

  /**
   * Get a high-level compliance summary combining all checks.
   * Returns overall ASPICE score, BGB status, WP coverage, open issues.
   */
  getSummary: (projectId) =>
    fetch(`${base(projectId)}/summary`).then(json),
};
