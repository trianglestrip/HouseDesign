/**
 * housedesign-core - 房屋设计核心库
 * 导出所有 API
 */

// ============ 类型定义 ============
export * from './Types';

// ============ 编辑器引擎 ============
export {
  EditorEngine,
  EditorEvents,
  type EditorEventType,
} from './EditorEngine';

// ============ 几何内核 ============
export { GeometryKernel } from './GeometryKernel';

// ============ 拓扑结构 ============
export { Node, Edge, HalfEdge, Face, TopologyGraph } from './Topology';

// ============ 语义对象 ============
export { Wall, WallStyle, Opening, OpeningType, DoorType, WindowType, Room, RoomType } from './Semantic';

// ============ 几何数学 ============
export * as Vec2Math from './geometry/Vec2';
export type { Vec2 } from './geometry/Vec2';
export * as MiterJoin from './geometry/MiterJoin';
export * as WallMesh from './geometry/WallMesh';
export type { WallMeshData } from './geometry/WallMesh';
export * as TrimExtend from './geometry/TrimExtend';

// ============ Snap系统 ============
export { SnapSystem, SnapType, type SnapResult } from './Snap';

// ============ 约束系统 ============
export {
  Constraint,
  ConstraintType,
  HorizontalConstraint,
  VerticalConstraint,
  FixedLengthConstraint,
  ConstraintSolver,
} from './Constraint';

// ============ 撤销/重做 ============
export * from './UndoRedo';

// ============ 命令系统 ============
export * from './commands';

// ============ 序列化 ============
export * from './Serializer';

// ============ 存储 ============
export * from './Storage';

// ============ 事件总线 ============
export { EventBus } from './EventBus';

// ============ 渲染配置 ============
export {
  DEFAULT_RENDER_CONFIG,
  loadRenderConfig,
  saveRenderConfig,
  mmToPixels,
  pixelsToMm,
  type RenderConfig,
  type ScaleConfig,
  type WallRenderConfig,
  type EndpointRenderConfig,
  type SnapIndicatorConfig,
  type PreviewLineConfig,
  type GridConfig,
  type RulerConfig,
} from './RenderConfig';

// ============ 元素工厂 ============
export {
  createWall,
  createDoor,
  createWindow,
  createFurniture,
  createRoom,
  createElement,
  type CreateElementOptions,
} from './factories/elementFactory';

// ============ 2D 画布模块 ============
export { Grid2D, type Grid2DOptions } from './canvas2d/Grid2D';
export {
  DrawTools2D,
  type IDrawContext,
  type DrawTools2DOptions,
} from './canvas2d/DrawTools2D';
export { Renderer2D, type Renderer2DOptions } from './canvas2d/Renderer2D';
export {
  MouseHandler2D,
  type Point2D,
  type MouseHandler2DOptions,
  type MouseEventType,
  type MouseEvent2D,
  type MouseCallback,
} from './canvas2d/MouseHandler2D';
