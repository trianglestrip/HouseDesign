<script setup lang="ts">
import { inject, ref, onMounted, onUnmounted, watch } from 'vue';
import { EDITOR_ENGINE_KEY } from '@/constants/injectKeys';
import { 
  EditorEvents, 
  ElementType, 
  GeometryKernel, 
  type Vec2,
  DEFAULT_RENDER_CONFIG,
  type RenderConfig,
  mmToPixels,
  SnapType,
} from '@housedesign/core';
import { useEditorStore } from '../stores/editorStore';
import { Canvas, Rect } from 'fabric';
import * as fabric from 'fabric';
import type { FabricObject } from 'fabric';

const engine = inject(EDITOR_ENGINE_KEY)!;
const editorStore = useEditorStore();

const canvasContainer = ref<HTMLDivElement | null>(null);
const canvasEl = ref<HTMLCanvasElement | null>(null);
let canvas: Canvas | null = null;
const idToFabricObject = new Map<string, FabricObject>();
let unsubs: (() => void)[] = [];

// 渲染配置
let renderConfig = ref<RenderConfig>(DEFAULT_RENDER_CONFIG);

// 几何内核（用于墙体拓扑管理）
const geometryKernel = new GeometryKernel();

// 调试：暴露到 window 对象
if (typeof window !== 'undefined') {
  (window as any).geometryKernel = geometryKernel;
  (window as any).renderConfig = renderConfig;
  (window as any).debugWalls = () => {
    console.log('=== 墙体数据 ===');
    console.log('Walls:', geometryKernel.getWalls());
    console.log('Nodes:', geometryKernel.getTopology().getNodes());
    console.log('Edges:', geometryKernel.getTopology().getEdges());
    console.log('Polygons:', geometryKernel.generateWallPolygons());
  };
}

// 墙体绘制状态（连续折线模式）
let currentNodeId: string | null = null; // 当前正在绘制的起点节点ID
let tempWallLine: fabric.Line | null = null; // 跟随鼠标的预览线
let snapIndicator: fabric.Circle | null = null; // 吸附点指示器
let wallEndpoints: Map<string, fabric.Circle> = new Map(); // 墙体端点控制点
let dimensionLine: fabric.Line | null = null; // 尺寸标注线
let dimensionText: fabric.Text | null = null; // 尺寸文字
let gridLines: FabricObject[] = []; // 网格线对象数组

// 渲染循环标志
let needRedrawGrid = false; // 是否需要重绘网格
let animationFrameId: number | null = null; // requestAnimationFrame ID
let isDraggingEndpoint = false; // 是否正在拖动端点

// 刻度尺标记数据
const topRulerMarks = ref<Array<{ index: number; position: number; value: string; isMajor: boolean }>>([]);
const leftRulerMarks = ref<Array<{ index: number; position: number; value: string; isMajor: boolean }>>([]);

// 鼠标十字准线
const crosshairVisible = ref(false);
const crosshairX = ref(0);
const crosshairY = ref(0);
const cursorCoordsMm = ref({ x: 0, y: 0 });

// 键盘状态
const isShiftPressed = ref(false);
const isCtrlPressed = ref(false);

// 键盘事件处理函数
const handleKeyDown = (e: KeyboardEvent) => {
  // 检查是否在输入框中
  const target = e.target as HTMLElement;
  const isInputFocused = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
  
  if (e.key === 'Shift') {
    isShiftPressed.value = true;
  }
  if (e.key === 'Control' || e.key === 'Meta') {
    isCtrlPressed.value = true;
    updateCrosshairVisibility();
  }
  
  // 撤销/重做快捷键（不在输入框时）
  if (!isInputFocused) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      const success = geometryKernel.undo();
      if (success) {
        console.log('[撤销] 操作已撤销');
        renderAllWalls();
        // 更新editorStore状态
        editorStore.setUndoRedoState(geometryKernel.canUndo(), geometryKernel.canRedo());
      }
    } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
      e.preventDefault();
      const success = geometryKernel.redo();
      if (success) {
        console.log('[重做] 操作已重做');
        renderAllWalls();
        // 更新editorStore状态
        editorStore.setUndoRedoState(geometryKernel.canUndo(), geometryKernel.canRedo());
      }
    }
  }
};

const handleKeyUp = (e: KeyboardEvent) => {
  if (e.key === 'Shift') {
    isShiftPressed.value = false;
  }
  if (e.key === 'Control' || e.key === 'Meta') {
    isCtrlPressed.value = false;
    updateCrosshairVisibility();
  }
};

// 更新十字准线显示状态
function updateCrosshairVisibility() {
  const tool = editorStore.currentTool;
  
  // 显示条件：
  // 1. 绘制工具激活（wall/door/window）
  // 2. 正在绘制中（currentNodeId 存在）
  // 3. 按住 Ctrl 键
  const isDrawingTool = tool === 'wall' || tool === 'door' || tool === 'window';
  const isDrawing = currentNodeId !== null;
  
  crosshairVisible.value = isDrawingTool || isDrawing || isCtrlPressed.value;
}

// 获取墙体厚度（毫米）
function getWallThickness(): number {
  return renderConfig.value.wall.defaultThickness;
}

// 加载渲染配置
async function loadRenderConfig() {
  try {
    const response = await fetch('/render-config.json');
    if (response.ok) {
      const config = await response.json();
      renderConfig.value = { ...DEFAULT_RENDER_CONFIG, ...config };
      console.log('[配置] 已加载自定义渲染配置:', renderConfig.value);
    }
  } catch (error) {
    console.warn('[配置] 使用默认渲染配置:', error);
  }
}

// 绘制网格线（每5格用更深的颜色）
function drawGrid(canvas: Canvas, width: number, height: number) {
  const config = renderConfig.value.grid;
  gridLines = [];

  // 绘制垂直线
  for (let i = 0; i * config.size <= width; i++) {
    const x = i * config.size;
    const isMajor = i % config.majorInterval === 0;
    
    const line = new fabric.Line([x, 0, x, height], {
      stroke: isMajor ? config.majorColor : config.color,
      strokeWidth: isMajor ? config.majorStrokeWidth : config.strokeWidth,
      selectable: false,
      evented: false,
    });
    gridLines.push(line);
  }

  // 绘制水平线
  for (let i = 0; i * config.size <= height; i++) {
    const y = i * config.size;
    const isMajor = i % config.majorInterval === 0;
    
    const line = new fabric.Line([0, y, width, y], {
      stroke: isMajor ? config.majorColor : config.color,
      strokeWidth: isMajor ? config.majorStrokeWidth : config.strokeWidth,
      selectable: false,
      evented: false,
    });
    gridLines.push(line);
  }

  // 批量添加网格线到画布底层
  gridLines.forEach(line => {
    canvas.add(line);
  });
  
  // 将所有网格线移到最底层
  gridLines.forEach(line => {
    canvas.sendObjectToBack(line);
  });
}

// 标记需要重绘网格
function markGridNeedsRedraw() {
  needRedrawGrid = true;
}

// 重新绘制网格（根据当前视口）
function redrawGrid() {
  if (!canvas) return;
  
  // 移除旧网格线
  const oldGridCount = gridLines.length;
  gridLines.forEach(line => {
    canvas!.remove(line);
  });
  gridLines = [];
  
  console.log('[redrawGrid] 清除了', oldGridCount, '条旧网格线');
  
  // 计算当前可视区域（考虑缩放和平移）
  const vpt = canvas.viewportTransform!;
  const zoom = canvas.getZoom();
  
  // 视口左上角在画布坐标系中的位置
  const viewportLeft = -vpt[4] / zoom;
  const viewportTop = -vpt[5] / zoom;
  
  // 视口宽高
  const viewportWidth = canvas.width! / zoom;
  const viewportHeight = canvas.height! / zoom;
  
  // 计算需要绘制网格的范围（稍微扩大一点以确保覆盖）
  const config = renderConfig.value.grid;
  const gridSize = config.size;
  
  const startX = Math.floor(viewportLeft / gridSize) * gridSize;
  const endX = Math.ceil((viewportLeft + viewportWidth) / gridSize) * gridSize;
  const startY = Math.floor(viewportTop / gridSize) * gridSize;
  const endY = Math.ceil((viewportTop + viewportHeight) / gridSize) * gridSize;
  
  // 绘制垂直线
  for (let x = startX; x <= endX; x += gridSize) {
    const index = Math.round(x / gridSize);
    const isMajor = index % config.majorInterval === 0;
    
    const line = new fabric.Line([x, startY, x, endY], {
      stroke: isMajor ? config.majorColor : config.color,
      strokeWidth: isMajor ? config.majorStrokeWidth : config.strokeWidth,
      selectable: false,
      evented: false,
    });
    gridLines.push(line);
    canvas.add(line);
  }
  
  // 绘制水平线
  for (let y = startY; y <= endY; y += gridSize) {
    const index = Math.round(y / gridSize);
    const isMajor = index % config.majorInterval === 0;
    
    const line = new fabric.Line([startX, y, endX, y], {
      stroke: isMajor ? config.majorColor : config.color,
      strokeWidth: isMajor ? config.majorStrokeWidth : config.strokeWidth,
      selectable: false,
      evented: false,
    });
    gridLines.push(line);
    canvas.add(line);
  }
  
  // 批量将所有网格线移到最底层
  gridLines.forEach(line => {
    canvas!.sendObjectToBack(line);
  });
  
  console.log('[redrawGrid] 绘制了', gridLines.length, '条新网格线');
  
  canvas.requestRenderAll();
}

// 统一渲染循环（60FPS）
function renderLoop() {
  if (!canvas) return;
  
  // 检查是否需要重绘网格
  if (needRedrawGrid) {
    redrawGrid();
    needRedrawGrid = false;
  }
  
  // 继续下一帧
  animationFrameId = requestAnimationFrame(renderLoop);
}

// 启动渲染循环
function startRenderLoop() {
  if (animationFrameId !== null) return; // 已经在运行
  animationFrameId = requestAnimationFrame(renderLoop);
  console.log('[renderLoop] 启动 60FPS 渲染循环');
}

// 停止渲染循环
function stopRenderLoop() {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
    console.log('[renderLoop] 停止渲染循环');
  }
}

// 更新刻度尺标记（HTML 元素，不在 Canvas 内）
function updateRulers(width: number, height: number) {
  const rulerConfig = renderConfig.value.ruler;
  const gridConfig = renderConfig.value.grid;
  const rulerWidth = rulerConfig.width;
  const scale = renderConfig.value.scale.pixelsPerMeter / 1000; // mm -> px
  const unit = rulerConfig.unit || 'cm';
  
  // 根据单位转换值
  const convertValue = (valueMm: number): number => {
    switch (unit) {
      case 'cm': return Math.round(valueMm / 10);
      case 'm': return Math.round(valueMm / 1000 * 10) / 10;
      default: return valueMm; // mm
    }
  };
  
  // 计算顶部刻度
  const topMarks = [];
  for (let i = 0; i * gridConfig.size <= width - rulerWidth; i++) {
    const x = i * gridConfig.size;
    const isMajor = i % gridConfig.majorInterval === 0;
    const valueMm = Math.round(i * gridConfig.size / scale);
    const displayValue = convertValue(valueMm);
    
    topMarks.push({
      index: i,
      position: x,
      value: displayValue.toString(),
      isMajor,
    });
  }
  topRulerMarks.value = topMarks;
  
  // 计算左侧刻度
  const leftMarks = [];
  for (let i = 0; i * gridConfig.size <= height - rulerWidth; i++) {
    const y = i * gridConfig.size;
    const isMajor = i % gridConfig.majorInterval === 0;
    const valueMm = Math.round(i * gridConfig.size / scale);
    const displayValue = convertValue(valueMm);
    
    leftMarks.push({
      index: i,
      position: y,
      value: displayValue.toString(),
      isMajor,
    });
  }
  leftRulerMarks.value = leftMarks;
}

function syncEngineToCanvas() {
  if (!canvas) return;
  const elements = engine.getAllElements();
  const existingIds = new Set(idToFabricObject.keys());
  const engineIds = new Set(elements.map((e) => e.id));

  existingIds.forEach((id) => {
    if (!engineIds.has(id)) {
      const obj = idToFabricObject.get(id);
      if (obj) {
        canvas!.remove(obj);
        idToFabricObject.delete(id);
      }
    }
  });

  elements.forEach((el) => {
    let obj = idToFabricObject.get(el.id);
    
    // 获取元素配置
    let elementConfig = renderConfig.value.furniture;
    if (el.type === ElementType.DOOR) {
      elementConfig = renderConfig.value.door;
    } else if (el.type === ElementType.WINDOW) {
      elementConfig = renderConfig.value.window;
    }

    if (!obj) {
      // 墙体由 renderAllWalls 单独渲染，这里只处理门窗家具
      if (el.type !== ElementType.WALL) {
        obj = new Rect({
          left: el.x,
          top: el.y,
          width: el.width,
          height: el.height,
          fill: elementConfig.fillColor,
          stroke: elementConfig.strokeColor,
          strokeWidth: elementConfig.strokeWidth,
        });
        
        (obj as FabricObject & { data?: { elementId?: string } }).data = {
          elementId: el.id,
        };
        canvas!.add(obj);
        idToFabricObject.set(el.id, obj);
        
        // 确保元素在网格线上方
        canvas!.bringObjectToFront(obj);
      }
    } else {
      // 更新现有对象
      if (el.type !== ElementType.WALL) {
        obj.set({
          left: el.x,
          top: el.y,
          width: el.width,
          height: el.height,
        });
      }
    }
  });

  if (canvas) {
    canvas.requestRenderAll();
  }
}



// 添加墙体点（连续折线模式，使用GeometryKernel）
function addWallPoint(x: number, y: number) {
  // 像素坐标转换为毫米坐标
  const scale = renderConfig.value.scale.pixelsPerMeter / 1000; // mm -> px
  const positionMm: Vec2 = { 
    x: x / scale, 
    y: y / scale,
  };
  
  console.log('[addWallPoint] 点击位置(px):', { x, y }, '-> (mm):', positionMm);
  
  // 使用GeometryKernel的吸附系统（毫米单位）
  const snapResult = geometryKernel.findSnap(positionMm, currentNodeId || undefined);
  const finalPosMm = snapResult ? snapResult.position : positionMm;
  
  // 转换回像素用于显示
  const finalPosPx = {
    x: finalPosMm.x * scale,
    y: finalPosMm.y * scale,
  };
  
  console.log('[addWallPoint] 吸附后位置(mm):', finalPosMm, '-> (px):', finalPosPx, '吸附类型:', snapResult?.type);
  
  if (!currentNodeId) {
    // 第一个点：创建起始节点
    const result = geometryKernel.addWallPoint(finalPosMm);
    currentNodeId = result.node.id;
    
    console.log('[addWallPoint] 创建起始节点:', currentNodeId);
    
    // 创建跟随鼠标的预览线（像素坐标）
    const previewConfig = renderConfig.value.previewLine;
    tempWallLine = new fabric.Line([finalPosPx.x, finalPosPx.y, finalPosPx.x, finalPosPx.y], {
      stroke: previewConfig.strokeColor,
      strokeWidth: previewConfig.strokeWidth,
      strokeDashArray: previewConfig.strokeDashArray,
      selectable: false,
      evented: false,
      strokeLineCap: 'round',
      opacity: previewConfig.opacity,
    });
    canvas!.add(tempWallLine);
    
    // 开始绘制，更新十字准线状态
    updateCrosshairVisibility();
  } else {
    // 后续点：创建墙体（使用毫米单位）
    const thicknessMm = getWallThickness();
    
    // 检查是否吸附到已有端点（会自动合并节点）
    const isSnapToEndpoint = snapResult && snapResult.type === SnapType.Endpoint && snapResult.targetId;
    
    const result = geometryKernel.addWallPoint(finalPosMm, currentNodeId, thicknessMm);
    
    console.log('[addWallPoint] 创建墙体:', result.wall?.id, '厚度:', thicknessMm, 'mm', '新节点:', result.node.id, '吸附到端点:', isSnapToEndpoint);
    
    if (result.wall) {
      // 如果吸附到已有端点，说明闭合了，结束绘制
      if (isSnapToEndpoint && snapResult.targetId !== currentNodeId) {
        console.log('[addWallPoint] 墙体闭合到已有节点，结束绘制');
        finishWallDrawing();
        return;
      }
      
      // 更新当前节点为新节点
      currentNodeId = result.node.id;
      
      // 重新渲染所有墙体（使用新的网格算法）
      renderAllWalls();
      
      // 更新预览线起点（像素坐标）
      if (tempWallLine) {
        tempWallLine.set({
          x1: finalPosPx.x,
          y1: finalPosPx.y,
          x2: finalPosPx.x,
          y2: finalPosPx.y,
        });
      }
    }
  }
  
  canvas!.requestRenderAll();
}

// 渲染所有墙体（使用GeometryKernel的网格算法）
function renderAllWalls() {
  if (!canvas) return;
  
  console.log('[renderAllWalls] 开始渲染墙体');
  
  // 清除旧的墙体对象
  const wallObjects = canvas.getObjects().filter(obj => {
    const data = (obj as any).data;
    return data && data.type === 'wall';
  });
  console.log(`[renderAllWalls] 清除 ${wallObjects.length} 个旧墙体对象`);
  wallObjects.forEach(obj => canvas!.remove(obj));
  
  // 获取墙体多边形（毫米单位）
  const wallPolygons = geometryKernel.generateWallPolygons();
  console.log(`[renderAllWalls] 生成 ${wallPolygons.size} 个墙体多边形`);
  
  // 渲染每个墙体
  const wallConfig = renderConfig.value.wall;
  const scale = renderConfig.value.scale.pixelsPerMeter / 1000; // mm -> px 的转换比例
  
  wallPolygons.forEach((meshData, wallId) => {
    // 将毫米坐标转换为像素坐标
    const pixelPolygon = meshData.polygon.map(p => ({
      x: p.x * scale,
      y: p.y * scale,
    }));
    
    console.log(`[renderAllWalls] 渲染墙体 ${wallId}, 比例: ${scale}, 多边形:`, pixelPolygon);
    
    const polygon = new fabric.Polygon(
      pixelPolygon,
      {
        fill: wallConfig.fillColor,
        stroke: wallConfig.strokeColor,
        strokeWidth: wallConfig.strokeWidth,
        selectable: false,
        evented: false,
        opacity: wallConfig.opacity,
      }
    );
    
    (polygon as any).data = { type: 'wall', wallId };
    canvas!.add(polygon);
  });
  
  // 确保网格线在最底层
  gridLines.forEach(line => {
    canvas!.sendObjectToBack(line);
  });
  
  // 渲染端点控制点
  renderEndpoints();
  
  canvas!.requestRenderAll();
  console.log('[renderAllWalls] 渲染完成');
}

// 更新端点位置（不重新创建，用于拖动时）
function updateEndpointPositions() {
  if (!canvas) return;
  
  const topology = geometryKernel.getTopology();
  const endpointConfig = renderConfig.value.endpoint;
  const scale = renderConfig.value.scale.pixelsPerMeter / 1000; // mm -> px
  
  // 更新现有端点位置
  topology.getNodes().forEach(node => {
    const circle = wallEndpoints.get(node.id);
    if (circle && !canvas!.getActiveObject()?.equals(circle)) {
      // 只更新非拖动中的端点
      const posPx = {
        x: node.position.x * scale,
        y: node.position.y * scale,
      };
      
      circle.set({
        left: posPx.x - endpointConfig.radius,
        top: posPx.y - endpointConfig.radius,
      });
      circle.setCoords();
    }
  });
}

// 渲染端点控制点（显示在墙体中心线上）
function renderEndpoints() {
  if (!canvas) return;
  
  // 如果正在拖动端点，只更新位置不重新创建
  if (isDraggingEndpoint) {
    updateEndpointPositions();
    return;
  }
  
  // 清除旧的端点
  wallEndpoints.forEach(circle => canvas!.remove(circle));
  wallEndpoints.clear();
  
  // 获取所有节点（毫米单位）
  const topology = geometryKernel.getTopology();
  const nodes = topology.getNodes();
  
  const endpointConfig = renderConfig.value.endpoint;
  const scale = renderConfig.value.scale.pixelsPerMeter / 1000; // mm -> px
  
  nodes.forEach(node => {
    // 将毫米坐标转换为像素（这就是墙体中心线的位置）
    const posPx = {
      x: node.position.x * scale,
      y: node.position.y * scale,
    };
    
    const circle = new fabric.Circle({
      left: posPx.x - endpointConfig.radius,
      top: posPx.y - endpointConfig.radius,
      radius: endpointConfig.radius,
      fill: endpointConfig.fillColor,
      stroke: endpointConfig.strokeColor,
      strokeWidth: endpointConfig.strokeWidth,
      selectable: true,
      hasControls: false,
      hasBorders: false,
      opacity: endpointConfig.opacity,
      hoverCursor: 'move',
    });
    
    (circle as any).data = { type: 'endpoint', nodeId: node.id };
    
    // 端点拖动开始
    circle.on('mousedown', () => {
      isDraggingEndpoint = true;
    });
    
    // 端点拖动事件
    circle.on('moving', (e: any) => {
      const target = e.target as fabric.Circle;
      if (!target || !(target as any).data) {
        console.warn('[拖动端点] 目标对象无效');
        return;
      }
      
      const nodeId = (target as any).data.nodeId;
      
      // 像素坐标转毫米
      const newPosPx = {
        x: target.left! + endpointConfig.radius,
        y: target.top! + endpointConfig.radius,
      };
      const newPosMm: Vec2 = {
        x: newPosPx.x / scale,
        y: newPosPx.y / scale,
      };
      
      console.log('[拖动端点] 节点:', nodeId, '新位置(px):', newPosPx, '-> (mm):', newPosMm);
      
      // 移动节点（毫米单位）
      geometryKernel.moveNode(nodeId, newPosMm);
      
      // 重新渲染所有墙体（但不重新创建端点）
      renderAllWalls();
    });
    
    // 端点拖动结束
    circle.on('mouseup', () => {
      isDraggingEndpoint = false;
    });
    
    // 悬停效果
    circle.on('mouseover', () => {
      circle.set({ opacity: endpointConfig.hoverOpacity });
      canvas!.requestRenderAll();
    });
    
    circle.on('mouseout', () => {
      circle.set({ opacity: endpointConfig.opacity });
      canvas!.requestRenderAll();
    });
    
    canvas!.add(circle);
    canvas!.bringObjectToFront(circle);
    wallEndpoints.set(node.id, circle);
  });
  
  console.log(`[renderEndpoints] 渲染 ${nodes.length} 个端点（位于墙体中心线）`);
}

// 更新预览线位置
function updateWallPreview(x: number, y: number) {
  if (!currentNodeId || !tempWallLine) return;
  
  // 像素转毫米
  const scale = renderConfig.value.scale.pixelsPerMeter / 1000;
  let positionMm: Vec2 = { 
    x: x / scale, 
    y: y / scale,
  };
  
  // 获取当前节点位置
  const topology = geometryKernel.getTopology();
  const currentNode = topology.getNode(currentNodeId);
  if (!currentNode) return;
  
  // Shift 键增强吸附（优先级最高）
  if (isShiftPressed.value) {
    const snapConfig = renderConfig.value.snap;
    const dx = positionMm.x - currentNode.position.x;
    const dy = positionMm.y - currentNode.position.y;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    const absAngle = Math.abs(angle);
    
    // 1. 角度吸附：接近水平/垂直时自动对齐
    if (absAngle < snapConfig.angleThreshold || absAngle > 180 - snapConfig.angleThreshold) {
      // 吸附到水平
      positionMm.y = currentNode.position.y;
      console.log('[角度吸附] 水平', angle.toFixed(1), '°');
    } else if (Math.abs(absAngle - 90) < snapConfig.angleThreshold) {
      // 吸附到垂直（90°）
      positionMm.x = currentNode.position.x;
      console.log('[角度吸附] 垂直', angle.toFixed(1), '°');
    } else if (Math.abs(absAngle + 90) < snapConfig.angleThreshold) {
      // 吸附到垂直（-90°）
      positionMm.x = currentNode.position.x;
      console.log('[角度吸附] 垂直', angle.toFixed(1), '°');
    }
    
    // 2. 长度增量吸附：按 5cm 增量吸附
    const newDx = positionMm.x - currentNode.position.x;
    const newDy = positionMm.y - currentNode.position.y;
    const length = Math.sqrt(newDx * newDx + newDy * newDy);
    const increment = snapConfig.lengthIncrement;
    const snappedLength = Math.round(length / increment) * increment;
    
    if (Math.abs(length - snappedLength) < increment / 2) {
      // 按增量吸附长度
      const ratio = snappedLength / length;
      positionMm.x = currentNode.position.x + newDx * ratio;
      positionMm.y = currentNode.position.y + newDy * ratio;
      console.log('[长度吸附]', length.toFixed(0), 'mm →', snappedLength, 'mm');
    }
    
    // 3. 十字准线吸附：吸附到附近的水平/垂直线
    const crosshairDist = snapConfig.crosshairDistance;
    const allNodes = topology.getNodes();
    
    for (const node of allNodes) {
      if (node.id === currentNodeId) continue;
      
      // 检查是否接近水平对齐
      if (Math.abs(positionMm.y - node.position.y) < crosshairDist) {
        positionMm.y = node.position.y;
        console.log('[十字准线吸附] 水平对齐到节点', node.id);
        break;
      }
      
      // 检查是否接近垂直对齐
      if (Math.abs(positionMm.x - node.position.x) < crosshairDist) {
        positionMm.x = node.position.x;
        console.log('[十字准线吸附] 垂直对齐到节点', node.id);
        break;
      }
    }
  }
  
  // 使用GeometryKernel的吸附系统（毫米单位）
  const snapResult = geometryKernel.findSnap(positionMm, currentNodeId);
  const finalPosMm = snapResult ? snapResult.position : positionMm;
  
  // 转换回像素
  const finalPosPx = {
    x: finalPosMm.x * scale,
    y: finalPosMm.y * scale,
  };
  
  // 显示/隐藏吸附指示器
  const snapConfig = renderConfig.value.snapIndicator;
  if (snapResult) {
    if (!snapIndicator) {
      snapIndicator = new fabric.Circle({
        radius: snapConfig.radius,
        fill: snapConfig.fillColor,
        stroke: snapConfig.strokeColor,
        strokeWidth: snapConfig.strokeWidth,
        selectable: false,
        evented: false,
        opacity: snapConfig.opacity,
      });
      canvas!.add(snapIndicator);
    }
    snapIndicator.set({
      left: finalPosPx.x - snapConfig.radius,
      top: finalPosPx.y - snapConfig.radius,
      visible: true,
    });
  } else if (snapIndicator) {
    snapIndicator.set({ visible: false });
  }
  
  // 转换为像素显示
  const startPx = {
    x: currentNode.position.x * scale,
    y: currentNode.position.y * scale,
  };
  
  tempWallLine.set({
    x1: startPx.x,
    y1: startPx.y,
    x2: finalPosPx.x,
    y2: finalPosPx.y,
  });
  
  // 绘制尺寸标注（根据配置决定是否显示）
  const dimConfig = renderConfig.value.dimension;
  if (dimConfig.enabled) {
    // 计算墙体长度（毫米）
    const dx = finalPosMm.x - currentNode.position.x;
    const dy = finalPosMm.y - currentNode.position.y;
    const lengthMm = Math.sqrt(dx * dx + dy * dy);
    
    // 根据配置单位转换长度
    const unit = renderConfig.value.ruler.unit || 'cm';
    let displayLength = lengthMm;
    let unitText = 'mm';
    
    if (unit === 'cm') {
      displayLength = lengthMm / 10;
      unitText = 'cm';
    } else if (unit === 'm') {
      displayLength = lengthMm / 1000;
      unitText = 'm';
    }
    
    // 绘制尺寸标注线（在墙体上方偏移）
    const midPx = {
      x: (startPx.x + finalPosPx.x) / 2,
      y: (startPx.y + finalPosPx.y) / 2,
    };
    
    // 计算垂直于墙体的偏移方向
    const wallAngle = Math.atan2(finalPosPx.y - startPx.y, finalPosPx.x - startPx.x);
    const offsetDistance = dimConfig.offsetDistance;
    const offsetX = -Math.sin(wallAngle) * offsetDistance;
    const offsetY = Math.cos(wallAngle) * offsetDistance;
    
    const dimStart = {
      x: startPx.x + offsetX,
      y: startPx.y + offsetY,
    };
    const dimEnd = {
      x: finalPosPx.x + offsetX,
      y: finalPosPx.y + offsetY,
    };
    
    // 创建或更新尺寸标注线
    if (!dimensionLine) {
      dimensionLine = new fabric.Line([dimStart.x, dimStart.y, dimEnd.x, dimEnd.y], {
        stroke: dimConfig.lineColor,
        strokeWidth: 1,
        strokeDashArray: [5, 3],
        selectable: false,
        evented: false,
        opacity: 0.8,
      });
      canvas!.add(dimensionLine);
    } else {
      dimensionLine.set({
        x1: dimStart.x,
        y1: dimStart.y,
        x2: dimEnd.x,
        y2: dimEnd.y,
        visible: true,
      });
    }
    
    // 创建或更新尺寸文字
    const dimText = `${displayLength.toFixed(unit === 'm' ? 2 : 0)} ${unitText}`;
    const textPos = {
      x: midPx.x + offsetX,
      y: midPx.y + offsetY,
    };
    
    if (!dimensionText) {
      dimensionText = new fabric.Text(dimText, {
        left: textPos.x,
        top: textPos.y,
        fontSize: dimConfig.fontSize,
        fill: dimConfig.textColor,
        backgroundColor: dimConfig.backgroundColor,
        padding: 3,
        selectable: false,
        evented: false,
        originX: 'center',
        originY: 'center',
      });
      canvas!.add(dimensionText);
    } else {
      dimensionText.set({
        text: dimText,
        left: textPos.x,
        top: textPos.y,
        visible: true,
      });
    }
  } else {
    // 隐藏尺寸标注
    if (dimensionLine) dimensionLine.set({ visible: false });
    if (dimensionText) dimensionText.set({ visible: false });
  }
  
  canvas!.requestRenderAll();
}

// 完成墙体绘制（双击或右键）
function finishWallDrawing() {
  // 清除预览线
  if (tempWallLine) {
    canvas!.remove(tempWallLine);
    tempWallLine = null;
  }
  
  // 清除吸附指示器
  if (snapIndicator) {
    canvas!.remove(snapIndicator);
    snapIndicator = null;
  }
  
  // 清除尺寸标注
  if (dimensionLine) {
    canvas!.remove(dimensionLine);
    dimensionLine = null;
  }
  if (dimensionText) {
    canvas!.remove(dimensionText);
    dimensionText = null;
  }
  
  // 重置状态
  currentNodeId = null;
  
  // 触发房间检测
  geometryKernel.detectRooms();
  
  // 重新渲染所有墙体
  renderAllWalls();
  
  // 更新十字准线状态（结束绘制后根据当前工具决定是否显示）
  updateCrosshairVisibility();
  
  canvas!.requestRenderAll();
}

// 添加其他元素（门、窗）
function addElementFromClick(x: number, y: number) {
  const tool = editorStore.currentTool;
  if (tool === 'select') return;

  const type =
    tool === 'door'
      ? ElementType.DOOR
      : ElementType.WINDOW;
  const [w, h] =
    tool === 'door'
      ? [90, 20]
      : [120, 20];

  const id = `${type}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  engine.addElement({
    id,
    type,
    x,
    y,
    width: w,
    height: h,
    properties: {},
  });
  editorStore.setCurrentTool('select');
}

onMounted(async () => {
  if (!canvasContainer.value || !canvasEl.value) return;

  // 加载渲染配置
  await loadRenderConfig();

  const container = canvasContainer.value;
  const width = container.clientWidth;
  const height = container.clientHeight;

  canvas = new Canvas(canvasEl.value, {
    width,
    height,
    backgroundColor: '#ffffff',
    selection: editorStore.currentTool === 'select',
  });
  
  // 启用滚轮缩放
  canvas.on('mouse:wheel', (opt) => {
    const delta = opt.e.deltaY;
    let zoom = canvas!.getZoom();
    
    const scaleConfig = renderConfig.value.scale;
    
    // 缩放因子（使用配置的速度）
    zoom *= (1 - scaleConfig.zoomSpeed) ** delta;
    
    // 限制缩放范围（使用配置的范围）
    if (zoom > scaleConfig.maxZoom) zoom = scaleConfig.maxZoom;
    if (zoom < scaleConfig.minZoom) zoom = scaleConfig.minZoom;
    
    // 以鼠标位置为中心缩放
    const point = canvas!.getScenePoint(opt.e);
    canvas!.zoomToPoint(point, zoom);
    
    // 标记需要重绘网格
    markGridNeedsRedraw();
    
    opt.e.preventDefault();
    opt.e.stopPropagation();
    
    console.log('[缩放] 当前缩放级别:', zoom.toFixed(2));
  });
  
  // 启用中键拖动平移画布（Shift键用于角度吸附，不再用于平移）
  let isPanning = false;
  let lastPosX = 0;
  let lastPosY = 0;
  
  canvas.on('mouse:down', (opt) => {
    const evt = opt.e as MouseEvent;
    // 仅中键开始平移
    if (evt.button === 1) {
      isPanning = true;
      lastPosX = evt.clientX;
      lastPosY = evt.clientY;
      canvas!.selection = false;
      canvas!.defaultCursor = 'grab';
    }
  });
  
  canvas.on('mouse:move', (opt) => {
    if (isPanning) {
      const evt = opt.e as MouseEvent;
      const vpt = canvas!.viewportTransform!;
      vpt[4] += evt.clientX - lastPosX;
      vpt[5] += evt.clientY - lastPosY;
      canvas!.requestRenderAll();
      lastPosX = evt.clientX;
      lastPosY = evt.clientY;
      canvas!.defaultCursor = 'grabbing';
    }
  });
  
  canvas.on('mouse:up', () => {
    // 重置拖动端点标志
    if (isDraggingEndpoint) {
      isDraggingEndpoint = false;
      console.log('[拖动端点] 拖动结束');
    }
    
    if (isPanning) {
      isPanning = false;
      canvas!.selection = editorStore.currentTool === 'select';
      canvas!.defaultCursor = editorStore.currentTool === 'select' ? 'default' : 'crosshair';
      
      // 标记需要重绘网格
      markGridNeedsRedraw();
    }
  });

  // 绘制网格线
  drawGrid(canvas, width, height);
  
  // 更新刻度尺标记（HTML 元素）
  updateRulers(width, height);

  unsubs = [
    engine.events.on(EditorEvents.ELEMENT_ADDED, () => syncEngineToCanvas()),
    engine.events.on(EditorEvents.ELEMENT_DELETED, () => syncEngineToCanvas()),
    engine.events.on(EditorEvents.ELEMENT_MOVED, () => syncEngineToCanvas()),
    engine.events.on(EditorEvents.ELEMENT_UPDATED, () => syncEngineToCanvas()),
  ];

  syncEngineToCanvas();

  // 鼠标按下事件
  canvas.on('mouse:down', (ev) => {
    const mouseEvent = ev.e as MouseEvent;
    
    // 中键：已在上面的平移逻辑中处理
    if (mouseEvent.button === 1) {
      return;
    }
    
    // 检查是否是右键
    if (mouseEvent.button === 2) {
      // 右键：结束墙体绘制
      if (currentNodeId) {
        finishWallDrawing();
      }
      return;
    }
    
    // 左键：绘制操作
    const point = canvas!.getScenePoint(ev.e);
    const x = point.x;
    const y = point.y;
    
    const tool = editorStore.currentTool;
    
    if (tool === 'wall') {
      // 连续折线模式：每次左键点击添加一个点
      addWallPoint(x, y);
    } else if (tool !== 'select') {
      // 其他工具（门、窗）
      addElementFromClick(x, y);
    }
  });
  
  // 鼠标移动事件
  canvas.on('mouse:move', (ev) => {
    const point = canvas!.getScenePoint(ev.e);
    
    // 更新十字准线位置（使用画布坐标）
    const canvasRect = canvasEl.value!.getBoundingClientRect();
    crosshairX.value = ev.e.clientX - canvasRect.left;
    crosshairY.value = ev.e.clientY - canvasRect.top;
    
    // 更新坐标显示（根据配置单位转换）
    const scale = renderConfig.value.scale.pixelsPerMeter / 1000;
    const unit = renderConfig.value.ruler.unit || 'cm';
    const valueMm = {
      x: Math.round(point.x / scale),
      y: Math.round(point.y / scale)
    };
    
    // 根据单位转换
    if (unit === 'cm') {
      cursorCoordsMm.value = {
        x: Math.round(valueMm.x / 10),
        y: Math.round(valueMm.y / 10)
      };
    } else if (unit === 'm') {
      cursorCoordsMm.value = {
        x: Math.round(valueMm.x / 100) / 10,
        y: Math.round(valueMm.y / 100) / 10
      };
    } else {
      cursorCoordsMm.value = valueMm;
    }
    
    // 墙体绘制模式：预览线跟随鼠标
    if (editorStore.currentTool === 'wall' && currentNodeId) {
      updateWallPreview(point.x, point.y);
    }
  });
  
  // 鼠标进入画布
  canvas.on('mouse:over', () => {
    updateCrosshairVisibility();
  });
  
  // 鼠标离开画布
  canvas.on('mouse:out', () => {
    crosshairVisible.value = false;
  });
  
  // 注册键盘事件监听
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
  
  // 右键结束绘制
  canvasEl.value.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (currentNodeId) {
      finishWallDrawing();
    }
  });
  
  // 双击结束绘制
  canvas.on('mouse:dblclick', () => {
    if (currentNodeId) {
      finishWallDrawing();
    }
  });

  canvas.on('selection:created', (e) => {
    const obj = e.selected?.[0] as FabricObject & {
      data?: { elementId?: string };
    };
    if (obj?.data?.elementId) {
      engine.select(obj.data.elementId);
    }
  });
  canvas.on('selection:updated', (e) => {
    const objs = (e.selected ?? []) as (FabricObject & {
      data?: { elementId?: string };
    })[];
    const ids = objs
      .map((o) => o.data?.elementId)
      .filter((id): id is string => !!id);
    engine.selectMultiple(ids);
  });
  canvas.on('selection:cleared', () => {
    engine.clearSelection();
  });

  canvas.on('object:modified', (e) => {
    const obj = e.target as FabricObject & { data?: { elementId?: string } };
    if (!obj?.data?.elementId) return;
    const left = obj.left ?? 0;
    const top = obj.top ?? 0;
    const scaleX = obj.scaleX ?? 1;
    const scaleY = obj.scaleY ?? 1;
    const w = (obj.width ?? 0) * scaleX;
    const h = (obj.height ?? 0) * scaleY;
    engine.moveElement(obj.data.elementId, { x: left, y: top });
    engine.updateElement(obj.data.elementId, { width: w, height: h });
  });

  const resizeObserver = new ResizeObserver(() => {
    if (canvas && canvasContainer.value) {
      const newWidth = canvasContainer.value.clientWidth;
      const newHeight = canvasContainer.value.clientHeight;
      
      // 重新设置画布尺寸
      canvas.setDimensions({
        width: newWidth,
        height: newHeight,
      });
      
      // 标记需要重绘网格
      markGridNeedsRedraw();
      
      // 更新刻度尺标记（HTML 元素）
      updateRulers(newWidth, newHeight);
      
      // 确保元素在网格上方
      syncEngineToCanvas();
      
      canvas.requestRenderAll();
    }
  });
  resizeObserver.observe(container);
  
  // 启动渲染循环
  startRenderLoop();
});

onUnmounted(() => {
  unsubs.forEach((fn) => fn());
  canvas?.dispose();
  canvas = null;
  idToFabricObject.clear();
  
  // 停止渲染循环
  stopRenderLoop();
  
  // 清理键盘事件监听
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('keyup', handleKeyUp);
});

watch(
  () => editorStore.currentTool,
  (tool) => {
    if (canvas) {
      canvas.selection = tool === 'select';
      canvas.defaultCursor = tool === 'select' ? 'default' : 'crosshair';
      
      // 切换工具时，清理墙体绘制状态
      if (tool !== 'wall' && currentNodeId) {
        finishWallDrawing();
      }
      
      // 更新十字准线显示状态
      updateCrosshairVisibility();
    }
  }
);
</script>

<template>
  <div ref="canvasContainer" class="canvas-view">
    <!-- 顶部刻度尺 -->
    <div class="ruler ruler-top">
      <div 
        v-for="i in topRulerMarks" 
        :key="`top-${i.index}`"
        class="ruler-mark"
        :class="{ major: i.isMajor }"
        :style="{ left: i.position + 'px' }"
      >
        <div class="ruler-line" :class="{ major: i.isMajor }"></div>
        <span v-if="i.isMajor" class="ruler-text">{{ i.value }}</span>
      </div>
    </div>
    
    <!-- 左侧刻度尺 -->
    <div class="ruler ruler-left">
      <div 
        v-for="i in leftRulerMarks" 
        :key="`left-${i.index}`"
        class="ruler-mark-left"
        :class="{ major: i.isMajor }"
        :style="{ top: i.position + 'px' }"
      >
        <div class="ruler-line" :class="{ major: i.isMajor }"></div>
        <div v-if="i.isMajor" class="ruler-text-left">
          <span v-for="(char, idx) in i.value.split('')" :key="idx">{{ char }}</span>
        </div>
      </div>
    </div>
    
    <!-- 左上角方块 -->
    <div class="ruler-corner"></div>
    
    <!-- 十字准线 -->
    <div 
      v-if="crosshairVisible" 
      class="crosshair"
      :style="{ '--cursor-x': crosshairX + 'px', '--cursor-y': crosshairY + 'px' }"
    >
      <div class="crosshair-vertical" :style="{ left: crosshairX + 'px' }"></div>
      <div class="crosshair-horizontal" :style="{ top: crosshairY + 'px' }"></div>
      
      <!-- 坐标显示 -->
      <div 
        class="cursor-coords" 
        :style="{ 
          left: (crosshairX + 15) + 'px', 
          top: (crosshairY + 15) + 'px' 
        }"
      >
        {{ cursorCoordsMm.x }}, {{ cursorCoordsMm.y }} {{ renderConfig.ruler.unit }}
      </div>
    </div>
    
    <!-- 快捷键提示 -->
    <div v-if="isShiftPressed && currentNodeId" class="key-hint shift-hint">
      <span class="hint-icon">⇅</span>
      <span>按住 Shift 启用角度吸附</span>
    </div>
    
    <div v-if="isCtrlPressed && !currentNodeId" class="key-hint ctrl-hint">
      <span class="hint-icon">✛</span>
      <span>Ctrl 显示十字准线</span>
    </div>
    
    <canvas ref="canvasEl"></canvas>
  </div>
</template>

<style scoped>
.canvas-view {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
  cursor: crosshair;
}

.canvas-view canvas {
  display: block;
  cursor: none;
}

/* 刻度尺样式 - 固定在视口边缘 */
.ruler {
  position: absolute;
  background: #f5f5f5;
  z-index: 1000;
  pointer-events: none;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.1);
}

.ruler-top {
  left: 30px;
  top: 0;
  right: 0;
  height: 30px;
  border-bottom: 1px solid #dcdcdc;
}

.ruler-left {
  left: 0;
  top: 30px;
  bottom: 0;
  width: 30px;
  border-right: 1px solid #dcdcdc;
}

.ruler-corner {
  position: absolute;
  left: 0;
  top: 0;
  width: 30px;
  height: 30px;
  background: #f5f5f5;
  border-right: 1px solid #dcdcdc;
  border-bottom: 1px solid #dcdcdc;
  z-index: 1001;
  pointer-events: none;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.1);
}

.ruler-mark {
  position: absolute;
  height: 100%;
}

.ruler-mark-left {
  position: absolute;
  width: 100%;
}

.ruler-line {
  position: absolute;
  background: #999;
}

.ruler-top .ruler-line {
  width: 1px;
  height: 5px;
  bottom: 0;
  left: 0;
}

.ruler-top .ruler-line.major {
  height: 10px;
  background: #666;
}

.ruler-left .ruler-line {
  width: 5px;
  height: 1px;
  right: 0;
  top: 0;
}

.ruler-left .ruler-line.major {
  width: 10px;
  background: #666;
}

.ruler-text {
  position: absolute;
  font-size: 10px;
  color: #333;
  user-select: none;
  font-family: monospace;
}

.ruler-top .ruler-text {
  left: 50%;
  transform: translateX(-50%);
  top: 2px;
  white-space: nowrap;
}

.ruler-text-left {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 10px;
  color: #333;
  user-select: none;
  font-family: monospace;
  line-height: 10px;
}

.ruler-text-left span {
  display: block;
  text-align: center;
  height: 10px;
  line-height: 10px;
}

/* 十字准线 */
.crosshair {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 999;
}

.crosshair-vertical {
  position: absolute;
  top: 30px;
  bottom: 0;
  width: 0;
  border-left: 1px dashed rgba(0, 150, 255, 0.6);
  transform: translateX(-0.5px);
}

.crosshair-horizontal {
  position: absolute;
  left: 30px;
  right: 0;
  height: 0;
  border-top: 1px dashed rgba(0, 150, 255, 0.6);
  transform: translateY(-0.5px);
}

/* 自定义鼠标指针 */
.crosshair::before {
  content: '';
  position: absolute;
  left: var(--cursor-x, 0);
  top: var(--cursor-y, 0);
  width: 16px;
  height: 16px;
  border: 2px solid rgba(0, 150, 255, 0.8);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  background: rgba(255, 255, 255, 0.3);
  box-shadow: 0 0 4px rgba(0, 150, 255, 0.5);
}

.crosshair::after {
  content: '';
  position: absolute;
  left: var(--cursor-x, 0);
  top: var(--cursor-y, 0);
  width: 4px;
  height: 4px;
  background: rgba(0, 150, 255, 0.9);
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

/* 坐标显示 */
.cursor-coords {
  position: absolute;
  background: rgba(0, 0, 0, 0.75);
  color: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-family: monospace;
  white-space: nowrap;
  pointer-events: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

/* 快捷键提示 */
.key-hint {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  color: #fff;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  pointer-events: none;
  z-index: 1002;
  display: flex;
  align-items: center;
  gap: 8px;
  animation: fadeIn 0.2s ease-in-out;
}

.shift-hint {
  background: rgba(0, 150, 255, 0.9);
  box-shadow: 0 4px 12px rgba(0, 150, 255, 0.4);
}

.ctrl-hint {
  background: rgba(255, 107, 0, 0.9);
  box-shadow: 0 4px 12px rgba(255, 107, 0, 0.4);
}

.hint-icon {
  font-size: 18px;
  font-weight: bold;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}
</style>
