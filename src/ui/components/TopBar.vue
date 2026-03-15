<script setup lang="ts">
import { useUIStore } from '../stores/uiStore';
import { useEditorStore } from '../stores/editorStore';
import {
  DocumentAdd,
  Document,
  FolderOpened,
  Download,
  RefreshLeft,
  RefreshRight,
  View,
} from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

const uiStore = useUIStore();
const editorStore = useEditorStore();

const handleNew = () => {
  editorStore.clearSelection();
  editorStore.setProjectName('未命名项目');
  editorStore.setHasUnsavedChanges(false);
  ElMessage.success('已新建项目');
};

const handleSave = () => {
  uiStore.openSaveDialog();
};

const handleLoad = () => {
  uiStore.openLoadDialog();
};

const handleExport = () => {
  ElMessage.info('导出功能开发中');
};

const handleUndo = () => {
  if (editorStore.canUndo) {
    ElMessage.info('撤销');
  } else {
    ElMessage.warning('无法撤销');
  }
};

const handleRedo = () => {
  if (editorStore.canRedo) {
    ElMessage.info('重做');
  } else {
    ElMessage.warning('无法重做');
  }
};

const handleViewModeChange = (mode: '2d' | '3d') => {
  if (mode === '3d' && !uiStore.is3DEnabled) {
    ElMessage.warning('3D 视图即将推出');
    return;
  }
  uiStore.setViewMode(mode);
};
</script>

<template>
  <header class="top-bar">
    <div class="top-bar-left">
      <h1 class="app-title">户型设计</h1>
      <el-divider direction="vertical" />
      <el-button-group>
        <el-button type="primary" :icon="DocumentAdd" @click="handleNew">新建</el-button>
        <el-button :icon="Document" @click="handleSave">保存</el-button>
        <el-button :icon="FolderOpened" @click="handleLoad">加载</el-button>
        <el-button :icon="Download" @click="handleExport">导出</el-button>
      </el-button-group>
      <el-divider direction="vertical" />
      <el-button-group>
        <el-button :icon="RefreshLeft" :disabled="!editorStore.canUndo" @click="handleUndo">
          撤销
        </el-button>
        <el-button :icon="RefreshRight" :disabled="!editorStore.canRedo" @click="handleRedo">
          重做
        </el-button>
      </el-button-group>
    </div>
    <div class="top-bar-right">
      <el-radio-group
        :model-value="uiStore.viewMode"
        size="default"
        @update:model-value="handleViewModeChange"
      >
        <el-radio-button value="2d">
          <el-icon><View /></el-icon>
          2D
        </el-radio-button>
        <el-radio-button value="3d" :disabled="!uiStore.is3DEnabled">
          <el-icon><View /></el-icon>
          3D
        </el-radio-button>
      </el-radio-group>
    </div>
  </header>
</template>

<style scoped>
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 100%;
  padding: 0;
}

.top-bar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.top-bar-right {
  display: flex;
  align-items: center;
}

.app-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: var(--el-text-color-primary);
}

:deep(.el-divider--vertical) {
  height: 24px;
  margin: 0 4px;
}
</style>
