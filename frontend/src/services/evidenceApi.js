/**
 * evidenceApi.js — Evidence API Service
 *
 * Covers:
 * - ConsistencyEvidence (WP 13-51) CRUD
 * - CommunicationEvidence (WP 13-52) CRUD
 * - AnalysisResult (WP 15-51) CRUD
 */

const API_BASE = "http://localhost:8000/api";

const json = (res) => {
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return res.json();
};

const post = (url, data) =>
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

const put = (url, data) =>
  fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

const del = (url) => fetch(url, { method: "DELETE" }).then(json);

const base = (projectId) => `${API_BASE}/projects/${projectId}`;

// ============================================================
// ConsistencyEvidence (WP 13-51)
// ============================================================

export const consistencyEvidenceApi = {
  list: (projectId) =>
    fetch(`${base(projectId)}/consistency-evidence`).then(json),

  get: (projectId, ceId) =>
    fetch(`${base(projectId)}/consistency-evidence/${ceId}`).then(json),

  create: (projectId, data) =>
    post(`${base(projectId)}/consistency-evidence`, data).then(json),

  update: (projectId, ceId, data) =>
    put(`${base(projectId)}/consistency-evidence/${ceId}`, data).then(json),

  delete: (projectId, ceId) =>
    del(`${base(projectId)}/consistency-evidence/${ceId}`),

  /** Resolve an open consistency evidence record */
  resolve: (projectId, ceId) =>
    put(`${base(projectId)}/consistency-evidence/${ceId}`, {
      status: "resolved",
    }).then(json),
};

// ============================================================
// CommunicationEvidence (WP 13-52)
// ============================================================

export const communicationEvidenceApi = {
  list: (projectId) =>
    fetch(`${base(projectId)}/communication-evidence`).then(json),

  get: (projectId, comId) =>
    fetch(`${base(projectId)}/communication-evidence/${comId}`).then(json),

  create: (projectId, data) =>
    post(`${base(projectId)}/communication-evidence`, data).then(json),

  update: (projectId, comId, data) =>
    put(`${base(projectId)}/communication-evidence/${comId}`, data).then(json),

  delete: (projectId, comId) =>
    del(`${base(projectId)}/communication-evidence/${comId}`),
};

// ============================================================
// AnalysisResult (WP 15-51)
// ============================================================

export const analysisResultApi = {
  list: (projectId) =>
    fetch(`${base(projectId)}/analysis-results`).then(json),

  get: (projectId, arId) =>
    fetch(`${base(projectId)}/analysis-results/${arId}`).then(json),

  create: (projectId, data) =>
    post(`${base(projectId)}/analysis-results`, data).then(json),

  update: (projectId, arId, data) =>
    put(`${base(projectId)}/analysis-results/${arId}`, data).then(json),

  delete: (projectId, arId) =>
    del(`${base(projectId)}/analysis-results/${arId}`),
};
