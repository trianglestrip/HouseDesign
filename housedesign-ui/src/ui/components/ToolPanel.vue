<script setup lang="ts">
import { useEditorStore } from '../stores/editorStore';
import type { DrawTool } from '../stores/editorStore';
import { Pointer } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

const editorStore = useEditorStore();

// 墙体类型
const wallTypes = [
  { value: 'wall-solid', label: '实心墙', svg: '/src/assets/svg/walls/wall-solid.svg' },
  { value: 'wall-dashed', label: '虚线墙', svg: '/src/assets/svg/walls/wall-dashed.svg' },
  { value: 'wall-double', label: '双线墙', svg: '/src/assets/svg/walls/wall-double.svg' },
];

// 门类型
const doorTypes = [
  { value: 'door-single', label: '单开门', svg: '/src/assets/svg/doors/door-single.svg' },
  { value: 'door-double', label: '双开门', svg: '/src/assets/svg/doors/door-double.svg' },
  { value: 'door-sliding', label: '推拉门', svg: '/src/assets/svg/doors/door-sliding.svg' },
  { value: 'door-folding', label: '折叠门', svg: '/src/assets/svg/doors/door-folding.svg' },
];

// 窗类型
const windowTypes = [
  { value: 'window-single', label: '单扇窗', svg: '/src/assets/svg/windows/window-single.svg' },
  { value: 'window-double', label: '双扇窗', svg: '/src/assets/svg/windows/window-double.svg' },
  { value: 'window-bay', label: '飘窗', svg: '/src/assets/svg/windows/window-bay.svg' },
  { value: 'window-sliding', label: '推拉窗', svg: '/src/assets/svg/windows/window-sliding.svg' },
];

// 家具类型
const furnitureCategories = [
  {
    name: '客厅',
    items: [
      { id: 'sofa', name: '沙发', svg: '/src/assets/svg/furniture/sofa.svg' },
      { id: 'tv-stand', name: '电视柜', svg: '/src/assets/svg/furniture/tv-stand.svg' },
      { id: 'coffee-table', name: '茶几', svg: '/src/assets/svg/furniture/table.svg' },
    ],
  },
  {
    name: '卧室',
    items: [
      { id: 'bed', name: '床', svg: '/src/assets/svg/furniture/bed.svg' },
      { id: 'nightstand', name: '床头柜', svg: '/src/assets/svg/furniture/nightstand.svg' },
      { id: 'wardrobe', name: '衣柜', svg: '/src/assets/svg/furniture/wardrobe.svg' },
    ],
  },
  {
    name: '餐厅',
    items: [
      { id: 'table', name: '餐桌', svg: '/src/assets/svg/furniture/table.svg' },
      { id: 'chair', name: '椅子', svg: '/src/assets/svg/furniture/chair.svg' },
      { id: 'cabinet', name: '餐边柜', svg: '/src/assets/svg/furniture/cabinet.svg' },
    ],
  },
];

const selectTool = (tool: DrawTool) => {
  editorStore.setCurrentTool(tool);
};

const selectWallType = (type: string) => {
  editorStore.setCurrentTool('wall');
  editorStore.setSelectedWallType(type);
  ElMessage.success(`已选择: ${wallTypes.find(w => w.value === type)?.label}`);
};

const selectDoorType = (type: string) => {
  editorStore.setCurrentTool('door');
  editorStore.setSelectedDoorType(type);
  ElMessage.success(`已选择: ${doorTypes.find(d => d.value === type)?.label}`);
};

const selectWindowType = (type: string) => {
  editorStore.setCurrentTool('window');
  editorStore.setSelectedWindowType(type);
  ElMessage.success(`已选择: ${windowTypes.find(w => w.value === type)?.label}`);
};

const addFurniture = (item: { id: string; name: string }) => {
  editorStore.setCurrentTool('select');
  ElMessage.success(`已选择家具: ${item.name}，请在画布上点击放置`);
};
</script>

<template>
  <aside class="tool-panel">
    <!-- 基础工具 -->
    <div class="panel-section">
      <div class="section-title">基础工具</div>
      <el-button
        :type="editorStore.currentTool === 'select' ? 'primary' : ''"
        class="tool-button"
        @click="selectTool('select')"
      >
        <el-icon><Pointer /></el-icon>
        <span>选择</span>
      </el-button>
    </div>

    <el-divider />

    <!-- 墙体工具 -->
    <div class="panel-section">
      <div class="section-title">墙体</div>
      <div class="type-grid">
        <div
          v-for="wall in wallTypes"
          :key="wall.value"
          :class="['type-item', { active: editorStore.currentTool === 'wall' }]"
          @click="selectWallType(wall.value)"
        >
          <img :src="wall.svg" :alt="wall.label" class="type-svg" />
          <span class="type-label">{{ wall.label }}</span>
        </div>
      </div>
    </div>

    <el-divider />

    <!-- 门工具 -->
    <div class="panel-section">
      <div class="section-title">门</div>
      <div class="type-grid">
        <div
          v-for="door in doorTypes"
          :key="door.value"
          :class="['type-item', { active: editorStore.currentTool === 'door' }]"
          @click="selectDoorType(door.value)"
        >
          <img :src="door.svg" :alt="door.label" class="type-svg" />
          <span class="type-label">{{ door.label }}</span>
        </div>
      </div>
    </div>

    <el-divider />

    <!-- 窗工具 -->
    <div class="panel-section">
      <div class="section-title">窗</div>
      <div class="type-grid">
        <div
          v-for="window in windowTypes"
          :key="window.value"
          :class="['type-item', { active: editorStore.currentTool === 'window' }]"
          @click="selectWindowType(window.value)"
        >
          <img :src="window.svg" :alt="window.label" class="type-svg" />
          <span class="type-label">{{ window.label }}</span>
        </div>
      </div>
    </div>

    <el-divider />

    <!-- 家具库 -->
    <div class="panel-section">
      <div class="section-title">家具库</div>
      <div class="furniture-categories">
        <div v-for="category in furnitureCategories" :key="category.name" class="furniture-category">
          <div class="category-name">{{ category.name }}</div>
          <div class="type-grid">
            <div
              v-for="item in category.items"
              :key="item.id"
              class="type-item"
              @click="addFurniture(item)"
            >
              <img :src="item.svg" :alt="item.name" class="type-svg" />
              <span class="type-label">{{ item.name }}</span>
            </div>
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

.tool-button {
  width: 100%;
  justify-content: flex-start;
  margin-bottom: 8px;
}

.tool-button .el-icon {
  margin-right: 8px;
}

.type-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.type-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px 8px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.type-item:hover {
  background: var(--el-fill-color);
  border-color: var(--el-color-primary-light-5);
}

.type-item.active {
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary);
}

.type-svg {
  width: 40px;
  height: 40px;
  margin-bottom: 4px;
  object-fit: contain;
}

.type-label {
  font-size: 11px;
  color: var(--el-text-color-regular);
  text-align: center;
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

:deep(.el-divider) {
  margin: 16px 0;
}
</style>
