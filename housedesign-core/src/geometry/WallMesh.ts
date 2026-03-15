/**
 * 墙体网格生成 - 处理角落尖角
 * 
 * 核心思想：
 * 1. 每个墙体只负责自己的部分
 * 2. 角落处按角度分配给相邻的两个墙
 * 3. 拖动端点时，所有相关墙体一起移动，保持厚度不变
 */

import type { Vec2 } from './Vec2';
import * as Vec2Math from './Vec2';

export interface WallMeshData {
  outerLine: [Vec2, Vec2];  // 外侧线
  innerLine: [Vec2, Vec2];  // 内侧线
  startCap?: Vec2[];         // 起点封口（如果是端点）
  endCap?: Vec2[];           // 终点封口（如果是端点）
  polygon: Vec2[];           // 完整多边形（用于填充）
}

/**
 * 生成单个墙体的网格（带角落处理）
 * 
 * 核心思想：在角落处，沿着角平分线方向延伸墙体边缘
 * 
 * @param start 起点
 * @param end 终点
 * @param thickness 墙厚
 * @param prevDir 前一段墙体的方向（如果有）
 * @param nextDir 后一段墙体的方向（如果有）
 */
export function generateWallMesh(
  start: Vec2,
  end: Vec2,
  thickness: number,
  prevDir?: Vec2,  // 前一段墙体的方向向量
  nextDir?: Vec2   // 后一段墙体的方向向量
): WallMeshData {
  const offset = thickness / 2;
  
  // 当前墙体方向和法向量
  const dir = Vec2Math.normalize(Vec2Math.sub(end, start));
  const normal = Vec2Math.perpendicular(dir);  // 左侧法向量（逆时针90度）
  
  // 基础四个顶点
  let outerStart = Vec2Math.add(start, Vec2Math.scale(normal, offset));
  let outerEnd = Vec2Math.add(end, Vec2Math.scale(normal, offset));
  let innerStart = Vec2Math.sub(start, Vec2Math.scale(normal, offset));
  let innerEnd = Vec2Math.sub(end, Vec2Math.scale(normal, offset));
  
  // 处理起点角落
  if (prevDir) {
    const prevNormal = Vec2Math.perpendicular(prevDir);
    
    // 计算角平分线方向（两个法向量的平均）
    const bisector = Vec2Math.normalize(Vec2Math.add(prevNormal, normal));
    
    // 计算延伸系数（保证墙厚不变）
    const dot = Vec2Math.dot(bisector, normal);
    const extendFactor = dot !== 0 ? 1 / dot : 1;
    
    // 沿角平分线延伸
    outerStart = Vec2Math.add(start, Vec2Math.scale(bisector, offset * extendFactor));
    
    // 内侧点同样处理
    const innerBisector = Vec2Math.scale(bisector, -1);
    innerStart = Vec2Math.add(start, Vec2Math.scale(innerBisector, offset * extendFactor));
  }
  
  // 处理终点角落
  if (nextDir) {
    const nextNormal = Vec2Math.perpendicular(nextDir);
    
    // 计算角平分线方向
    const bisector = Vec2Math.normalize(Vec2Math.add(normal, nextNormal));
    
    // 计算延伸系数
    const dot = Vec2Math.dot(bisector, normal);
    const extendFactor = dot !== 0 ? 1 / dot : 1;
    
    // 沿角平分线延伸
    outerEnd = Vec2Math.add(end, Vec2Math.scale(bisector, offset * extendFactor));
    
    // 内侧点同样处理
    const innerBisector = Vec2Math.scale(bisector, -1);
    innerEnd = Vec2Math.add(end, Vec2Math.scale(innerBisector, offset * extendFactor));
  }
  
  // 构建多边形（逆时针）
  const polygon: Vec2[] = [
    outerStart,
    outerEnd,
    innerEnd,
    innerStart,
  ];
  
  return {
    outerLine: [outerStart, outerEnd],
    innerLine: [innerStart, innerEnd],
    polygon,
  };
}

