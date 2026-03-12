/**
 * verificationApi.js — SYS.4 + SYS.5 Verification API Service
 *
 * Covers:
 * - VerificationMeasure (WP 08-60) CRUD + execute
 * - VerificationMeasureSelectionSet (WP 08-58) CRUD
 * - IntegrationSequenceInstruction (WP 06-50) CRUD
 * - IntegratedSystem (WP 11-06) CRUD
 * - VerificationMeasureData (WP 03-50) CRUD
 * - VerificationResult (WP 15-52) CRUD
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
// VerificationMeasure (WP 08-60)
// ============================================================

export const verificationMeasureApi = {
  list: (projectId) =>
    fetch(`${base(projectId)}/verification-measures`).then(json),

  get: (projectId, vmId) =>
    fetch(`${base(projectId)}/verification-measures/${vmId}`).then(json),

  create: (projectId, data) =>
    post(`${base(projectId)}/verification-measures`, data).then(json),

  update: (projectId, vmId, data) =>
    put(`${base(projectId)}/verification-measures/${vmId}`, data).then(json),

  delete: (projectId, vmId) =>
    del(`${base(projectId)}/verification-measures/${vmId}`),

  /** Record execution — creates a VerificationResult */
  execute: (projectId, vmId, resultData) =>
    post(
      `${base(projectId)}/verification-measures/${vmId}/execute`,
      resultData
    ).then(json),
};

// ============================================================
// VerificationMeasureSelectionSet (WP 08-58)
// ============================================================

export const selectionSetApi = {
  list: (projectId) =>
    fetch(`${base(projectId)}/verification-selection-sets`).then(json),

  create: (projectId, data) =>
    post(`${base(projectId)}/verification-selection-sets`, data).then(json),

  update: (projectId, ssId, data) =>
    put(
      `${base(projectId)}/verification-selection-sets/${ssId}`,
      data
    ).then(json),

  delete: (projectId, ssId) =>
    del(`${base(projectId)}/verification-selection-sets/${ssId}`),
};

// ============================================================
// IntegrationSequenceInstruction (WP 06-50)
// ============================================================

export const integrationInstructionApi = {
  list: (projectId) =>
    fetch(`${base(projectId)}/integration-instructions`).then(json),

  create: (projectId, data) =>
    post(`${base(projectId)}/integration-instructions`, data).then(json),

  update: (projectId, iiId, data) =>
    put(`${base(projectId)}/integration-instructions/${iiId}`, data).then(json),

  delete: (projectId, iiId) =>
    del(`${base(projectId)}/integration-instructions/${iiId}`),
};

// ============================================================
// IntegratedSystem (WP 11-06)
// ============================================================

export const integratedSystemApi = {
  list: (projectId) =>
    fetch(`${base(projectId)}/integrated-systems`).then(json),

  create: (projectId, data) =>
    post(`${base(projectId)}/integrated-systems`, data).then(json),

  update: (projectId, isId, data) =>
    put(`${base(projectId)}/integrated-systems/${isId}`, data).then(json),

  delete: (projectId, isId) =>
    del(`${base(projectId)}/integrated-systems/${isId}`),
};

// ============================================================
// VerificationMeasureData (WP 03-50)
// ============================================================

export const verificationDataApi = {
  list: (projectId) =>
    fetch(`${base(projectId)}/verification-data`).then(json),

  create: (projectId, data) =>
    post(`${base(projectId)}/verification-data`, data).then(json),
};

// ============================================================
// VerificationResult (WP 15-52)
// ============================================================

export const verificationResultApi = {
  list: (projectId) =>
    fetch(`${base(projectId)}/verification-results`).then(json),

  create: (projectId, data) =>
    post(`${base(projectId)}/verification-results`, data).then(json),

  update: (projectId, vrId, data) =>
    put(`${base(projectId)}/verification-results/${vrId}`, data).then(json),

  delete: (projectId, vrId) =>
    del(`${base(projectId)}/verification-results/${vrId}`),
};
