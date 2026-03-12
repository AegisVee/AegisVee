/**
 * traceabilityApi.js — Traceability Link API Service
 *
 * Covers:
 * - TraceabilityLink CRUD
 * - Traceability matrix
 * - Coverage analysis
 * - Gap detection
 * - Impact analysis
 * - Chain traversal
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

const base = (projectId) =>
  `${API_BASE}/projects/${projectId}/traceability`;

export const traceabilityApi = {
  // ============================================================
  // TraceabilityLink CRUD
  // ============================================================

  /** List all traceability links */
  listLinks: (projectId) =>
    fetch(`${base(projectId)}/links`).then(json),

  /** Get a single link by ID */
  getLink: (projectId, linkId) =>
    fetch(`${base(projectId)}/links/${linkId}`).then(json),

  /** Create a new traceability link */
  createLink: (projectId, data) =>
    post(`${base(projectId)}/links`, data).then(json),

  /** Delete a traceability link */
  deleteLink: (projectId, linkId) =>
    fetch(`${base(projectId)}/links/${linkId}`, { method: "DELETE" }).then(json),

  /** Get all links for a specific entity (source or target) */
  getLinksForEntity: (projectId, entityId) =>
    fetch(`${base(projectId)}/links/entity/${entityId}`).then(json),

  // ============================================================
  // Traceability Matrix
  // ============================================================

  /**
   * Get the full traceability matrix.
   * Returns requirements → architecture → verification → results mapping.
   */
  getMatrix: (projectId) =>
    fetch(`${base(projectId)}/matrix`).then(json),

  // ============================================================
  // Coverage Analysis
  // ============================================================

  /** Get traceability coverage statistics per entity type */
  getCoverage: (projectId) =>
    fetch(`${base(projectId)}/coverage`).then(json),

  // ============================================================
  // Gap Detection
  // ============================================================

  /** Find entities missing required traceability links */
  getGaps: (projectId) =>
    fetch(`${base(projectId)}/gaps`).then(json),

  // ============================================================
  // Impact Analysis
  // ============================================================

  /**
   * Perform impact analysis for a given entity.
   * Returns all directly and indirectly affected entities via BFS.
   */
  getImpact: (projectId, entityId, entityType = "") =>
    fetch(
      `${base(projectId)}/impact/${entityId}?entity_type=${encodeURIComponent(entityType)}`
    ).then(json),

  // ============================================================
  // Chain Traversal
  // ============================================================

  /**
   * Get the full traceability chain from a given entity.
   * Returns all reachable entities with depth and link type.
   */
  getChain: (projectId, entityId, maxDepth = 10) =>
    fetch(
      `${base(projectId)}/chain/${entityId}?max_depth=${maxDepth}`
    ).then(json),
};
