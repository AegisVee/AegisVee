/**
 * useRequirements — SYS.1/SYS.2 Requirements domain hook
 *
 * Manages RequirementNode (WP 17-00) and RequirementAttribute (WP 17-54) state.
 * Preserves full backward compatibility with legacy useAppState requirement fields.
 */

import { useState, useCallback, useEffect } from "react";
import { requirementApi, requirementAttributeApi } from "../services/requirementApi";

export function useRequirements(projectId) {
  const [requirements, setRequirements] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ============================================================
  // Load
  // ============================================================

  const loadRequirements = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await requirementApi.list(projectId);
      setRequirements(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const loadAttributes = useCallback(async () => {
    if (!projectId) return;
    try {
      const data = await requirementAttributeApi.list(projectId);
      setAttributes(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to load requirement attributes:", e);
    }
  }, [projectId]);

  useEffect(() => {
    loadRequirements();
    loadAttributes();
  }, [loadRequirements, loadAttributes]);

  // ============================================================
  // RequirementNode CRUD
  // ============================================================

  const createRequirement = useCallback(
    async (data) => {
      const created = await requirementApi.create(projectId, data);
      setRequirements((prev) => [...prev, created]);
      return created;
    },
    [projectId]
  );

  const updateRequirement = useCallback(
    async (reqId, data) => {
      const updated = await requirementApi.update(projectId, reqId, data);
      setRequirements((prev) =>
        prev.map((r) => (r.id === reqId ? updated : r))
      );
      return updated;
    },
    [projectId]
  );

  const deleteRequirement = useCallback(
    async (reqId) => {
      await requirementApi.delete(projectId, reqId);
      setRequirements((prev) => prev.filter((r) => r.id !== reqId));
    },
    [projectId]
  );

  const bulkImportRequirements = useCallback(
    async (requirementsList) => {
      const result = await requirementApi.bulkImport(projectId, requirementsList);
      await loadRequirements(); // Refresh full list
      return result;
    },
    [projectId, loadRequirements]
  );

  const propagateParameters = useCallback(
    async (reqId, parameters) => {
      return requirementApi.propagate(projectId, reqId, parameters);
    },
    [projectId]
  );

  // ============================================================
  // RequirementAttribute CRUD
  // ============================================================

  const createAttribute = useCallback(
    async (data) => {
      const created = await requirementAttributeApi.create(projectId, data);
      setAttributes((prev) => [...prev, created]);
      return created;
    },
    [projectId]
  );

  const updateAttribute = useCallback(
    async (attrId, data) => {
      const updated = await requirementAttributeApi.update(projectId, attrId, data);
      setAttributes((prev) =>
        prev.map((a) => (a.id === attrId ? updated : a))
      );
      return updated;
    },
    [projectId]
  );

  const deleteAttribute = useCallback(
    async (attrId) => {
      await requirementAttributeApi.delete(projectId, attrId);
      setAttributes((prev) => prev.filter((a) => a.id !== attrId));
    },
    [projectId]
  );

  // ============================================================
  // Derived helpers
  // ============================================================

  const getAttributesForRequirement = useCallback(
    (reqId) => attributes.filter((a) => a.requirement_id === reqId),
    [attributes]
  );

  return {
    requirements,
    attributes,
    loading,
    error,
    // RequirementNode ops
    loadRequirements,
    createRequirement,
    updateRequirement,
    deleteRequirement,
    bulkImportRequirements,
    propagateParameters,
    // RequirementAttribute ops
    loadAttributes,
    createAttribute,
    updateAttribute,
    deleteAttribute,
    getAttributesForRequirement,
  };
}
