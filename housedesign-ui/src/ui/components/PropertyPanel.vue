<script setup lang="ts">
import { computed } from 'vue';
import { useEditorStore } from '../stores/editorStore';
import { ElementType } from '@/constants/elementTypes';
import { inject } from 'vue';
import { EDITOR_ENGINE_KEY } from '@/constants/injectKeys';
import type { EditorEngine } from '@housedesign/core';

const editorStore = useEditorStore();
const engine = inject<EditorEngine>(EDITOR_ENGINE_KEY)!;
const selectedElement = computed(() => editorStore.selectedElement);

const positionX = computed({
  get: () => selectedElement.value?.x ?? 0,
  set: (v) => {
    const el = selectedElement.value;
    if (el) engine.updateElement(el.id, { x: Number(v) });
  },
});
const positionY = computed({
  get: () => selectedElement.value?.y ?? 0,
  set: (v) => {
    const el = selectedElement.value;
    if (el) engine.updateElement(el.id, { y: Number(v) });
  },
});

const width = computed({
  get: () => selectedElement.value?.width ?? 0,
  set: (v) => {
    const el = selectedElement.value;
    if (el) engine.updateElement(el.id, { width: Number(v) });
  },
});
const height = computed({
  get: () => selectedElement.value?.height ?? 0,
  set: (v) => {
    const el = selectedElement.value;
    if (el) engine.updateElement(el.id, { height: Number(v) });
  },
});

const furnitureName = computed({
  get: () =>
    (selectedElement.value?.properties?.name as string) ?? '',
  set: (v) => {
    const el = selectedElement.value;
    if (el)
      engine.updateElement(el.id, {
        properties: { ...el.properties, name: String(v) },
      });
  },
});

const showFurnitureName = computed(
  () => selectedElement.value?.type === ElementType.FURNITURE
);
</script>

<template>
  <aside class="property-panel">
    <div class="panel-header">
      <span class="panel-title">属性</span>
    </div>
    <div v-if="selectedElement" class="panel-content">
      <div class="element-info">
        <el-tag size="small">{{ editorStore.selectedElementLabel }}</el-tag>
      </div>
      <el-form label-position="top" size="small" class="property-form">
        <el-form-item v-if="showFurnitureName" label="名称">
          <el-input v-model="furnitureName" placeholder="请输入名称" />
        </el-form-item>
        <el-divider content-position="left">位置</el-divider>
        <el-form-item label="X">
          <el-input-number
            v-model="positionX"
            :precision="0"
            :controls="false"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="Y">
          <el-input-number
            v-model="positionY"
            :precision="0"
            :controls="false"
            style="width: 100%"
          />
        </el-form-item>
        <el-divider content-position="left">尺寸</el-divider>
        <el-form-item label="宽度">
          <el-input-number
            v-model="width"
            :min="1"
            :precision="0"
            :controls="false"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="高度">
          <el-input-number
            v-model="height"
            :min="1"
            :precision="0"
            :controls="false"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
    </div>
    <div v-else class="panel-empty">
      <el-empty description="请选择一个元素查看属性" :image-size="80" />
    </div>
  </aside>
</template>

<style scoped>
.property-panel {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.panel-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.panel-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.element-info {
  margin-bottom: 16px;
}

.property-form :deep(.el-form-item) {
  margin-bottom: 12px;
}

.property-form :deep(.el-divider) {
  margin: 16px 0 12px;
}
</style>
