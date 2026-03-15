# HouseDesign - 工业级 CAD/BIM 编辑器

基于工业级架构设计的房屋设计 CAD/BIM 编辑器，采用 Monorepo 结构，严格分离领域模型、几何内核、编辑器系统和视图适配器。

## 项目结构

```
HouseDesign/
├── packages/
│   ├── housedesign-core/          # 核心库（纯 TypeScript，无 UI 依赖）
│   │   ├── src/
│   │   │   ├── core/              # 核心层
│   │   │   │   ├── model/         # 领域模型（Wall/Room/Opening）
│   │   │   │   ├── topology/      # 拓扑图（Node/Edge/HalfEdge/Face）
│   │   │   │   ├── geometry/      # 纯几何数学（Vec2/Line/Polygon）
│   │   │   │   └── kernel/        # 几何内核算法（WallMesh/MiterJoin）
│   │   │   ├── systems/           # 编辑器系统
│   │   │   │   ├── snap/          # 吸附系统
│   │   │   │   ├── constraint/    # 约束求解
│   │   │   │   ├── command/       # 命令模式
│   │   │   │   ├── history/       # 撤销重做
│   │   │   │   └── storage/       # 存储序列化
│   │   │   ├── editor/            # 编辑器协调层
│   │   │   ├── canvas2d/          # 2D 视图层
│   │   │   │   ├── adapters/      # 适配器（Wall2DAdapter）
│   │   │   │   ├── renderer/      # 渲染器（Renderer2D/WallRenderer）
│   │   │   │   └── tools/         # 2D 工具（DrawWallTool）
│   │   │   ├── canvas3d/          # 3D 视图层（占位）
│   │   │   └── config/            # 默认配置
│   │   └── dist/                  # 构建产物
│   └── housedesign-ui/            # UI 应用（Vue 3）
│       ├── src/
│       │   ├── components/        # UI 组件
│       │   ├── stores/            # Pinia 状态管理
│       │   └── config/            # 用户自定义配置
│       └── tests/                 # Playwright 测试
├── node_modules/                  # 统一依赖管理
└── package.json                   # 根配置（npm workspaces）
```

## 核心架构原则

### 1. 严格分层架构

- **领域模型层** (`core/model`): 纯数据结构，只包含业务实体的本质属性
- **拓扑层** (`core/topology`): 图结构管理（Node/Edge/HalfEdge/Face）
- **几何层** (`core/geometry`): 纯数学运算，无业务逻辑
- **几何内核层** (`core/kernel`): 业务相关的几何算法
- **编辑器系统层** (`systems/`): 吸附、命令、历史、存储等独立系统
- **编辑器协调层** (`editor/`): 整合各系统的高层协调
- **视图适配器层** (`canvas2d/adapters`): 适配器模式，将领域模型转换为渲染数据
- **渲染器层** (`canvas2d/renderer`): 负责具体的绘制操作

### 2. 适配器模式

墙体不再继承，而是通过适配器组合：

```typescript
// ❌ 错误：继承导致耦合
class Wall2D extends Wall { }

// ✅ 正确：适配器模式
class Wall2DAdapter {
  constructor(
    private wall: Wall,
    private topology: TopologyGraph
  ) {}
  
  getRenderData(): Wall2DRenderData {
    // 将领域模型转换为渲染数据
  }
}
```

### 3. 配置分层

- **Core 层**：定义默认渲染配置（墙体颜色、轮廓线颜色、网格颜色等）
- **UI 层**：用户可自定义配置，运行时合并
- **运行时合并**：`{ ...defaultConfig, ...customConfig }`

### 4. 参数化设计

- 墙体由 `centerEdgeId`（中心线）+ `thickness`（厚度）定义
- 支持三条线：中心线、轮廓线1、轮廓线2
- 使用 Miter Join 算法处理墙体交点

## 快速开始

### 安装依赖

```bash
npm install
```

### 构建 Core 库

```bash
npm run build:core
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173

### 运行测试

```bash
npm run test
```

## 核心功能

- ✅ 绘制墙体（参数化设计）
- ✅ 智能吸附（端点、中点、网格、水平、垂直）
- ✅ 尺寸输入（实时显示在中点位置）
- ✅ 撤销/重做（命令模式）
- ✅ 选择和移动
- ✅ 项目保存/加载
- ✅ 端点合并
- ✅ 十字准线（吸附时自动隐藏）

## 技术栈

### Core 库
- TypeScript 5.3+
- 纯数学和算法实现
- 无 UI 依赖

### UI 应用
- Vue 3
- Pinia（状态管理）
- Fabric.js（2D 渲染）
- Vite（构建工具）
- Playwright（自动化测试）

## 架构优势

1. **清晰的职责分离**：每个模块职责单一，易于理解和维护
2. **高可测试性**：核心逻辑与 UI 完全解耦，可独立测试
3. **强扩展性**：新增 3D 视图、新工具、新约束无需修改核心层
4. **高性能**：适配器模式支持缓存，避免重复计算
5. **易维护**：工业级代码组织，符合 CAD/BIM 行业标准

## 开发指南

### 添加新工具

1. 在 `packages/housedesign-core/src/canvas2d/tools/` 创建新工具类
2. 继承 `BaseTool` 并实现工具逻辑
3. 在 `EditorEngine` 中注册工具
4. 在 UI 的 `Toolbar.vue` 中添加按钮

### 添加新的领域模型

1. 在 `packages/housedesign-core/src/core/model/` 创建模型类
2. 在 `canvas2d/adapters/` 创建对应的适配器
3. 在 `canvas2d/renderer/` 创建对应的渲染器
4. 在 `EditorEngine` 中添加管理方法

### 自定义渲染样式

编辑 `packages/housedesign-ui/src/config/customRenderConfig.json`：

```json
{
  "wall": {
    "fillColor": "#F0F0F0",
    "centerLineColor": "#FF0000"
  },
  "grid": {
    "color": "#DDDDDD",
    "size": 50
  }
}
```

## 许可证

MIT
