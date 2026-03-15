/**
 * 序列化 - 设计方案与 JSON 互转
 * 纯 TypeScript，框架无关
 */

import type { EditorElement, DesignMetadata, SerializedDesign } from './Types';
import type { GeometryKernel } from './GeometryKernel';

export const DATA_FORMAT_VERSION = 1;

function createDefaultMetadata(name = '未命名方案'): DesignMetadata {
  const now = new Date().toISOString();
  return {
    name,
    createdAt: now,
    updatedAt: now,
  };
}

function normalizeElement(raw: unknown): EditorElement | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const id = typeof obj.id === 'string' ? obj.id : '';
  const type = typeof obj.type === 'string' ? obj.type : 'furniture';
  if (!id) return null;

  return {
    id,
    type: type as EditorElement['type'],
    x: typeof obj.x === 'number' ? obj.x : 0,
    y: typeof obj.y === 'number' ? obj.y : 0,
    width: typeof obj.width === 'number' ? obj.width : 100,
    height: typeof obj.height === 'number' ? obj.height : 100,
    properties:
      obj.properties && typeof obj.properties === 'object'
        ? (obj.properties as Record<string, unknown>)
        : {},
  };
}

function migrateFromVersion(
  data: unknown,
  version: number
): SerializedDesign | null {
  if (version === DATA_FORMAT_VERSION) {
    return data as SerializedDesign;
  }
  if (version < DATA_FORMAT_VERSION) {
    return data as SerializedDesign;
  }
  return null;
}

/**
 * JSON 序列化器
 */
export class Serializer {
  static readonly VERSION = DATA_FORMAT_VERSION;

  /** 序列化为 JSON 字符串 */
  static serialize(
    elements: EditorElement[],
    selection: string[] = [],
    metadata?: Partial<DesignMetadata>,
    geometryKernel?: GeometryKernel,
    viewport?: { zoom: number; pan: { x: number; y: number } }
  ): string {
    const design: SerializedDesign = {
      version: DATA_FORMAT_VERSION,
      metadata: {
        ...createDefaultMetadata(metadata?.name),
        ...metadata,
        updatedAt: new Date().toISOString(),
      },
      elements: elements.map((el) => ({ ...el })),
      selection: [...selection],
    };
    
    // 添加几何数据（如果提供）
    if (geometryKernel) {
      design.geometry = geometryKernel.toJSON();
    }
    
    // 添加视口数据（如果提供）
    if (viewport) {
      design.viewport = viewport;
    }
    
    return JSON.stringify(design, null, 2);
  }

  /** 从 JSON 反序列化 */
  static deserialize(json: string): SerializedDesign | null {
    try {
      const raw = JSON.parse(json) as unknown;
      if (!raw || typeof raw !== 'object') return null;

      const obj = raw as Record<string, unknown>;
      const version = typeof obj.version === 'number' ? obj.version : 0;

      const migrated = migrateFromVersion(raw, version);
      if (!migrated) return null;

      const elements = Array.isArray(migrated.elements)
        ? migrated.elements
            .map((e) => normalizeElement(e))
            .filter((e): e is EditorElement => e !== null)
        : [];

      const selection = Array.isArray(migrated.selection)
        ? migrated.selection.filter((id) => typeof id === 'string')
        : [];

      const metadata =
        migrated.metadata && typeof migrated.metadata === 'object'
          ? {
              name:
                typeof migrated.metadata.name === 'string'
                  ? migrated.metadata.name
                  : '未命名方案',
              createdAt:
                typeof migrated.metadata.createdAt === 'string'
                  ? migrated.metadata.createdAt
                  : new Date().toISOString(),
              updatedAt:
                typeof migrated.metadata.updatedAt === 'string'
                  ? migrated.metadata.updatedAt
                  : new Date().toISOString(),
              thumbnail: migrated.metadata.thumbnail,
            }
          : createDefaultMetadata();

      return {
        version: DATA_FORMAT_VERSION,
        metadata,
        elements,
        selection,
      };
    } catch {
      return null;
    }
  }
}
