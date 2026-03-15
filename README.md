# 房间设计器 - HouseDesign

类似酷家乐的 2D 房间设计 Web 应用，采用 CAD 级别的几何内核。

## 🎯 核心特性

- ✅ **CAD 级别几何内核** - Half-Edge Mesh 拓扑结构
- ✅ **精确墙体渲染** - centerline + thickness 模型，尖角处理
- ✅ **智能吸附系统** - 端点、中点、网格多类型吸附
- ✅ **可配置渲染** - JSON 配置所有视觉参数
- ✅ **刻度尺和网格** - 专业 CAD 风格界面
- ✅ **滚轮缩放平移** - 流畅的画布操作体验

## 📦 项目结构

```
HouseDesign/
├── housedesign-core/              # 核心库（独立 npm 包）
│   ├── src/
│   │   ├── GeometryKernel.ts      # 几何内核（拓扑图、墙体、房间）
│   │   ├── Topology.ts            # Half-Edge Mesh 拓扑结构
│   │   ├── Semantic.ts            # 语义对象（Wall/Opening/Room）
│   │   ├── Snap.ts                # 吸附系统
│   │   ├── Constraint.ts          # 约束系统
│   │   ├── RenderConfig.ts        # 渲染配置
│   │   ├── geometry/              # 几何算法
│   │   │   ├── Vec2.ts            # 2D向量数学
│   │   │   ├── WallMesh.ts        # 墙体网格生成
│   │   │   └── MiterJoin.ts       # 墙体交点处理
│   │   └── canvas2d/              # 2D 渲染模块
│   └── dist/                      # 构建输出
│
└── housedesign-ui/                # UI 项目（Vue 3）
    ├── src/
    │   └── ui/
    │       ├── components/        # Vue 组件
    │       │   ├── TopBar.vue     # 顶部工具栏
    │       │   ├── ToolPanel.vue  # 左侧工具面板
    │       │   ├── CanvasView.vue # 画布（集成 Fabric.js）
    │       │   └── PropertyPanel.vue # 右侧属性面板
    │       └── stores/            # Pinia 状态管理
    ├── public/
    │   ├── render-config.json     # 渲染配置文件
    │   └── assets/svg/            # SVG 资源
    └── dist/                      # 构建输出
```

## 🚀 快速开始

### 开发环境要求

- Node.js >= 20.19.0
- npm >= 10.0.0

### 安装依赖

```bash
# 在项目根目录
npm install

# 或分别安装
cd housedesign-core && npm install
cd housedesign-ui && npm install
```

### 开发模式

**核心开发者（开发 housedesign-core）：**

```bash
cd housedesign-core
npm run dev          # 监听模式构建
```

**UI开发者（开发 housedesign-ui）：**

```bash
cd housedesign-ui
npm run dev          # 启动开发服务器
```

访问 http://localhost:5173/ （端口可能不同）

### 生产构建

```bash
# 构建核心包
cd housedesign-core
npm run build

# 构建UI
cd housedesign-ui
npm run build
```

## ✨ 核心功能

### 几何内核

- ✅ **Half-Edge Mesh 拓扑结构** - Node/Edge/HalfEdge/Face
- ✅ **语义墙体模型** - centerline + thickness，支持开口（门窗）
- ✅ **房间自动识别** - 基于平面图 Face 检测算法
- ✅ **墙体尖角处理** - 角平分线算法，每个墙体只负责自己的部分
- ✅ **智能吸附系统** - 端点、中点、网格吸附
- ✅ **约束系统** - 水平、垂直、固定长度约束

### 交互功能

- ✅ **连续墙体绘制** - 左键连续点击，右键结束
- ✅ **端点拖动编辑** - 拖动中心线节点，墙厚保持不变
- ✅ **滚轮缩放** - 以鼠标位置为中心缩放（0.1x - 20x）
- ✅ **画布平移** - 中键拖动或 Shift+左键拖动
- ✅ **实时预览** - 绘制时显示虚线预览和吸附指示器

### 界面功能

- ✅ **刻度尺** - 左侧和顶部显示真实尺寸（毫米）
- ✅ **增强网格** - 普通网格 + 主网格（每5格）
- ✅ **工具面板** - 墙体、门、窗、家具 SVG 图标
- ✅ **可配置渲染** - JSON 配置所有颜色、线宽、透明度
- ✅ **单位转换** - 自动在毫米和像素之间转换

## 🏗️ 架构设计

### 分层架构

```
┌─────────────────────────────────────┐
│         UI Layer (Vue 3)            │
│  CanvasView / ToolPanel / TopBar    │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Geometry Kernel (Core)         │
│  Topology / Semantic / Snap         │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│    Geometry Algorithms               │
│  Vec2 / WallMesh / MiterJoin        │
└─────────────────────────────────────┘
```

### 核心设计原则

1. **UI 和核心完全分离** - 两个独立 npm 包
2. **单位统一** - 内部统一使用毫米，渲染时转换为像素
3. **拓扑优先** - 使用 Half-Edge Mesh 管理几何关系
4. **语义建模** - Wall/Opening/Room 高级对象
5. **配置驱动** - 所有视觉参数通过 JSON 配置

## 🎨 界面特性

### 画布
- **刻度尺** - 左侧和顶部显示真实尺寸（毫米）
- **双层网格** - 普通网格线 + 主网格线（每5格）
- **滚轮缩放** - 0.1x - 20x，以鼠标为中心
- **中键平移** - 或 Shift+左键拖动

### 墙体绘制
- **连续绘制** - 左键连续点击添加节点
- **实时预览** - 虚线跟随鼠标
- **智能吸附** - 自动吸附到端点和网格
- **右键结束** - 或双击结束绘制

### 墙体编辑
- **端点控制** - 蓝色圆点显示在中心线
- **拖动编辑** - 墙厚保持不变
- **尖角处理** - 角落自动形成精确尖角
- **悬停高亮** - 鼠标悬停时端点高亮

## 📚 核心 API 使用示例

```typescript
import { GeometryKernel, type Vec2 } from '@housedesign/core'

// 创建几何内核
const kernel = new GeometryKernel()

// 创建墙体
const result = kernel.createWall(
  { x: 0, y: 0 },      // 起点（毫米）
  { x: 4000, y: 0 },   // 终点（毫米）
  200                   // 墙厚（毫米）
)

// 连续绘制墙体
let nodeId = result.nodeA.id
nodeId = kernel.addWallPoint({ x: 4000, y: 3000 }, nodeId, 200).node.id
nodeId = kernel.addWallPoint({ x: 0, y: 3000 }, nodeId, 200).node.id

// 检测房间
const rooms = kernel.detectRooms()
console.log('检测到房间:', rooms)

// 生成墙体渲染多边形
const polygons = kernel.generateWallPolygons()

// 移动节点
kernel.moveNode(nodeId, { x: 0, y: 3500 })
```

## 🔧 技术栈

### 核心库（housedesign-core）

- **TypeScript 5.3+** - 类型安全
- **Half-Edge Mesh** - 拓扑数据结构
- **几何算法** - Vec2 数学、Miter Join、角平分线
- **Vite 8.0+** - 构建工具

### UI 项目（housedesign-ui）

- **Vue 3.4+** - 渐进式框架
- **TypeScript 5.3+** - 类型安全
- **Fabric.js 6.0+** - Canvas 渲染引擎
- **Element Plus 2.5+** - UI 组件库
- **Pinia 2.1+** - 状态管理
- **Vite 8.0+** - 构建工具

## ⚙️ 配置系统

所有视觉参数都可以通过 `housedesign-ui/public/render-config.json` 配置：

```json
{
  "scale": {
    "pixelsPerMeter": 5,
    "minZoom": 0.1,
    "maxZoom": 20
  },
  "wall": {
    "strokeWidth": 1,
    "defaultThickness": 200
  },
  "grid": {
    "size": 20,
    "majorInterval": 5
  },
  "ruler": {
    "width": 30,
    "fontSize": 10
  }
}
```

### 可配置项

- **缩放比例** - `pixelsPerMeter`（1米对应多少像素）
- **墙体样式** - 颜色、线宽、透明度、默认厚度
- **网格样式** - 大小、颜色、主网格间隔
- **刻度尺** - 宽度、字体、颜色
- **端点样式** - 半径、颜色、透明度
- **吸附参数** - 距离、类型

## 🎮 操作指南

### 绘制墙体
1. 点击"墙体"工具
2. 左键点击添加节点
3. 鼠标移动，预览线跟随
4. 右键或双击结束绘制

### 编辑墙体
1. 拖动蓝色端点（在中心线上）
2. 墙体厚度保持不变
3. 角落自动形成尖角

### 视图控制
- **缩放**：鼠标滚轮
- **平移**：中键拖动 或 Shift+左键
- **重置**：刷新页面

## 🚧 待开发功能

- ⏳ 门窗放置和编辑
- ⏳ 房间填充和标注
- ⏳ 尺寸标注工具
- ⏳ 导出为 PNG/PDF
- ⏳ 3D 视图
- ⏳ 撤销/重做完善

## 📄 许可证

MIT

## 👨‍💻 作者

HouseDesign Team
