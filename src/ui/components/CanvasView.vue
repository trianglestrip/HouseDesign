<script setup lang="ts">
import { inject, ref, onMounted, onUnmounted, watch } from 'vue';
import { EDITOR_ENGINE_KEY } from '../../constants/injectKeys';
import { EditorEvents } from '../../core/EditorEngine';
import { ElementType } from '../../constants/elementTypes';
import { useEditorStore } from '../stores/editorStore';
import { Canvas, Rect } from 'fabric';
import type { FabricObject } from 'fabric';

const engine = inject<import('@/core').EditorEngine>(EDITOR_ENGINE_KEY)!;
const editorStore = useEditorStore();

const canvasContainer = ref<HTMLDivElement | null>(null);
const canvasEl = ref<HTMLCanvasElement | null>(null);
let canvas: Canvas | null = null;
const fabricObjectToId = new Map<FabricObject, string>();
const idToFabricObject = new Map<string, FabricObject>();
let unsubs: (() => void)[] = [];

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
        fabricObjectToId.delete(obj);
        idToFabricObject.delete(id);
      }
    }
  });

  elements.forEach((el) => {
    let obj = idToFabricObject.get(el.id);
    const fill =
      el.type === ElementType.WALL
        ? '#8b7355'
        : el.type === ElementType.DOOR
          ? '#c4a35a'
          : el.type === ElementType.WINDOW
            ? '#87ceeb'
            : '#A5D6A7';

    if (!obj) {
      obj = new Rect({
        left: el.x,
        top: el.y,
        width: el.width,
        height: el.height,
        fill,
        stroke: '#333',
        strokeWidth: 1,
      });
      (obj as FabricObject & { data?: { elementId?: string } }).data = {
        elementId: el.id,
      };
      canvas!.add(obj);
      fabricObjectToId.set(obj, el.id);
      idToFabricObject.set(el.id, obj);
    } else {
      obj.set({
        left: el.x,
        top: el.y,
        width: el.width,
        height: el.height,
      });
    }
  });

  canvas.requestRenderAll();
}

function addElementFromClick(x: number, y: number) {
  const tool = editorStore.currentTool;
  if (tool === 'select') return;

  const type =
    tool === 'wall'
      ? ElementType.WALL
      : tool === 'door'
        ? ElementType.DOOR
        : ElementType.WINDOW;
  const [w, h] =
    tool === 'wall'
      ? [100, 20]
      : tool === 'door'
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

onMounted(() => {
  if (!canvasContainer.value || !canvasEl.value) return;

  const container = canvasContainer.value;
  const width = container.clientWidth;
  const height = container.clientHeight;

  canvas = new Canvas(canvasEl.value, {
    width,
    height,
    backgroundColor: '#f5f7fa',
    selection: editorStore.currentTool === 'select',
  });

  unsubs = [
    engine.events.on(EditorEvents.ELEMENT_ADDED, () => syncEngineToCanvas()),
    engine.events.on(EditorEvents.ELEMENT_DELETED, () => syncEngineToCanvas()),
    engine.events.on(EditorEvents.ELEMENT_MOVED, () => syncEngineToCanvas()),
    engine.events.on(EditorEvents.ELEMENT_UPDATED, () => syncEngineToCanvas()),
  ];

  syncEngineToCanvas();

  canvas.on('mouse:down', (ev) => {
    const point = canvas!.getScenePoint(ev.e);
    const x = point.x;
    const y = point.y;
    if (editorStore.currentTool !== 'select') {
      addElementFromClick(x, y);
    }
  });

  canvas.on('selection:created', (e) => {
    const obj = e.selected?.[0] as FabricObject & { data?: { elementId?: string } };
    if (obj?.data?.elementId) {
      engine.select(obj.data.elementId);
    }
  });
  canvas.on('selection:updated', (e) => {
    const objs = (e.selected ?? []) as (FabricObject & { data?: { elementId?: string } })[];
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
      canvas.setDimensions({
        width: canvasContainer.value.clientWidth,
        height: canvasContainer.value.clientHeight,
      });
      canvas.requestRenderAll();
    }
  });
  resizeObserver.observe(container);
});

onUnmounted(() => {
  unsubs.forEach((fn) => fn());
  canvas?.dispose();
  canvas = null;
  fabricObjectToId.clear();
  idToFabricObject.clear();
});

watch(
  () => editorStore.currentTool,
  (tool) => {
    if (canvas) {
      canvas.selection = tool === 'select';
      canvas.defaultCursor = tool === 'select' ? 'default' : 'crosshair';
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
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  position: relative;
}

.canvas-view canvas {
  display: block;
}
</style>
