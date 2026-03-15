<template>
  <div class="property-panel">
    <h3>属性面板</h3>
    
    <div class="stats">
      <div class="stat-item">
        <span class="label">墙体数量:</span>
        <span class="value">{{ editorStore.wallCount }}</span>
      </div>
      <div class="stat-item">
        <span class="label">房间数量:</span>
        <span class="value">{{ editorStore.roomCount }}</span>
      </div>
      <div class="stat-item">
        <span class="label">节点数量:</span>
        <span class="value">{{ editorStore.nodeCount }}</span>
      </div>
    </div>
    
    <div class="actions">
      <button @click="save">保存项目</button>
      <button @click="load">加载项目</button>
      <button @click="exportJson">导出 JSON</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useEditorStore } from '../stores/editorStore';
import { Serializer } from '@housedesign/core';

const editorStore = useEditorStore();

function save() {
  const engine = editorStore.engine;
  const json = Serializer.serialize(
    engine.getGraph(),
    engine.getWalls(),
    engine.getRooms(),
    engine.getOpenings()
  );
  
  localStorage.setItem('housedesign_project', json);
  alert('项目已保存到本地存储');
}

function load() {
  const json = localStorage.getItem('housedesign_project');
  if (!json) {
    alert('没有找到保存的项目');
    return;
  }
  
  try {
    const { graph, walls, rooms, openings } = Serializer.deserialize(json);
    const engine = editorStore.engine;
    
    engine.clear();
    
    graph.getAllNodes().forEach(node => engine.getGraph().addNode(node));
    graph.getAllEdges().forEach(edge => engine.getGraph().addEdge(edge));
    walls.forEach((wall, id) => engine.getWalls().set(id, wall));
    rooms.forEach((room, id) => engine.getRooms().set(id, room));
    openings.forEach((opening, id) => engine.getOpenings().set(id, opening));
    
    alert('项目已加载');
  } catch (error) {
    alert('加载项目失败: ' + error);
  }
}

function exportJson() {
  const engine = editorStore.engine;
  const json = Serializer.serialize(
    engine.getGraph(),
    engine.getWalls(),
    engine.getRooms(),
    engine.getOpenings()
  );
  
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `housedesign_${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
</script>

<style scoped>
.property-panel {
  position: fixed;
  right: 0;
  top: 60px;
  width: 250px;
  height: calc(100vh - 60px);
  background: white;
  border-left: 1px solid #e0e0e0;
  padding: 16px;
  overflow-y: auto;
}

h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
}

.stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 24px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  padding: 8px;
  background: #f5f5f5;
  border-radius: 4px;
}

.label {
  color: #666;
  font-size: 14px;
}

.value {
  color: #333;
  font-weight: 600;
  font-size: 14px;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

button {
  padding: 8px 16px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

button:hover {
  background: #f5f5f5;
  border-color: #0066FF;
}
</style>
