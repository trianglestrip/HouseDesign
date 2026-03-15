<template>
  <div class="toolbar">
    <button
      v-for="tool in tools"
      :key="tool.type"
      :class="{ active: currentTool === tool.type }"
      @click="selectTool(tool.type)"
      :title="tool.label"
    >
      {{ tool.icon }}
    </button>
    
    <div class="divider"></div>
    
    <button @click="undo" :disabled="!canUndo" title="撤销 (Ctrl+Z)">
      ↶
    </button>
    <button @click="redo" :disabled="!canRedo" title="重做 (Ctrl+Y)">
      ↷
    </button>
    
    <div class="divider"></div>
    
    <button @click="clear" title="清空画布">
      🗑
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useEditorStore } from '../stores/editorStore';
import { ToolType } from '@housedesign/core';

const editorStore = useEditorStore();

const tools = [
  { type: ToolType.Select, icon: '⬆', label: '选择工具' },
  { type: ToolType.DrawWall, icon: '📏', label: '绘制墙体' },
  { type: ToolType.Move, icon: '✋', label: '移动工具' }
];

const currentTool = computed(() => editorStore.currentTool);
const canUndo = computed(() => editorStore.canUndo);
const canRedo = computed(() => editorStore.canRedo);

function selectTool(tool: ToolType) {
  editorStore.setTool(tool);
}

function undo() {
  editorStore.undo();
}

function redo() {
  editorStore.redo();
}

function clear() {
  if (confirm('确定要清空画布吗？')) {
    editorStore.clear();
  }
}
</script>

<style scoped>
.toolbar {
  display: flex;
  gap: 8px;
  padding: 12px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

button {
  padding: 8px 16px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s;
}

button:hover:not(:disabled) {
  background: #f5f5f5;
  border-color: #0066FF;
}

button.active {
  background: #0066FF;
  color: white;
  border-color: #0066FF;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.divider {
  width: 1px;
  background: #e0e0e0;
  margin: 0 4px;
}
</style>
