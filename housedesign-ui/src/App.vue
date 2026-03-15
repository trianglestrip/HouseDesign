<script setup lang="ts">
import { inject, onMounted, onUnmounted } from 'vue';
import { EDITOR_ENGINE_KEY } from '@/constants/injectKeys';
import { EditorEvents } from '@housedesign/core';
import { useEditorStore } from '@/ui/stores/editorStore';
import TopBar from '@/ui/components/TopBar.vue';
import ToolPanel from '@/ui/components/ToolPanel.vue';
import PropertyPanel from '@/ui/components/PropertyPanel.vue';
import CanvasView from '@/ui/components/CanvasView.vue';
import SaveDialog from '@/ui/components/dialogs/SaveDialog.vue';
import LoadDialog from '@/ui/components/dialogs/LoadDialog.vue';

const engine = inject(EDITOR_ENGINE_KEY)!;
const editorStore = useEditorStore();

let unsubSelection: (() => void) | null = null;
let unsubUndoRedo: (() => void)[] = [];

onMounted(() => {
  unsubSelection = engine.events.on(
    EditorEvents.SELECTION_CHANGED,
    (ids: string[]) => {
      const first = ids[0];
      editorStore.selectElement(
        first ? engine.getElement(first) ?? null : null
      );
    }
  );

  const updateUndoRedo = () => {
    editorStore.setUndoRedoState(engine.canUndo, engine.canRedo);
  };
  unsubUndoRedo = [
    engine.events.on(EditorEvents.ELEMENT_ADDED, updateUndoRedo),
    engine.events.on(EditorEvents.ELEMENT_DELETED, updateUndoRedo),
    engine.events.on(EditorEvents.ELEMENT_MOVED, updateUndoRedo),
    engine.events.on(EditorEvents.ELEMENT_UPDATED, updateUndoRedo),
  ];
  updateUndoRedo();
});

onUnmounted(() => {
  unsubSelection?.();
  unsubUndoRedo.forEach((fn) => fn());
});
</script>

<template>
  <div class="app-root">
    <header class="app-header">
      <TopBar />
    </header>
    <main class="app-main">
      <aside class="app-sidebar app-sidebar-left">
        <ToolPanel />
      </aside>
      <section class="app-canvas">
        <CanvasView />
      </section>
      <aside class="app-sidebar app-sidebar-right">
        <PropertyPanel />
      </aside>
    </main>
  </div>
  <SaveDialog />
  <LoadDialog />
</template>

<style scoped>
.app-root {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color-page);
  overflow: hidden;
}

.app-header {
  flex-shrink: 0;
  height: 52px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.app-main {
  flex: 1;
  display: flex;
  min-height: 0;
}

.app-sidebar {
  flex-shrink: 0;
  width: 240px;
  background: var(--el-bg-color);
  border-right: 1px solid var(--el-border-color-lighter);
  overflow: hidden;
}

.app-sidebar-right {
  border-right: none;
  border-left: 1px solid var(--el-border-color-lighter);
}

.app-canvas {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  background: var(--el-fill-color-lighter);
}
</style>
