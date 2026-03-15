/**
 * 元素接口 - 用于 UI 层
 */
import type { ElementTypeValue } from '../Types';

export interface IElement {
  id: string;
  type: ElementTypeValue;
  position: { x: number; y: number; z: number };
  width: number;
  height: number;
  depth: number;
  rotation: { x: number; y: number; z: number };
}
