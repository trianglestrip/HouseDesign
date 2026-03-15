/**
 * 编辑器状态管理 - Pinia Store
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { EditorElement } from '@housedesign/core';
import { ElementType } from '@/constants/elementTypes';

export type DrawTool = 'select' | 'wall' | 'door' | 'window';

export const useEditorStore = defineStore('editor', () => {
  const currentTool = ref<DrawTool>('select');
  const selectedElement = ref<EditorElement | null>(null);
  const hasUnsavedChanges = ref(false);
  const projectName = ref('未命名项目');
  const canUndo = ref(false);
  const canRedo = ref(false);

  // 选中的类型
  const selectedWallType = ref('wall-solid');
  const selectedDoorType = ref('door-single');
  const selectedWindowType = ref('window-single');

  const isSelectTool = computed(() => currentTool.value === 'select');
  const selectedElementLabel = computed(() => {
    const el = selectedElement.value;
    if (!el) return null;
    const typeLabels: Record<string, string> = {
      [ElementType.WALL]: '墙体',
      [ElementType.DOOR]: '门',
      [ElementType.WINDOW]: '窗',
      [ElementType.FURNITURE]: '家具',
      [ElementType.ROOM]: '房间',
    };
    const label = typeLabels[el.type] ?? el.type;
    const name = (el.properties?.name as string) ?? '';
    if (el.type === ElementType.FURNITURE && name) {
      return `${label}: ${name}`;
    }
    return label;
  });

  const setCurrentTool = (tool: DrawTool) => {
    currentTool.value = tool;
  };
  const selectElement = (element: EditorElement | null) => {
    selectedElement.value = element;
  };
  const setHasUnsavedChanges = (value: boolean) => {
    hasUnsavedChanges.value = value;
  };
  const setProjectName = (name: string) => {
    projectName.value = name;
  };
  const setUndoRedoState = (undo: boolean, redo: boolean) => {
    canUndo.value = undo;
    canRedo.value = redo;
  };
  const clearSelection = () => {
    selectedElement.value = null;
  };

  const setSelectedWallType = (type: string) => {
    selectedWallType.value = type;
  };
  const setSelectedDoorType = (type: string) => {
    selectedDoorType.value = type;
  };
  const setSelectedWindowType = (type: string) => {
    selectedWindowType.value = type;
  };

  return {
    currentTool,
    selectedElement,
    hasUnsavedChanges,
    projectName,
    canUndo,
    canRedo,
    selectedWallType,
    selectedDoorType,
    selectedWindowType,
    isSelectTool,
    selectedElementLabel,
    setCurrentTool,
    selectElement,
    setHasUnsavedChanges,
    setProjectName,
    setUndoRedoState,
    clearSelection,
    setSelectedWallType,
    setSelectedDoorType,
    setSelectedWindowType,
  };
});
