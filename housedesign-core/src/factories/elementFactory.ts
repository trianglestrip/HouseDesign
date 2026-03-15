/**
 * 元素工厂函数 - 创建各类编辑器元素
 */

import type { EditorElement } from '../Types';
import { ElementType } from '../Types';

/** 创建元素的通用选项 */
export interface CreateElementOptions {
  id?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  properties?: Record<string, unknown>;
}

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/** 创建墙元素 */
export function createWall(options: CreateElementOptions = {}): EditorElement {
  return {
    id: options.id ?? generateId('wall'),
    type: ElementType.WALL,
    x: options.x ?? 0,
    y: options.y ?? 0,
    width: options.width ?? 200,
    height: options.height ?? 20,
    properties: options.properties ?? {},
  };
}

/** 创建门元素 */
export function createDoor(options: CreateElementOptions = {}): EditorElement {
  return {
    id: options.id ?? generateId('door'),
    type: ElementType.DOOR,
    x: options.x ?? 0,
    y: options.y ?? 0,
    width: options.width ?? 90,
    height: options.height ?? 20,
    properties: options.properties ?? {},
  };
}

/** 创建窗户元素 */
export function createWindow(options: CreateElementOptions = {}): EditorElement {
  return {
    id: options.id ?? generateId('window'),
    type: ElementType.WINDOW,
    x: options.x ?? 0,
    y: options.y ?? 0,
    width: options.width ?? 120,
    height: options.height ?? 20,
    properties: options.properties ?? {},
  };
}

/** 创建家具元素 */
export function createFurniture(options: CreateElementOptions = {}): EditorElement {
  return {
    id: options.id ?? generateId('furniture'),
    type: ElementType.FURNITURE,
    x: options.x ?? 0,
    y: options.y ?? 0,
    width: options.width ?? 100,
    height: options.height ?? 100,
    properties: options.properties ?? {},
  };
}

/** 创建房间元素 */
export function createRoom(options: CreateElementOptions = {}): EditorElement {
  return {
    id: options.id ?? generateId('room'),
    type: ElementType.ROOM,
    x: options.x ?? 0,
    y: options.y ?? 0,
    width: options.width ?? 300,
    height: options.height ?? 300,
    properties: options.properties ?? {},
  };
}

/** 根据类型创建元素 */
export function createElement(
  type: EditorElement['type'],
  options: CreateElementOptions = {}
): EditorElement {
  switch (type) {
    case ElementType.WALL:
      return createWall(options);
    case ElementType.DOOR:
      return createDoor(options);
    case ElementType.WINDOW:
      return createWindow(options);
    case ElementType.FURNITURE:
      return createFurniture(options);
    case ElementType.ROOM:
      return createRoom(options);
    default:
      return createFurniture(options);
  }
}
