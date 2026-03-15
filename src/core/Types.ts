/**
 * 核心类型定义 - 纯 TypeScript，框架无关
 */

/** 3D 坐标点 */
export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

/** 2D 坐标点 */
export interface Vector2 {
  x: number;
  y: number;
}

/** 3D 旋转 (欧拉角，单位：度) */
export interface Rotation3 {
  x: number;
  y: number;
  z: number;
}

/** 尺寸 (宽、高、深) */
export interface Dimensions {
  width: number;
  height: number;
  depth: number;
}

/** 2D 尺寸 */
export interface Dimensions2D {
  width: number;
  height: number;
}

/** 元素 ID */
export type ElementId = string;

/** 元素类型枚举 */
export const ElementType = {
  WALL: 'wall',
  DOOR: 'door',
  WINDOW: 'window',
  FURNITURE: 'furniture',
  ROOM: 'room',
} as const;

export type ElementTypeValue = (typeof ElementType)[keyof typeof ElementType];

/** 元素位置 (2D 平面) */
export interface ElementPosition {
  x: number;
  y: number;
}

/** 编辑器元素 - 2D/3D 统一数据模型 */
export interface EditorElement {
  id: ElementId;
  type: ElementTypeValue;
  x: number;
  y: number;
  width: number;
  height: number;
  depth?: number;
  rotation?: Rotation3;
  properties: Record<string, unknown>;
}

/** 设计元数据 */
export interface DesignMetadata {
  name: string;
  createdAt: string;
  updatedAt: string;
  thumbnail?: string;
}

/** 序列化后的设计方案 */
export interface SerializedDesign {
  version: number;
  metadata: DesignMetadata;
  elements: EditorElement[];
  selection: string[];
}

/** 存储项信息 */
export interface StoredDesignItem {
  key: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}
