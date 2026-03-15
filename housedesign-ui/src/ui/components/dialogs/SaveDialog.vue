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

const projectName = ref('');

watch(
  () => uiStore.saveDialogVisible,
  (visible) => {
    if (visible) {
      projectName.value = editorStore.projectName;
    }
  }
);

const handleSave = () => {
  if (!projectName.value.trim()) {
    ElMessage.warning('请输入项目名称');
    return;
  }
  editorStore.setProjectName(projectName.value.trim());

  if (editorEngine) {
    const elements = editorEngine.getAllElements();
    const selection = editorEngine.getSelection();
    LocalStorageManager.save(elements, selection, {
      name: projectName.value.trim(),
    });
  }
  ElMessage.success('保存成功');
  editorStore.setHasUnsavedChanges(false);
  uiStore.closeSaveDialog();
};

const handleClose = () => {
  uiStore.closeSaveDialog();
};
</script>

<template>
  <el-dialog
    v-model="uiStore.saveDialogVisible"
    title="保存项目"
    width="420px"
    :close-on-click-modal="false"
    destroy-on-close
    @close="handleClose"
  >
    <el-form label-position="top">
      <el-form-item label="项目名称">
        <el-input
          v-model="projectName"
          placeholder="请输入项目名称"
          maxlength="50"
          show-word-limit
          clearable
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleSave">保存</el-button>
    </template>
  </el-dialog>
</template>
