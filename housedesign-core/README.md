# housedesign-core

房屋设计核心库 - 提供编辑器引擎、2D 渲染、序列化、存储等框架无关的核心能力。

## 安装

```bash
npm install housedesign-core
```

或从本地链接：

```bash
cd housedesign-core
npm install
npm run build
cd ..
npm link ./housedesign-core
```

## 基本使用

```typescript
import {
  EditorEngine,
  Renderer2D,
  MouseHandler2D,
  createWall,
  createFurniture,
  Serializer,
  EditorEvents,
} from 'housedesign-core';

// 创建编辑器引擎
const engine = new EditorEngine();

// 添加元素
const wall = createWall({ x: 0, y: 0, width: 200, height: 20 });
const furniture = createFurniture({ x: 50, y: 50, width: 100, height: 80 });
engine.addElement(wall);
engine.addElement(furniture);

// 监听事件
engine.events.on(EditorEvents.ELEMENT_ADDED, (element) => {
  console.log('元素已添加:', element);
});

// 2D 渲染
const renderer = new Renderer2D({ gridSize: 10, showGrid: true });
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
renderer.render(
  ctx,
  engine.getAllElements(),
  engine.getSelection(),
  canvas.width,
  canvas.height
);

// 鼠标交互
const mouseHandler = new MouseHandler2D({ offsetX: 0, offsetY: 0, scale: 1 });
mouseHandler.on('down', (e) => {
  console.log('点击位置:', e.x, e.y);
});

// 序列化/反序列化
const json = Serializer.serialize(engine.getAllElements(), engine.getSelection());
const design = Serializer.deserialize(json);
```

## API 文档

### EditorEngine

编辑器核心引擎，负责元素管理、选择、撤销重做。

| 方法 | 说明 |
|------|------|
| `addElement(element)` | 添加元素 |
| `deleteElement(id)` | 删除元素 |
| `getElement(id)` | 获取元素 |
| `getAllElements()` | 获取所有元素 |
| `updateElement(id, updates)` | 更新元素 |
| `moveElement(id, toPosition)` | 移动元素 |
| `select(id)` | 选中元素 |
| `deselect(id)` | 取消选中 |
| `clearSelection()` | 清空选择 |
| `getSelection()` | 获取选中 ID 列表 |
| `undo()` | 撤销 |
| `redo()` | 重做 |
| `events` | 事件总线 |
| `commands` | 撤销重做管理器 |

### 元素工厂函数

| 函数 | 说明 |
|------|------|
| `createWall(options?)` | 创建墙 |
| `createDoor(options?)` | 创建门 |
| `createWindow(options?)` | 创建窗 |
| `createFurniture(options?)` | 创建家具 |
| `createRoom(options?)` | 创建房间 |
| `createElement(type, options?)` | 根据类型创建元素 |

### Renderer2D

2D 渲染器，基于 Canvas 2D 上下文绘制元素和网格。

| 方法 | 说明 |
|------|------|
| `render(ctx, elements, selection, width, height)` | 渲染画布 |
| `clear(ctx, x, y, w, h)` | 清空区域 |
| `getGrid()` | 获取网格工具 |
| `getDrawTools()` | 获取绘制工具 |

### MouseHandler2D

2D 鼠标事件处理，负责坐标转换和事件分发。

| 方法 | 说明 |
|------|------|
| `screenToCanvas(clientX, clientY)` | 屏幕坐标转画布坐标 |
| `canvasToScreen(x, y)` | 画布坐标转屏幕坐标 |
| `on(type, callback)` | 订阅鼠标事件 |
| `dispatch(type, clientX, clientY, ...)` | 分发事件 |

### Serializer

JSON 序列化器。

| 方法 | 说明 |
|------|------|
| `Serializer.serialize(elements, selection?, metadata?)` | 序列化为 JSON 字符串 |
| `Serializer.deserialize(json)` | 从 JSON 反序列化 |

### Storage

存储接口及内存实现。

| 类/接口 | 说明 |
|---------|------|
| `IStorage` | 存储接口 |
| `MemoryStorage` | 内存存储实现 |

### 类型定义

- `EditorElement` - 编辑器元素
- `ElementType` - 元素类型枚举
- `ElementPosition` - 元素位置
- `SerializedDesign` - 序列化后的设计
- `DesignMetadata` - 设计元数据

## 构建

```bash
npm install
npm run build
```

输出到 `dist/` 目录：
- `housedesign-core.js` - ES 模块
- `housedesign-core.cjs` - CommonJS 模块
- `*.d.ts` - TypeScript 声明文件
