<script setup lang="ts">
import { ref, watch } from 'vue';
import { useUIStore } from '../../stores/uiStore';
import { useEditorStore } from '../../stores/editorStore';
import { inject } from 'vue';
import { EDITOR_ENGINE_KEY } from '@/constants/injectKeys';
import { LocalStorageManager } from '@/data/storage/LocalStorageManager';
import { ElMessage } from 'element-plus';
import type { EditorEngine } from '@housedesign/core';

const uiStore = useUIStore();
const editorStore = useEditorStore();
const editorEngine = inject<EditorEngine>(EDITOR_ENGINE_KEY);

const projectList = ref<{ key: string; name: string; updatedAt: string }[]>([]);
const selectedProjectId = ref<string | null>(null);

watch(
  () => uiStore.loadDialogVisible,
  (visible) => {
    if (visible) {
      selectedProjectId.value = null;
      projectList.value = LocalStorageManager.listAll().map((p) => ({
        key: p.key,
        name: p.name,
        updatedAt: p.updatedAt,
      }));
    }
  }
);

const handleLoad = () => {
  if (!selectedProjectId.value) {
    ElMessage.warning('请选择要加载的项目');
    return;
  }
  const design = LocalStorageManager.load(selectedProjectId.value);
  if (design && editorEngine) {
    const ids = editorEngine.getAllElements().map((el) => el.id);
    ids.forEach((id) => editorEngine.deleteElement(id));
    design.elements.forEach((el) => editorEngine.addElement(el));
    design.selection.forEach((id) => editorEngine.select(id));
    editorStore.setProjectName(design.metadata.name);
    editorStore.setHasUnsavedChanges(false);
    ElMessage.success('加载成功');
    uiStore.closeLoadDialog();
  } else {
    ElMessage.error('加载失败');
  }
};

const handleClose = () => {
  uiStore.closeLoadDialog();
};
</script>

<template>
  <el-dialog
    v-model="uiStore.loadDialogVisible"
    title="加载项目"
    width="480px"
    :close-on-click-modal="false"
    destroy-on-close
    @close="handleClose"
  >
    <div class="project-list">
      <el-radio-group v-model="selectedProjectId" class="project-radio-group">
        <div v-for="project in projectList" :key="project.key" class="project-item">
          <el-radio :label="project.key">
            <div class="project-info">
              <span class="project-name">{{ project.name }}</span>
              <span class="project-date">{{ project.updatedAt }}</span>
            </div>
          </el-radio>
        </div>
      </el-radio-group>
      <el-empty
        v-if="projectList.length === 0"
        description="暂无已保存的项目"
        :image-size="60"
      />
    </div>
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :disabled="!selectedProjectId" @click="handleLoad">
        加载
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.project-list {
  max-height: 320px;
  overflow-y: auto;
}

.project-radio-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.project-item {
  padding: 12px;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  transition: border-color 0.2s;
}

.project-item:hover {
  border-color: var(--el-color-primary-light-5);
}

.project-item:has(.el-radio__input.is-checked) {
  border-color: var(--el-color-primary);
}

.project-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.project-name {
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.project-date {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
