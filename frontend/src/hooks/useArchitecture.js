/**
 * useArchitecture — SYS.3 Architecture domain hook
 *
 * Manages ArchitectureElement (WP 04-06) and SpecialCharacteristic (WP 17-57) state.
 * Includes canvas position helpers for @xyflow/react integration.
 */

import { useState, useCallback, useEffect } from "react";
import {
  architectureApi,
  specialCharacteristicApi,
} from "../services/architectureApi";

export function useArchitecture(projectId) {
  const [elements, setElements] = useState([]);
  const [specialCharacteristics, setSpecialCharacteristics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ============================================================
  // Load
  // ============================================================

  const loadElements = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await architectureApi.list(projectId);
      setElements(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const loadSpecialCharacteristics = useCallback(async () => {
    if (!projectId) return;
    try {
      const data = await specialCharacteristicApi.list(projectId);
      setSpecialCharacteristics(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to load special characteristics:", e);
    }
  }, [projectId]);

  useEffect(() => {
    loadElements();
    loadSpecialCharacteristics();
  }, [loadElements, loadSpecialCharacteristics]);

  // ============================================================
  // ArchitectureElement CRUD
  // ============================================================

  const createElement = useCallback(
    async (data) => {
      const created = await architectureApi.create(projectId, data);
      setElements((prev) => [...prev, created]);
      return created;
    },
    [projectId]
  );

  const updateElement = useCallback(
    async (elemId, data) => {
      const updated = await architectureApi.update(projectId, elemId, data);
      setElements((prev) =>
        prev.map((e) => (e.id === elemId ? updated : e))
      );
      return updated;
    },
    [projectId]
  );

  const deleteElement = useCallback(
    async (elemId) => {
      await architectureApi.delete(projectId, elemId);
      setElements((prev) => prev.filter((e) => e.id !== elemId));
    },
    [projectId]
  );

  /**
   * Update only canvas position — called by @xyflow/react onNodeDragStop
   * Uses optimistic update to avoid UI flicker.
   */
  const updateCanvasPosition = useCallback(
    async (elemId, canvasPosition, canvasStyle) => {
      // Optimistic update
      setElements((prev) =>
        prev.map((e) =>
          e.id === elemId
            ? { ...e, canvas_position: canvasPosition, canvas_style: canvasStyle }
            : e
        )
      );
      try {
        await architectureApi.updateCanvasPosition(
          projectId,
          elemId,
          canvasPosition,
          canvasStyle
        );
      } catch (e) {
        console.error("Failed to persist canvas position:", e);
        await loadElements(); // Revert on error
      }
    },
    [projectId, loadElements]
  );

  // ============================================================
  // SpecialCharacteristic CRUD
  // ============================================================

  const createSpecialCharacteristic = useCallback(
    async (data) => {
      const created = await specialCharacteristicApi.create(projectId, data);
      setSpecialCharacteristics((prev) => [...prev, created]);
      return created;
    },
    [projectId]
  );

  const updateSpecialCharacteristic = useCallback(
    async (scId, data) => {
      const updated = await specialCharacteristicApi.update(projectId, scId, data);
      setSpecialCharacteristics((prev) =>
        prev.map((sc) => (sc.id === scId ? updated : sc))
      );
      return updated;
    },
    [projectId]
  );

  const deleteSpecialCharacteristic = useCallback(
    async (scId) => {
      await specialCharacteristicApi.delete(projectId, scId);
      setSpecialCharacteristics((prev) =>
        prev.filter((sc) => sc.id !== scId)
      );
    },
    [projectId]
  );

  // ============================================================
  // @xyflow/react node format helpers
  // ============================================================

  /**
   * Convert ArchitectureElements to @xyflow/react node format.
   * Preserves canvas_position for layout persistence.
   */
  const toFlowNodes = useCallback(
    () =>
      elements.map((elem) => ({
        id: elem.id,
        type: "architectureNode",
        position: elem.canvas_position || { x: 0, y: 0 },
        style: elem.canvas_style || {},
        data: {
          label: elem.name,
          element_type: elem.element_type,
          aspect: elem.aspect,
          description: elem.description,
          interfaces: elem.interfaces,
        },
      })),
    [elements]
  );

  return {
    elements,
    specialCharacteristics,
    loading,
    error,
    // ArchitectureElement ops
    loadElements,
    createElement,
    updateElement,
    deleteElement,
    updateCanvasPosition,
    toFlowNodes,
    // SpecialCharacteristic ops
    loadSpecialCharacteristics,
    createSpecialCharacteristic,
    updateSpecialCharacteristic,
    deleteSpecialCharacteristic,
  };
}
