/**
 * architectureApi.js — SYS.3 Architecture API Service
 *
 * Covers:
 * - ArchitectureElement (WP 04-06) CRUD + canvas position updates
 * - SpecialCharacteristic (WP 17-57) CRUD
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
// ArchitectureElement (WP 04-06)
// ============================================================

export const architectureApi = {
  /** List all architecture elements */
  list: (projectId) =>
    fetch(`${API_BASE}/projects/${projectId}/architecture`).then(json),

  /** Get a single element by ID */
  get: (projectId, elemId) =>
    fetch(`${API_BASE}/projects/${projectId}/architecture/${elemId}`).then(json),

  /** Create a new architecture element */
  create: (projectId, data) =>
    post(`${API_BASE}/projects/${projectId}/architecture`, data).then(json),

  /** Update an architecture element */
  update: (projectId, elemId, data) =>
    put(
      `${API_BASE}/projects/${projectId}/architecture/${elemId}`,
      data
    ).then(json),

  /** Delete an architecture element */
  delete: (projectId, elemId) =>
    fetch(`${API_BASE}/projects/${projectId}/architecture/${elemId}`, {
      method: "DELETE",
    }).then(json),

  /** Update only the canvas position (used by @xyflow/react drag events) */
  updateCanvasPosition: (projectId, elemId, canvasPosition, canvasStyle) =>
    put(
      `${API_BASE}/projects/${projectId}/architecture/${elemId}/canvas`,
      { canvas_position: canvasPosition, canvas_style: canvasStyle }
    ).then(json),
};

// ============================================================
// SpecialCharacteristic (WP 17-57)
// ============================================================

export const specialCharacteristicApi = {
  /** List all special characteristics */
  list: (projectId) =>
    fetch(
      `${API_BASE}/projects/${projectId}/special-characteristics`
    ).then(json),

  /** Get a single special characteristic by ID */
  get: (projectId, scId) =>
    fetch(
      `${API_BASE}/projects/${projectId}/special-characteristics/${scId}`
    ).then(json),

  /** Create a new special characteristic */
  create: (projectId, data) =>
    post(
      `${API_BASE}/projects/${projectId}/special-characteristics`,
      data
    ).then(json),

  /** Update a special characteristic */
  update: (projectId, scId, data) =>
    put(
      `${API_BASE}/projects/${projectId}/special-characteristics/${scId}`,
      data
    ).then(json),

  /** Delete a special characteristic */
  delete: (projectId, scId) =>
    fetch(
      `${API_BASE}/projects/${projectId}/special-characteristics/${scId}`,
      { method: "DELETE" }
    ).then(json),
};
