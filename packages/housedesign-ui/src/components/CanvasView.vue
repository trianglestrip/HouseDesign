<template>
  <div class="canvas-container">
    <canvas ref="canvasRef" class="main-canvas"></canvas>
    
    <DimensionInput
      :visible="dimensionInputVisible"
      :position="dimensionInputPosition"
      :initial-value="dimensionInputValue"
      @confirm="handleDimensionConfirm"
      @cancel="handleDimensionCancel"
    />
    
    <div 
      v-if="crosshairVisible && !hideCursor" 
      class="crosshair"
      :style="{
        left: mousePosition.x + 'px',
        top: mousePosition.y + 'px'
      }"
    >
      <div class="crosshair-h"></div>
      <div class="crosshair-v"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { fabric } from 'fabric';
import { useEditorStore } from '../stores/editorStore';
import { useConfigStore } from '../stores/configStore';
import { 
  Vec2, 
  Wall2DAdapter, 
  DrawWallTool, 
  SelectTool, 
  MoveTool,
  ToolType,
  SnapType
} from '@housedesign/core';
import DimensionInput from './DimensionInput.vue';

const editorStore = useEditorStore();
const configStore = useConfigStore();

const canvasRef = ref<HTMLCanvasElement | null>(null);
const fabricCanvas = ref<fabric.Canvas | null>(null);

const mousePosition = ref({ x: 0, y: 0 });
const crosshairVisible = ref(false);
const hideCursor = ref(false);

const dimensionInputVisible = ref(false);
const dimensionInputPosition = ref({ x: 0, y: 0 });
const dimensionInputValue = ref(0);

let drawWallTool: DrawWallTool | null = null;
let selectTool: SelectTool | null = null;
let moveTool: MoveTool | null = null;

let previewLine: fabric.Line | null = null;
let previewPolygon: fabric.Polygon | null = null;
let startPointCircle: fabric.Circle | null = null;

onMounted(async () => {
  await configStore.loadFromFile();
  initCanvas();
  initTools();
  setupEventListeners();
  renderGrid();
  renderAll();
});

onUnmounted(() => {
  fabricCanvas.value?.dispose();
});

function initCanvas() {
  if (!canvasRef.value) return;
  
  fabricCanvas.value = new fabric.Canvas(canvasRef.value, {
    width: window.innerWidth,
    height: window.innerHeight - 60,
    selection: false,
    backgroundColor: '#FFFFFF'
  });
}

function initTools() {
  const engine = editorStore.engine;
  
  drawWallTool = new DrawWallTool(engine);
  selectTool = new SelectTool(engine);
  moveTool = new MoveTool(engine);
  
  engine.toolManager.registerTool(drawWallTool);
  engine.toolManager.registerTool(selectTool);
  engine.toolManager.registerTool(moveTool);
  
  editorStore.setTool(ToolType.DrawWall);
}

function setupEventListeners() {
  const canvas = fabricCanvas.value;
  if (!canvas) return;
  
  canvas.on('mouse:move', handleMouseMove);
  canvas.on('mouse:down', handleMouseDown);
  canvas.on('mouse:up', handleMouseUp);
  
  window.addEventListener('keydown', handleKeyDown);
}

function handleMouseMove(event: any) {
  const pointer = fabricCanvas.value?.getPointer(event.e);
  if (!pointer) return;
  
  mousePosition.value = { x: event.e.clientX, y: event.e.clientY };
  
  const position = new Vec2(pointer.x, pointer.y);
  const engine = editorStore.engine;
  
  const excludeNodeIds = drawWallTool?.getStartNode() 
    ? [drawWallTool.getStartNode()!.id] 
    : [];
  
  const snapResult = engine.snapEngine.snapWithConstraints(
    position,
    engine.getGraph(),
    drawWallTool?.getStartNode()?.position ?? null,
    excludeNodeIds
  );
  
  const finalPosition = snapResult ? snapResult.position : position;
  
  hideCursor.value = snapResult?.type === SnapType.Endpoint;
  
  if (editorStore.currentTool === ToolType.DrawWall && drawWallTool) {
    drawWallTool.handleMouseMove(finalPosition);
    updateWallPreview(finalPosition, event.e);
  }
}

function handleMouseDown(event: any) {
  const pointer = fabricCanvas.value?.getPointer(event.e);
  if (!pointer) return;
  
  const position = new Vec2(pointer.x, pointer.y);
  
  if (editorStore.currentTool === ToolType.Move && moveTool) {
    moveTool.handleMouseDown(position);
  }
}

function handleMouseUp(event: any) {
  const pointer = fabricCanvas.value?.getPointer(event.e);
  if (!pointer) return;
  
  const position = new Vec2(pointer.x, pointer.y);
  const engine = editorStore.engine;
  
  const excludeNodeIds = drawWallTool?.getStartNode() 
    ? [drawWallTool.getStartNode()!.id] 
    : [];
  
  const snapResult = engine.snapEngine.snapWithConstraints(
    position,
    engine.getGraph(),
    drawWallTool?.getStartNode()?.position ?? null,
    excludeNodeIds
  );
  
  const finalPosition = snapResult ? snapResult.position : position;
  
  if (editorStore.currentTool === ToolType.DrawWall && drawWallTool) {
    drawWallTool.handleMouseClick(finalPosition);
    editorStore.updateUndoRedoState();
    clearPreview();
    renderAll();
  } else if (editorStore.currentTool === ToolType.Select && selectTool) {
    selectTool.handleMouseClick(finalPosition, event.e.shiftKey);
    renderAll();
  } else if (editorStore.currentTool === ToolType.Move && moveTool) {
    moveTool.handleMouseUp(finalPosition);
    editorStore.updateUndoRedoState();
    renderAll();
  }
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.ctrlKey && event.key === 'z') {
    event.preventDefault();
    editorStore.undo();
    renderAll();
  } else if (event.ctrlKey && event.key === 'y') {
    event.preventDefault();
    editorStore.redo();
    renderAll();
  } else if (event.key === 'Escape') {
    drawWallTool?.handleKeyPress('Escape');
    moveTool?.handleKeyPress('Escape');
    clearPreview();
    renderAll();
  }
}

function updateWallPreview(endPos: Vec2, mouseEvent: MouseEvent) {
  const startNode = drawWallTool?.getStartNode();
  if (!startNode) {
    clearPreview();
    return;
  }
  
  const canvas = fabricCanvas.value;
  if (!canvas) return;
  
  clearPreview();
  
  const config = configStore.renderConfig;
  const thickness = 200;
  const direction = endPos.sub(startNode.position);
  const normal = direction.normalize().perpendicular();
  const halfThickness = thickness / 2;
  
  const outline1Start = startNode.position.add(normal.mul(halfThickness));
  const outline1End = endPos.add(normal.mul(halfThickness));
  const outline2Start = startNode.position.sub(normal.mul(halfThickness));
  const outline2End = endPos.sub(normal.mul(halfThickness));
  
  previewPolygon = new fabric.Polygon(
    [
      { x: outline1Start.x, y: outline1Start.y },
      { x: outline1End.x, y: outline1End.y },
      { x: outline2End.x, y: outline2End.y },
      { x: outline2Start.x, y: outline2Start.y }
    ],
    {
      fill: config.wall.fillColor,
      opacity: 0.5,
      stroke: config.wall.outlineColor,
      strokeWidth: 1,
      selectable: false,
      evented: false
    }
  );
  
  previewLine = new fabric.Line(
    [startNode.position.x, startNode.position.y, endPos.x, endPos.y],
    {
      stroke: config.wall.centerLineColor,
      strokeWidth: config.wall.centerLineWidth,
      strokeDashArray: [5, 5],
      opacity: 0.7,
      selectable: false,
      evented: false
    }
  );
  
  startPointCircle = new fabric.Circle({
    left: startNode.position.x - config.node.radius,
    top: startNode.position.y - config.node.radius,
    radius: config.node.radius,
    fill: config.node.fillColor,
    stroke: config.node.strokeColor,
    strokeWidth: config.node.strokeWidth,
    selectable: false,
    evented: false
  });
  
  canvas.add(previewPolygon);
  canvas.add(previewLine);
  canvas.add(startPointCircle);
  canvas.renderAll();
  
  const length = direction.length();
  showDimensionInput(
    startNode.position.x,
    startNode.position.y,
    endPos.x,
    endPos.y,
    mouseEvent.clientX,
    mouseEvent.clientY,
    length
  );
}

function showDimensionInput(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  screenX: number,
  screenY: number,
  length: number
) {
  const midScreenX = (screenX + (x1 - x2) / 2);
  const midScreenY = (screenY + (y1 - y2) / 2);
  
  dimensionInputPosition.value = {
    x: midScreenX,
    y: midScreenY
  };
  dimensionInputValue.value = Math.round(length);
  dimensionInputVisible.value = true;
}

function handleDimensionConfirm(value: number) {
  dimensionInputVisible.value = false;
}

function handleDimensionCancel() {
  dimensionInputVisible.value = false;
}

function clearPreview() {
  const canvas = fabricCanvas.value;
  if (!canvas) return;
  
  if (previewLine) {
    canvas.remove(previewLine);
    previewLine = null;
  }
  if (previewPolygon) {
    canvas.remove(previewPolygon);
    previewPolygon = null;
  }
  if (startPointCircle) {
    canvas.remove(startPointCircle);
    startPointCircle = null;
  }
  
  canvas.renderAll();
}

function renderGrid() {
  const canvas = fabricCanvas.value;
  if (!canvas) return;
  
  const config = configStore.renderConfig.grid;
  const width = canvas.width || 0;
  const height = canvas.height || 0;
  
  for (let x = 0; x <= width; x += config.size) {
    const line = new fabric.Line([x, 0, x, height], {
      stroke: config.color,
      strokeWidth: config.lineWidth,
      selectable: false,
      evented: false
    });
    canvas.add(line);
  }
  
  for (let y = 0; y <= height; y += config.size) {
    const line = new fabric.Line([0, y, width, y], {
      stroke: config.color,
      strokeWidth: config.lineWidth,
      selectable: false,
      evented: false
    });
    canvas.add(line);
  }
}

function renderAll() {
  const canvas = fabricCanvas.value;
  if (!canvas) return;
  
  canvas.clear();
  canvas.backgroundColor = '#FFFFFF';
  renderGrid();
  
  const engine = editorStore.engine;
  const config = configStore.renderConfig;
  
  for (const wall of engine.getWalls().values()) {
    const adapter = new Wall2DAdapter(wall, engine.getGraph());
    const renderData = adapter.getRenderData();
    
    if (renderData) {
      const polygon = new fabric.Polygon(
        renderData.polygon.map(v => ({ x: v.x, y: v.y })),
        {
          fill: config.wall.fillColor,
          stroke: config.wall.outlineColor,
          strokeWidth: config.wall.outlineWidth,
          selectable: false,
          evented: false
        }
      );
      canvas.add(polygon);
      
      const centerLine = new fabric.Line(
        [
          renderData.centerLine[0].x,
          renderData.centerLine[0].y,
          renderData.centerLine[1].x,
          renderData.centerLine[1].y
        ],
        {
          stroke: config.wall.centerLineColor,
          strokeWidth: config.wall.centerLineWidth,
          strokeDashArray: config.wall.centerLineStyle === 'dashed' ? [5, 5] : undefined,
          selectable: false,
          evented: false
        }
      );
      canvas.add(centerLine);
    }
  }
  
  for (const node of engine.getGraph().getAllNodes()) {
    const circle = new fabric.Circle({
      left: node.position.x - config.node.radius,
      top: node.position.y - config.node.radius,
      radius: config.node.radius,
      fill: config.node.fillColor,
      stroke: config.node.strokeColor,
      strokeWidth: config.node.strokeWidth,
      selectable: false,
      evented: false
    });
    canvas.add(circle);
  }
  
  canvas.renderAll();
}

onMounted(() => {
  crosshairVisible.value = true;
});
</script>

<style scoped>
.canvas-container {
  position: relative;
  width: 100%;
  height: calc(100vh - 60px);
  overflow: hidden;
  cursor: none;
}

.main-canvas {
  display: block;
}

.crosshair {
  position: fixed;
  pointer-events: none;
  z-index: 999;
}

.crosshair-h,
.crosshair-v {
  position: absolute;
  background: rgba(0, 102, 255, 0.5);
}

.crosshair-h {
  width: 20px;
  height: 1px;
  left: -10px;
  top: 0;
}

.crosshair-v {
  width: 1px;
  height: 20px;
  left: 0;
  top: -10px;
}
</style>
