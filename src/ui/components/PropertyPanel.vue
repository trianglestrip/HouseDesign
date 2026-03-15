<script setup lang="ts">
import { computed } from 'vue';
import { useEditorStore } from '../stores/editorStore';
import type { IElement } from '@/core/interfaces/IElement';
import { ElementType } from '@/constants/elementTypes';

const editorStore = useEditorStore();
const selectedElement = computed(() => editorStore.selectedElement);

const positionX = computed({
  get: () => selectedElement.value?.position.x ?? 0,
  set: (v) => {
    const el = selectedElement.value;
    if (el) el.position.x = Number(v);
  },
});
const positionY = computed({
  get: () => selectedElement.value?.position.y ?? 0,
  set: (v) => {
    const el = selectedElement.value;
    if (el) el.position.y = Number(v);
  },
});
const positionZ = computed({
  get: () => selectedElement.value?.position.z ?? 0,
  set: (v) => {
    const el = selectedElement.value;
    if (el) el.position.z = Number(v);
  },
});

const width = computed({
  get: () => selectedElement.value?.width ?? 0,
  set: (v) => {
    const el = selectedElement.value;
    if (el) el.width = Number(v);
  },
});
const height = computed({
  get: () => selectedElement.value?.height ?? 0,
  set: (v) => {
    const el = selectedElement.value;
    if (el) el.height = Number(v);
  },
});
const depth = computed({
  get: () => selectedElement.value?.depth ?? 0,
  set: (v) => {
    const el = selectedElement.value;
    if (el) el.depth = Number(v);
  },
});

const rotationX = computed({
  get: () => selectedElement.value?.rotation.x ?? 0,
  set: (v) => {
    const el = selectedElement.value;
    if (el) el.rotation.x = Number(v);
  },
});
const rotationY = computed({
  get: () => selectedElement.value?.rotation.y ?? 0,
  set: (v) => {
    const el = selectedElement.value;
    if (el) el.rotation.y = Number(v);
  },
});
const rotationZ = computed({
  get: () => selectedElement.value?.rotation.z ?? 0,
  set: (v) => {
    const el = selectedElement.value;
    if (el) el.rotation.z = Number(v);
  },
});

const furnitureName = computed({
  get: () => (selectedElement.value as IElement & { name?: string })?.name ?? '',
  set: (v) => {
    const el = selectedElement.value as IElement & { name?: string };
    if (el && 'name' in el) el.name = String(v);
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
          <el-input v-model="furnitureName" placeholder="家具名称" />
        </el-form-item>
        <el-divider content-position="left">位置</el-divider>
        <el-form-item label="X">
          <el-input-number v-model="positionX" :precision="0" :controls="false" style="width: 100%" />
        </el-form-item>
        <el-form-item label="Y">
          <el-input-number v-model="positionY" :precision="0" :controls="false" style="width: 100%" />
        </el-form-item>
        <el-form-item label="Z">
          <el-input-number v-model="positionZ" :precision="0" :controls="false" style="width: 100%" />
        </el-form-item>
        <el-divider content-position="left">尺寸</el-divider>
        <el-form-item label="宽度">
          <el-input-number v-model="width" :min="1" :precision="0" :controls="false" style="width: 100%" />
        </el-form-item>
        <el-form-item label="高度">
          <el-input-number v-model="height" :min="1" :precision="0" :controls="false" style="width: 100%" />
        </el-form-item>
        <el-form-item label="深度">
          <el-input-number v-model="depth" :min="1" :precision="0" :controls="false" style="width: 100%" />
        </el-form-item>
        <el-divider content-position="left">旋转</el-divider>
        <el-form-item label="X (度)">
          <el-input-number v-model="rotationX" :precision="0" :controls="false" style="width: 100%" />
        </el-form-item>
        <el-form-item label="Y (度)">
          <el-input-number v-model="rotationY" :precision="0" :controls="false" style="width: 100%" />
        </el-form-item>
        <el-form-item label="Z (度)">
          <el-input-number v-model="rotationZ" :precision="0" :controls="false" style="width: 100%" />
        </el-form-item>
      </el-form>
    </div>
    <div v-else class="panel-empty">
      <el-empty description="选择对象以编辑属性" :image-size="80" />
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
