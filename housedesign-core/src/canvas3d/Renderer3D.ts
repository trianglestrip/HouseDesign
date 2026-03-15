/**
 * 3D 渲染器 - 预留
 * 纯 TypeScript，框架无关
 * 后续可对接 Three.js、Babylon.js 等
 */

import type { EditorElement } from '../Types';

export interface IRenderer3D {
  /** 渲染一帧 */
  render(): void;
  /** 设置元素列表 */
  setElements(elements: EditorElement[]): void;
  /** 设置选中元素 */
  setSelection(ids: string[]): void;
  /** 销毁 */
  dispose(): void;
}

/**
 * 3D 渲染器占位实现
 */
export class Renderer3D implements IRenderer3D {
  private elements: EditorElement[] = [];
  private selection: string[] = [];

  render(): void {
    // 预留：对接 Three.js 等
  }

  setElements(elements: EditorElement[]): void {
    this.elements = [...elements];
  }

  setSelection(ids: string[]): void {
    this.selection = [...ids];
  }

  getElements(): EditorElement[] {
    return this.elements;
  }

  getSelection(): string[] {
    return this.selection;
  }

  dispose(): void {
    this.elements = [];
    this.selection = [];
  }
}
