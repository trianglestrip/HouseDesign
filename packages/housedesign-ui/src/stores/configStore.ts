import { defineStore } from 'pinia';
import { ref } from 'vue';
import { defaultRenderConfig, mergeRenderConfig, RenderConfig } from '@housedesign/core';

export const useConfigStore = defineStore('config', () => {
  const renderConfig = ref<RenderConfig>(defaultRenderConfig);
  const customConfig = ref<Partial<RenderConfig>>({});

  function loadCustomConfig(config: Partial<RenderConfig>) {
    customConfig.value = config;
    renderConfig.value = mergeRenderConfig(defaultRenderConfig, config);
  }

  function updateConfig(config: Partial<RenderConfig>) {
    customConfig.value = { ...customConfig.value, ...config };
    renderConfig.value = mergeRenderConfig(defaultRenderConfig, customConfig.value);
  }

  function resetConfig() {
    customConfig.value = {};
    renderConfig.value = defaultRenderConfig;
  }

  async function loadFromFile() {
    try {
      const response = await fetch('/src/config/customRenderConfig.json');
      if (response.ok) {
        const config = await response.json();
        loadCustomConfig(config);
      }
    } catch (error) {
      console.warn('Failed to load custom render config:', error);
    }
  }

  return {
    renderConfig,
    customConfig,
    loadCustomConfig,
    updateConfig,
    resetConfig,
    loadFromFile
  };
});
