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
      :placeholder="placeholder"
      @keydown.enter="handleConfirm"
      @keydown.esc="handleCancel"
      @keydown.tab.prevent="handleTab"
      @blur="handleBlur"
    />
    <span class="dimension-input__unit">{{ currentUnit }}</span>
    <div class="dimension-input__hint">
      <span v-if="mode === 'length'">长度</span>
      <span v-else>角度</span>
      <span class="dimension-input__hint-key">Tab切换</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue';

export interface DimensionInputProps {
  visible: boolean;
  position: { x: number; y: number };
  mode?: 'length' | 'angle';
  unit?: 'mm' | 'cm' | 'm';
}

export interface DimensionInputEmits {
  (e: 'confirm', value: number, mode: 'length' | 'angle'): void;
  (e: 'cancel'): void;
  (e: 'update:mode', mode: 'length' | 'angle'): void;
}

const props = withDefaults(defineProps<DimensionInputProps>(), {
  visible: false,
  mode: 'length',
  unit: 'mm',
});

const emit = defineEmits<DimensionInputEmits>();

const inputRef = ref<HTMLInputElement | null>(null);
const inputValue = ref('');
const internalMode = ref<'length' | 'angle'>(props.mode);

const currentUnit = computed(() => {
  return internalMode.value === 'length' ? props.unit : '°';
});

const placeholder = computed(() => {
  return internalMode.value === 'length' ? '输入长度' : '输入角度';
});

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

// 监听mode变化
watch(() => props.mode, (newVal) => {
  internalMode.value = newVal;
});

// 解析输入值
function parseInput(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // 移除单位符号
  const cleaned = trimmed.replace(/[°cmm]/gi, '');
  const num = parseFloat(cleaned);

  if (isNaN(num)) return null;

  // 根据模式和单位转换为mm（长度）或度（角度）
  if (internalMode.value === 'length') {
    // 检测单位
    if (trimmed.toLowerCase().includes('m') && !trimmed.toLowerCase().includes('mm')) {
      return num * 1000; // 米转毫米
    } else if (trimmed.toLowerCase().includes('cm')) {
      return num * 10; // 厘米转毫米
    } else {
      return num; // 默认毫米
    }
  } else {
    // 角度直接返回
    return num;
  }
}

// 确认输入
function handleConfirm() {
  const value = parseInput(inputValue.value);
  if (value !== null) {
    emit('confirm', value, internalMode.value);
    inputValue.value = '';
  }
}

// 取消输入
function handleCancel() {
  emit('cancel');
  inputValue.value = '';
}

// Tab切换模式
function handleTab() {
  internalMode.value = internalMode.value === 'length' ? 'angle' : 'length';
  emit('update:mode', internalMode.value);
  inputValue.value = '';
}

// 失去焦点时取消（可选）
function handleBlur() {
  // 延迟取消，避免点击确认按钮时立即取消
  setTimeout(() => {
    if (props.visible) {
      handleCancel();
    }
  }, 200);
}
</script>

<style scoped>
.dimension-input {
  position: fixed;
  z-index: 10000;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  background: white;
  border: 2px solid #409eff;
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  pointer-events: all;
}

.dimension-input__field {
  width: 100px;
  padding: 4px 8px;
  border: 1px solid #dcdfe6;
  border-radius: 3px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.dimension-input__field:focus {
  border-color: #409eff;
}

.dimension-input__unit {
  font-size: 12px;
  color: #909399;
  font-weight: 500;
  min-width: 20px;
}

.dimension-input__hint {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 11px;
  color: #909399;
  margin-left: 8px;
  padding-left: 8px;
  border-left: 1px solid #dcdfe6;
}

.dimension-input__hint-key {
  color: #409eff;
  font-weight: 500;
}
</style>
