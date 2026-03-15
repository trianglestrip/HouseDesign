<template>
  <div class="auxiliary-lines-panel">
    <div class="panel-header">
      <h3>辅助线</h3>
      <el-button size="small" @click="addHorizontalLine">
        水平线
      </el-button>
      <el-button size="small" @click="addVerticalLine">
        垂直线
      </el-button>
    </div>
    
    <div class="lines-list">
      <div 
        v-for="line in lines" 
        :key="line.id" 
        class="line-item"
        :class="{ locked: line.locked, hidden: !line.visible }"
      >
        <div class="line-info">
          <span class="line-type">
            {{ getLineTypeLabel(line.type) }}
          </span>
          <span class="line-position">
            {{ formatPosition(line) }}
          </span>
        </div>
        
        <div class="line-actions">
          <el-button 
            size="small" 
            :icon="line.visible ? View : Hide"
            @click="toggleVisibility(line.id)"
          />
          <el-button 
            size="small" 
            :icon="line.locked ? Lock : Unlock"
            @click="toggleLock(line.id)"
          />
          <el-button 
            size="small" 
            :icon="Delete"
            :disabled="line.locked"
            @click="removeLine(line.id)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElButton } from 'element-plus';
import { View, Hide, Lock, Unlock, Delete } from '@element-plus/icons-vue';
import type { AuxiliaryLine, AuxiliaryLineManager } from '@housedesign/core';
import { AuxiliaryLineType } from '@housedesign/core';

export interface AuxiliaryLinesPanelProps {
  manager: AuxiliaryLineManager;
}

const props = defineProps<AuxiliaryLinesPanelProps>();

const lines = ref<AuxiliaryLine[]>([]);

// 刷新列表
function refreshLines() {
  lines.value = props.manager.getAllLines();
}

// 添加水平线
function addHorizontalLine() {
  props.manager.addLine(AuxiliaryLineType.Horizontal, { x: 0, y: 0 });
  refreshLines();
}

// 添加垂直线
function addVerticalLine() {
  props.manager.addLine(AuxiliaryLineType.Vertical, { x: 0, y: 0 });
  refreshLines();
}

// 切换可见性
function toggleVisibility(id: string) {
  props.manager.toggleVisibility(id);
  refreshLines();
}

// 切换锁定
function toggleLock(id: string) {
  props.manager.toggleLock(id);
  refreshLines();
}

// 删除辅助线
function removeLine(id: string) {
  props.manager.removeLine(id);
  refreshLines();
}

// 获取类型标签
function getLineTypeLabel(type: AuxiliaryLineType): string {
  switch (type) {
    case AuxiliaryLineType.Horizontal:
      return '水平';
    case AuxiliaryLineType.Vertical:
      return '垂直';
    case AuxiliaryLineType.Angle:
      return '角度';
    default:
      return '未知';
  }
}

// 格式化位置
function formatPosition(line: AuxiliaryLine): string {
  if (line.type === AuxiliaryLineType.Horizontal) {
    return `Y: ${line.position.y.toFixed(0)}mm`;
  } else if (line.type === AuxiliaryLineType.Vertical) {
    return `X: ${line.position.x.toFixed(0)}mm`;
  } else if (line.angle !== undefined) {
    return `${line.angle.toFixed(0)}°`;
  }
  return '';
}

// 初始化
refreshLines();
</script>

<style scoped>
.auxiliary-lines-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.panel-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  flex: 1;
}

.lines-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
}

.line-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px;
  background: #f5f5f5;
  border-radius: 4px;
  transition: background 0.2s;
}

.line-item:hover {
  background: #e8e8e8;
}

.line-item.locked {
  border-left: 3px solid #409eff;
}

.line-item.hidden {
  opacity: 0.5;
}

.line-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.line-type {
  font-size: 12px;
  font-weight: 600;
  color: #333;
}

.line-position {
  font-size: 11px;
  color: #666;
  font-family: monospace;
}

.line-actions {
  display: flex;
  gap: 4px;
}
</style>
