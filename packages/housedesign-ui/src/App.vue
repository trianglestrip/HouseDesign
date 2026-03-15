<template>
  <div id="app">
    <Toolbar />
    <div class="main-content">
      <CanvasView />
      <PropertyPanel />
    </div>
  </div>
</template>

<script setup lang="ts">
import Toolbar from './components/Toolbar.vue';
import CanvasView from './components/CanvasView.vue';
import PropertyPanel from './components/PropertyPanel.vue';
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

#app {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  display: flex;
  position: relative;
  overflow: hidden;
}
</style>
