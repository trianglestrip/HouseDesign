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
  const rulerConfig = renderConfig.value.ruler;
  const gridLines: FabricObject[] = [];
  
  // 刻度尺的偏移量
  const offsetX = rulerConfig.width;
  const offsetY = rulerConfig.width;

  // 绘制垂直线
  for (let i = 0; i * config.size <= width; i++) {
    const x = i * config.size + offsetX;
    const isMajor = i % config.majorInterval === 0;
    
    const line = new fabric.Line([x, offsetY, x, height], {
      stroke: isMajor ? config.majorColor : config.color,
      strokeWidth: isMajor ? config.majorStrokeWidth : config.strokeWidth,
      selectable: false,
      evented: false,
    });
    gridLines.push(line);
  }

  // 绘制水平线
  for (let i = 0; i * config.size <= height; i++) {
    const y = i * config.size + offsetY;
    const isMajor = i % config.majorInterval === 0;
    
    const line = new fabric.Line([offsetX, y, width, y], {
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

// 绘制刻度尺
function drawRulers(canvas: Canvas, width: number, height: number) {
  const rulerConfig = renderConfig.value.ruler;
  const gridConfig = renderConfig.value.grid;
  const rulerWidth = rulerConfig.width;
  
  // 顶部刻度尺背景
  const topRuler = new fabric.Rect({
    left: 0,
    top: 0,
    width: width,
    height: rulerWidth,
    fill: rulerConfig.backgroundColor,
    selectable: false,
    evented: false,
  });
  canvas.add(topRuler);
  
  // 左侧刻度尺背景
  const leftRuler = new fabric.Rect({
    left: 0,
    top: 0,
    width: rulerWidth,
    height: height,
    fill: rulerConfig.backgroundColor,
    selectable: false,
    evented: false,
  });
  canvas.add(leftRuler);
  
  // 左上角方块
  const corner = new fabric.Rect({
    left: 0,
    top: 0,
    width: rulerWidth,
    height: rulerWidth,
    fill: rulerConfig.backgroundColor,
    selectable: false,
    evented: false,
  });
  canvas.add(corner);
  
  // 绘制顶部刻度
  const scale = renderConfig.value.scale.pixelsPerMeter / 1000; // mm -> px
  for (let i = 0; i * gridConfig.size <= width - rulerWidth; i++) {
    const x = i * gridConfig.size + rulerWidth;
    const isMajor = i % gridConfig.majorInterval === 0;
    
    if (isMajor) {
      // 主刻度线
      const line = new fabric.Line([x, rulerWidth - 10, x, rulerWidth], {
        stroke: rulerConfig.lineColor,
        strokeWidth: 1,
        selectable: false,
        evented: false,
      });
      canvas.add(line);
      
      // 刻度值（毫米）
      const valueMm = Math.round(i * gridConfig.size / scale);
      const text = new fabric.Text(valueMm.toString(), {
        left: x - 10,
        top: 5,
        fontSize: rulerConfig.fontSize,
        fill: rulerConfig.textColor,
        selectable: false,
        evented: false,
      });
      canvas.add(text);
    } else {
      // 次刻度线
      const line = new fabric.Line([x, rulerWidth - 5, x, rulerWidth], {
        stroke: rulerConfig.lineColor,
        strokeWidth: 0.5,
        selectable: false,
        evented: false,
      });
      canvas.add(line);
    }
  }
  
  // 绘制左侧刻度
  for (let i = 0; i * gridConfig.size <= height - rulerWidth; i++) {
    const y = i * gridConfig.size + rulerWidth;
    const isMajor = i % gridConfig.majorInterval === 0;
    
    if (isMajor) {
      // 主刻度线
      const line = new fabric.Line([rulerWidth - 10, y, rulerWidth, y], {
        stroke: rulerConfig.lineColor,
        strokeWidth: 1,
        selectable: false,
        evented: false,
      });
      canvas.add(line);
      
      // 刻度值（毫米）
      const valueMm = Math.round(i * gridConfig.size / scale);
      const text = new fabric.Text(valueMm.toString(), {
        left: 3,
        top: y - 6,
        fontSize: rulerConfig.fontSize,
        fill: rulerConfig.textColor,
        selectable: false,
        evented: false,
      });
      canvas.add(text);
    } else {
      // 次刻度线
      const line = new fabric.Line([rulerWidth - 5, y, rulerWidth, y], {
        stroke: rulerConfig.lineColor,
        strokeWidth: 0.5,
        selectable: false,
        evented: false,
      });
      canvas.add(line);
    }
  }
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
  } else {
    // 后续点：创建墙体（使用毫米单位）
    const thicknessMm = getWallThickness();
    const result = geometryKernel.addWallPoint(finalPosMm, currentNodeId, thicknessMm);
    
    console.log('[addWallPoint] 创建墙体:', result.wall?.id, '厚度:', thicknessMm, 'mm', '新节点:', result.node.id);
    
    if (result.wall) {
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
  
  // 渲染端点控制点
  renderEndpoints();
  
  canvas!.requestRenderAll();
  console.log('[renderAllWalls] 渲染完成');
}

// 渲染端点控制点（显示在墙体中心线上）
function renderEndpoints() {
  if (!canvas) return;
  
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
    
    // 端点拖动事件
    circle.on('moving', (e: any) => {
      const target = e.target as fabric.Circle;
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
      
      // 重新渲染所有墙体
      renderAllWalls();
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
  const positionMm: Vec2 = { 
    x: x / scale, 
    y: y / scale,
  };
  
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
  
  // 获取当前节点位置（毫米）并转换为像素
  const topology = geometryKernel.getTopology();
  const currentNode = topology.getNode(currentNodeId);
  if (currentNode) {
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
  
  // 重置状态
  currentNodeId = null;
  
  // 触发房间检测
  geometryKernel.detectRooms();
  
  // 重新渲染所有墙体
  renderAllWalls();
  
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
    
    opt.e.preventDefault();
    opt.e.stopPropagation();
    
    console.log('[缩放] 当前缩放级别:', zoom.toFixed(2));
  });
  
  // 启用空格+拖动 或 中键拖动 平移画布
  let isPanning = false;
  let lastPosX = 0;
  let lastPosY = 0;
  
  canvas.on('mouse:down', (opt) => {
    const evt = opt.e as MouseEvent;
    // 中键或空格+左键开始平移
    if (evt.button === 1 || (evt.button === 0 && evt.shiftKey)) {
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
    if (isPanning) {
      isPanning = false;
      canvas!.selection = editorStore.currentTool === 'select';
      canvas!.defaultCursor = editorStore.currentTool === 'select' ? 'default' : 'crosshair';
    }
  });

  // 绘制网格线
  drawGrid(canvas, width, height);
  
  // 绘制刻度尺
  drawRulers(canvas, width, height);

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
    
    // 中键或Shift+左键：已在上面的平移逻辑中处理
    if (mouseEvent.button === 1 || (mouseEvent.button === 0 && mouseEvent.shiftKey)) {
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
    
    // 墙体绘制模式：预览线跟随鼠标
    if (editorStore.currentTool === 'wall' && currentNodeId) {
      updateWallPreview(point.x, point.y);
    }
  });
  
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
      
      // 清除旧的网格线和刻度尺
      const objects = canvas.getObjects().slice();
      objects.forEach(obj => {
        if ((obj.type === 'line' || obj.type === 'rect' || obj.type === 'text') && !obj.selectable) {
          canvas!.remove(obj);
        }
      });
      
      // 重新设置画布尺寸
      canvas.setDimensions({
        width: newWidth,
        height: newHeight,
      });
      
      // 重新绘制网格和刻度尺
      drawGrid(canvas, newWidth, newHeight);
      drawRulers(canvas, newWidth, newHeight);
      
      // 确保元素在网格上方
      syncEngineToCanvas();
      
      canvas.requestRenderAll();
    }
  });
  resizeObserver.observe(container);
});

onUnmounted(() => {
  unsubs.forEach((fn) => fn());
  canvas?.dispose();
  canvas = null;
  idToFabricObject.clear();
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
    }
  }
);
</script>

<template>
  <div ref="canvasContainer" class="canvas-view">
    <canvas ref="canvasEl"></canvas>
  </div>
</template>

<style scoped>
.canvas-view {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
}

.canvas-view canvas {
  display: block;
}
</style>
