/**
 * requirementApi.js — SYS.1 + SYS.2 Requirements API Service
 *
 * Covers:
 * - RequirementNode (WP 17-00) CRUD
 * - RequirementAttribute (WP 17-54) CRUD
 * - Parameter propagation
 * - Bulk import
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

// ============================================================
// RequirementNode (WP 17-00)
// ============================================================

export const requirementApi = {
  /** List all requirements for a project */
  list: (projectId) =>
    fetch(`${API_BASE}/projects/${projectId}/requirements`).then(json),

  /** Get a single requirement by ID */
  get: (projectId, reqId) =>
    fetch(`${API_BASE}/projects/${projectId}/requirements/${reqId}`).then(json),

  /** Create a new requirement */
  create: (projectId, data) =>
    post(`${API_BASE}/projects/${projectId}/requirements`, data).then(json),

  /** Update an existing requirement */
  update: (projectId, reqId, data) =>
    put(`${API_BASE}/projects/${projectId}/requirements/${reqId}`, data).then(json),

  /** Delete a requirement */
  delete: (projectId, reqId) =>
    fetch(`${API_BASE}/projects/${projectId}/requirements/${reqId}`, {
      method: "DELETE",
    }).then(json),

  /** Bulk import requirements */
  bulkImport: (projectId, requirements, createdBy = "") =>
    post(`${API_BASE}/projects/${projectId}/requirements/bulk`, {
      requirements,
      created_by: createdBy,
    }).then(json),

  /** Propagate parameter changes to linked verification measures */
  propagate: (projectId, reqId, parameters) =>
    post(
      `${API_BASE}/projects/${projectId}/requirements/${reqId}/propagate`,
      { parameters }
    ).then(json),
};

// ============================================================
// RequirementAttribute (WP 17-54)
// ============================================================

export const requirementAttributeApi = {
  /** List all attributes for a project */
  list: (projectId) =>
    fetch(`${API_BASE}/projects/${projectId}/requirement-attributes`).then(json),

  /** Get attributes for a specific requirement */
  listByRequirement: async (projectId, reqId) => {
    const all = await fetch(
      `${API_BASE}/projects/${projectId}/requirement-attributes`
    ).then(json);
    return all.filter((a) => a.requirement_id === reqId);
  },

  /** Get a single attribute by ID */
  get: (projectId, attrId) =>
    fetch(
      `${API_BASE}/projects/${projectId}/requirement-attributes/${attrId}`
    ).then(json),

  /** Create a new requirement attribute */
  create: (projectId, data) =>
    post(
      `${API_BASE}/projects/${projectId}/requirement-attributes`,
      data
    ).then(json),

  /** Update an attribute */
  update: (projectId, attrId, data) =>
    put(
      `${API_BASE}/projects/${projectId}/requirement-attributes/${attrId}`,
      data
    ).then(json),

  /** Delete an attribute */
  delete: (projectId, attrId) =>
    fetch(
      `${API_BASE}/projects/${projectId}/requirement-attributes/${attrId}`,
      { method: "DELETE" }
    ).then(json),
};
