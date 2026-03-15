/**
 * 存储接口 - 设计方案持久化
 * 纯 TypeScript，框架无关
 * 提供抽象接口，具体实现可对接 LocalStorage、IndexedDB、文件系统等
 */

import type { EditorElement, SerializedDesign, StoredDesignItem } from './Types';
import { Serializer } from './Serializer';

/** 存储接口 - 可在 Node.js 或浏览器环境实现 */
export interface IStorage {
  /** 保存设计 */
  save(
    elements: EditorElement[],
    selection: string[],
    options: SaveOptions
  ): Promise<string>;

  /** 加载设计 */
  load(id: string): Promise<SerializedDesign | null>;

  /** 列出所有设计 */
  list(): Promise<StoredDesignItem[]>;

  /** 删除设计 */
  delete(id: string): Promise<boolean>;

  /** 检查是否存在 */
  exists(id: string): Promise<boolean>;
}

export interface SaveOptions {
  id?: string;
  name?: string;
  thumbnail?: string;
}

/** 内存存储实现 - 用于测试或临时存储 */
export class MemoryStorage implements IStorage {
  private readonly store = new Map<string, string>();
  private readonly index: StoredDesignItem[] = [];

  async save(
    elements: EditorElement[],
    selection: string[],
    options: SaveOptions = {}
  ): Promise<string> {
    const id = options.id ?? `design_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const json = Serializer.serialize(elements, selection, {
      name: options.name ?? '未命名方案',
      thumbnail: options.thumbnail,
    });
    this.store.set(id, json);

    const design = Serializer.deserialize(json)!;
    const entry: StoredDesignItem = {
      key: id,
      name: design.metadata.name,
      createdAt: design.metadata.createdAt,
      updatedAt: design.metadata.updatedAt,
    };
    const idx = this.index.findIndex((e) => e.key === id);
    if (idx >= 0) {
      this.index[idx] = entry;
    } else {
      this.index.push(entry);
    }
    this.index.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    return id;
  }

  async load(id: string): Promise<SerializedDesign | null> {
    const json = this.store.get(id);
    return json ? Serializer.deserialize(json) : null;
  }

  async list(): Promise<StoredDesignItem[]> {
    return [...this.index];
  }

  async delete(id: string): Promise<boolean> {
    if (!this.store.has(id)) return false;
    this.store.delete(id);
    const idx = this.index.findIndex((e) => e.key === id);
    if (idx >= 0) this.index.splice(idx, 1);
    return true;
  }

  async exists(id: string): Promise<boolean> {
    return this.store.has(id);
  }
}
