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
      v-model="value"
      type="number"
      @keydown.enter="handleEnter"
      @keydown.esc="handleEscape"
      @blur="handleBlur"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';

interface Props {
  visible: boolean;
  position: { x: number; y: number };
  initialValue?: number;
}

const props = withDefaults(defineProps<Props>(), {
  initialValue: 0
});

const emit = defineEmits<{
  confirm: [value: number];
  cancel: [];
}>();

const inputRef = ref<HTMLInputElement | null>(null);
const value = ref(props.initialValue);

watch(() => props.visible, async (newVisible) => {
  if (newVisible) {
    value.value = props.initialValue;
    await nextTick();
    inputRef.value?.focus();
    inputRef.value?.select();
  }
});

function handleEnter() {
  emit('confirm', Number(value.value));
}

function handleEscape() {
  emit('cancel');
}

function handleBlur() {
  emit('cancel');
}
</script>

<style scoped>
.dimension-input {
  position: fixed;
  transform: translate(-50%, -50%);
  z-index: 1000;
  pointer-events: auto;
}

.dimension-input input {
  width: 50px;
  padding: 2px 4px;
  font-size: 12px;
  border: 1px solid #0066FF;
  border-radius: 2px;
  text-align: center;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.dimension-input input:focus {
  outline: none;
  border-color: #0099FF;
  box-shadow: 0 0 0 2px rgba(0, 102, 255, 0.2);
}
</style>
