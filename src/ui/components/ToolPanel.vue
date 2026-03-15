<script setup lang="ts">
import { useEditorStore } from '../stores/editorStore';
import type { DrawTool } from '../stores/editorStore';
import { Pointer, Grid, Sunny, Box } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

const editorStore = useEditorStore();

const drawTools: { value: DrawTool; label: string; icon: typeof Pointer }[] = [
  { value: 'select', label: '选择', icon: Pointer },
  { value: 'wall', label: '墙体', icon: Grid },
  { value: 'door', label: '门', icon: Box },
  { value: 'window', label: '窗', icon: Sunny },
];

const furnitureCategories = [
  {
    name: '客厅',
    items: [
      { id: 'sofa', name: '沙发' },
      { id: 'tv-stand', name: '电视柜' },
      { id: 'chair', name: '椅子' },
    ],
  },
  {
    name: '卧室',
    items: [
      { id: 'bed', name: '床' },
      { id: 'nightstand', name: '床头柜' },
      { id: 'wardrobe', name: '衣柜' },
    ],
  },
  {
    name: '餐厅/书房',
    items: [
      { id: 'table', name: '桌子' },
      { id: 'chair', name: '椅子' },
      { id: 'cabinet', name: '柜子' },
    ],
  },
];

const selectTool = (tool: DrawTool) => {
  editorStore.setCurrentTool(tool);
};

const addFurniture = (item: { id: string; name: string }) => {
  editorStore.setCurrentTool('select');
  ElMessage.success(`已选择家具: ${item.name}，请在画布上点击放置`);
};
</script>

<template>
  <aside class="tool-panel">
    <div class="panel-section">
      <div class="section-title">绘制工具</div>
      <el-radio-group
        :model-value="editorStore.currentTool"
        class="tool-group"
        @update:model-value="selectTool"
      >
        <el-radio-button v-for="tool in drawTools" :key="tool.value" :value="tool.value">
          <el-icon><component :is="tool.icon" /></el-icon>
          {{ tool.label }}
        </el-radio-button>
      </el-radio-group>
    </div>
    <el-divider />
    <div class="panel-section">
      <div class="section-title">家具库</div>
      <div class="furniture-categories">
        <div v-for="category in furnitureCategories" :key="category.name" class="furniture-category">
          <div class="category-name">{{ category.name }}</div>
          <div class="furniture-grid">
            <el-tooltip
              v-for="item in category.items"
              :key="item.id"
              :content="item.name"
              placement="right"
            >
              <div class="furniture-item" @click="addFurniture(item)">
                <el-icon class="furniture-icon"><Box /></el-icon>
                <span class="furniture-label">{{ item.name }}</span>
              </div>
            </el-tooltip>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.tool-panel {
  width: 100%;
  height: 100%;
  padding: 16px;
  overflow-y: auto;
}

.panel-section {
  margin-bottom: 12px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 12px;
}

.tool-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tool-group :deep(.el-radio-button) {
  margin: 0;
}

.tool-group :deep(.el-radio-button__inner) {
  width: 100%;
  justify-content: flex-start;
}

.furniture-categories {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.furniture-category {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.category-name {
  font-size: 12px;
  font-weight: 500;
  color: var(--el-text-color-secondary);
}

.furniture-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.furniture-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px 8px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.furniture-item:hover {
  background: var(--el-fill-color);
  border-color: var(--el-color-primary);
}

.furniture-icon {
  font-size: 24px;
  margin-bottom: 4px;
}

.furniture-label {
  font-size: 11px;
  color: var(--el-text-color-regular);
  text-align: center;
}
</style>
