/**
 * UI 状态管理 - Pinia Store
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export type ViewMode = '2d' | '3d';

export const useUIStore = defineStore('ui', () => {
  const saveDialogVisible = ref(false);
  const loadDialogVisible = ref(false);
  const viewMode = ref<ViewMode>('2d');
  const toolPanelCollapsed = ref(false);
  const propertyPanelCollapsed = ref(false);

  const openSaveDialog = () => {
    saveDialogVisible.value = true;
  };
  const closeSaveDialog = () => {
    saveDialogVisible.value = false;
  };
  const openLoadDialog = () => {
    loadDialogVisible.value = true;
  };
  const closeLoadDialog = () => {
    loadDialogVisible.value = false;
  };
  const toggleToolPanel = () => {
    toolPanelCollapsed.value = !toolPanelCollapsed.value;
  };
  const togglePropertyPanel = () => {
    propertyPanelCollapsed.value = !propertyPanelCollapsed.value;
  };
  const setViewMode = (mode: ViewMode) => {
    viewMode.value = mode;
  };

  const is3DEnabled = computed(() => false);

  return {
    saveDialogVisible,
    loadDialogVisible,
    viewMode,
    toolPanelCollapsed,
    propertyPanelCollapsed,
    is3DEnabled,
    openSaveDialog,
    closeSaveDialog,
    openLoadDialog,
    closeLoadDialog,
    toggleToolPanel,
    togglePropertyPanel,
    setViewMode,
  };
});
