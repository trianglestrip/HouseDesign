/**
 * ?????? - ???????? */
import { Serializer } from '@housedesign/core';
import type { EditorElement, SerializedDesign, StoredDesignItem } from '@housedesign/core';

const STORAGE_PREFIX = 'housedesign_';
const DESIGN_PREFIX = `${STORAGE_PREFIX}design_`;
const INDEX_KEY = `${STORAGE_PREFIX}index`;

interface IndexEntry {
  key: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

function getDesignKey(id: string): string {
  return `${DESIGN_PREFIX}${id}`;
}

function generateId(): string {
  return `design_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function readIndex(): IndexEntry[] {
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeIndex(entries: IndexEntry[]): void {
  localStorage.setItem(INDEX_KEY, JSON.stringify(entries));
}

export class LocalStorageManager {
  static save(
    elements: EditorElement[],
    selection: string[] = [],
    options: { id?: string; name?: string; thumbnail?: string } = {}
  ): string {
    const id = options.id ?? generateId();
    const key = getDesignKey(id);
    const json = Serializer.serialize(elements, selection, {
      name: options.name ?? '?????',
      thumbnail: options.thumbnail,
    });
    localStorage.setItem(key, json);

    const design = Serializer.deserialize(json) as SerializedDesign;
    const entry: IndexEntry = {
      key: id,
      name: design.metadata.name,
      createdAt: design.metadata.createdAt,
      updatedAt: design.metadata.updatedAt,
    };
    const index = readIndex();
    const existingIdx = index.findIndex((e) => e.key === id);
    if (existingIdx >= 0) {
      index[existingIdx] = entry;
    } else {
      index.push(entry);
    }
    index.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    writeIndex(index);
    return id;
  }

  static load(id: string): SerializedDesign | null {
    const key = getDesignKey(id);
    const json = localStorage.getItem(key);
    if (!json) return null;
    return Serializer.deserialize(json);
  }

  static listAll(): StoredDesignItem[] {
    const index = readIndex();
    return index.map((e) => ({
      key: e.key,
      name: e.name,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    }));
  }

  static delete(id: string): boolean {
    const key = getDesignKey(id);
    if (!localStorage.getItem(key)) return false;
    localStorage.removeItem(key);
    const index = readIndex().filter((e) => e.key !== id);
    writeIndex(index);
    return true;
  }

  static exists(id: string): boolean {
    return localStorage.getItem(getDesignKey(id)) !== null;
  }
}
