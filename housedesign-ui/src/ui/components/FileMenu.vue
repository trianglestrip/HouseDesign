<template>
  <div class="file-menu">
    <el-button @click="handleExport" type="primary" :icon="Download">
      导出场景
    </el-button>
    <el-button @click="triggerImport" :icon="Upload">
      导入场景
    </el-button>
    <input
      ref="fileInputRef"
      type="file"
      accept=".json"
      style="display: none"
      @change="handleFileSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElButton, ElMessage } from 'element-plus';
import { Download, Upload } from '@element-plus/icons-vue';

export interface FileMenuEmits {
  (e: 'export'): void;
  (e: 'import', data: any): void;
}

const emit = defineEmits<FileMenuEmits>();

const fileInputRef = ref<HTMLInputElement | null>(null);

// 触发文件选择
function triggerImport() {
  fileInputRef.value?.click();
}

// 处理文件选择
async function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  
  if (!file) return;
  
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    
    emit('import', data);
    ElMessage.success('场景导入成功');
  } catch (error) {
    console.error('[文件导入] 错误:', error);
    ElMessage.error('场景导入失败：文件格式错误');
  } finally {
    // 清空input，允许重复导入同一文件
    if (target) {
      target.value = '';
    }
  }
}

// 处理导出
function handleExport() {
  emit('export');
}
</script>

<style scoped>
.file-menu {
  display: flex;
  gap: 8px;
}
</style>
