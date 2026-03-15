<template>
  <div 
    v-if="visible" 
    class="dimension-input"
    :style="{
      left: position.x + 'px',
      top: position.y + 'px'
    }"
  >
    <input
      ref="inputRef"
      v-model="inputValue"
      type="text"
      class="dimension-input__field"
      placeholder="长度"
      @keydown.enter="handleConfirm"
      @keydown.esc="handleCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue';

export interface DimensionInputProps {
  visible: boolean;
  position: { x: number; y: number };
}

export interface DimensionInputEmits {
  (e: 'confirm', value: number): void;
  (e: 'cancel'): void;
}

const props = defineProps<DimensionInputProps>();
const emit = defineEmits<DimensionInputEmits>();

const inputRef = ref<HTMLInputElement | null>(null);
const inputValue = ref('');

// 监听visible变化，自动聚焦
watch(() => props.visible, (newVal) => {
  if (newVal) {
    nextTick(() => {
      inputRef.value?.focus();
      inputRef.value?.select();
    });
  } else {
    inputValue.value = '';
  }
});

// 监听位置变化，确保焦点保持（但不要选中文本）
watch(() => props.position, () => {
  if (props.visible && document.activeElement !== inputRef.value) {
    // 只在焦点丢失时重新聚焦，但不选中文本
    nextTick(() => {
      const currentValue = inputRef.value?.value || '';
      inputRef.value?.focus();
      // 恢复光标位置到末尾
      if (inputRef.value) {
        inputRef.value.selectionStart = currentValue.length;
        inputRef.value.selectionEnd = currentValue.length;
      }
    });
  }
}, { deep: true });

// 解析输入值（默认单位：mm）
function parseInput(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // 尝试解析数字和单位
  const match = trimmed.match(/^([\d.]+)(mm|cm|m)?$/i);
  if (!match) return null;

  const num = parseFloat(match[1]);
  if (isNaN(num)) return null;

  const unit = match[2]?.toLowerCase();

  // 统一转换为毫米
  if (unit === 'm') {
    return num * 1000; // 米转毫米
  } else if (unit === 'cm') {
    return num * 10; // 厘米转毫米
  } else {
    return num; // 默认毫米
  }
}

// 确认输入
function handleConfirm() {
  const value = parseInput(inputValue.value);
  if (value !== null) {
    emit('confirm', value);
    inputValue.value = '';
  }
}

// 取消输入
function handleCancel() {
  emit('cancel');
  inputValue.value = '';
}

// 注意：移除了 @blur 自动取消功能
// 原因：在某些情况下（如自动化测试、快速点击），输入框会立即失焦并被取消
// 用户可以通过 Esc 键或点击画布其他位置来显式取消
</script>

<style scoped>
.dimension-input {
  position: fixed;
  z-index: 10000;
  padding: 2px 4px;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid #409eff;
  border-radius: 2px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  pointer-events: all;
  transform: translate(-50%, -50%);
}

.dimension-input__field {
  width: 50px;
  padding: 2px 4px;
  border: none;
  font-size: 12px;
  outline: none;
  background: transparent;
  text-align: center;
  font-family: 'Consolas', 'Monaco', monospace;
}

.dimension-input__unit {
  font-size: 11px;
  color: #909399;
  font-weight: 500;
  min-width: 20px;
}

</style>
