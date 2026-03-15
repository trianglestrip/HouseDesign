import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { EditorEngine, ToolType } from '@housedesign/core';

export const useEditorStore = defineStore('editor', () => {
  const engine = ref<EditorEngine>(new EditorEngine());
  const currentTool = ref<ToolType | null>(null);
  const canUndo = ref(false);
  const canRedo = ref(false);

  function setTool(tool: ToolType) {
    engine.value.toolManager.activateTool(tool);
    currentTool.value = tool;
  }

  function undo() {
    const result = engine.value.undoRedo.undo();
    if (result) {
      updateUndoRedoState();
    }
  }

  function redo() {
    const result = engine.value.undoRedo.redo();
    if (result) {
      updateUndoRedoState();
    }
  }

  function updateUndoRedoState() {
    canUndo.value = engine.value.undoRedo.canUndo();
    canRedo.value = engine.value.undoRedo.canRedo();
  }

  function clear() {
    engine.value.clear();
    updateUndoRedoState();
  }

  const wallCount = computed(() => engine.value.getWalls().size);
  const roomCount = computed(() => engine.value.getRooms().size);
  const nodeCount = computed(() => engine.value.getGraph().getAllNodes().length);

  return {
    engine,
    currentTool,
    canUndo,
    canRedo,
    wallCount,
    roomCount,
    nodeCount,
    setTool,
    undo,
    redo,
    updateUndoRedoState,
    clear
  };
});
