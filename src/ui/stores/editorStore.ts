/**
 * 编辑器状态管理 - Pinia Store
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { IElement } from '@/core/interfaces/IElement';
import { ElementType } from '@/constants/elementTypes';

export type DrawTool = 'select' | 'wall' | 'door' | 'window';

export const useEditorStore = defineStore('editor', () => {
  const currentTool = ref<DrawTool>('select');
  const selectedElement = ref<IElement | null>(null);
  const hasUnsavedChanges = ref(false);
  const projectName = ref('未命名项目');
  const canUndo = ref(false);
  const canRedo = ref(false);

  const isSelectTool = computed(() => currentTool.value === 'select');
  const isWallTool = computed(() => currentTool.value === 'wall');
  const isDoorTool = computed(() => currentTool.value === 'door');
  const isWindowTool = computed(() => currentTool.value === 'window');
  const selectedElementType = computed(() => selectedElement.value?.type ?? null);
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
    const furnitureEl = el as IElement & { name?: string };
    if (el.type === ElementType.FURNITURE && furnitureEl.name) {
      return `${label}: ${furnitureEl.name}`;
    }
    return label;
  });

  const setCurrentTool = (tool: DrawTool) => {
    currentTool.value = tool;
  };
  const selectElement = (element: IElement | null) => {
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

  return {
    currentTool,
    selectedElement,
    hasUnsavedChanges,
    projectName,
    canUndo,
    canRedo,
    isSelectTool,
    isWallTool,
    isDoorTool,
    isWindowTool,
    selectedElementType,
    selectedElementLabel,
    setCurrentTool,
    selectElement,
    setHasUnsavedChanges,
    setProjectName,
    setUndoRedoState,
    clearSelection,
  };
});
