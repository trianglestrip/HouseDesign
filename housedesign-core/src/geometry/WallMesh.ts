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
  centerLine: [Vec2, Vec2];  // 中心线（节点到节点的连线，用于调试）
}

/**
 * 生成单个墙体的网格（带角落处理）
 * 
 * 核心思想：墙体严格围绕中心线对称绘制
 * 角落处的外侧和内侧使用相同的角平分线，确保中心线始终在墙体正中间
 * 
 * @param start 起点（中心线）
 * @param end 终点（中心线）
 * @param thickness 墙厚
 * @param prevDir 前一段墙体的方向（如果有）
 * @param nextDir 后一段墙体的方向（如果有）
 */
export function generateWallMesh(
  start: Vec2,
  end: Vec2,
  thickness: number,
  prevDir?: Vec2,
  nextDir?: Vec2
): WallMeshData {
  const offset = thickness / 2;
  
  // 当前墙体方向和法向量
  const dir = Vec2Math.normalize(Vec2Math.sub(end, start));
  const normal = Vec2Math.perpendicular(dir);  // 左侧法向量（逆时针90度）
  
  // 基础四个顶点（严格对称于中心线）
  let outerStart = Vec2Math.add(start, Vec2Math.scale(normal, offset));
  let outerEnd = Vec2Math.add(end, Vec2Math.scale(normal, offset));
  let innerStart = Vec2Math.sub(start, Vec2Math.scale(normal, offset));
  let innerEnd = Vec2Math.sub(end, Vec2Math.scale(normal, offset));
  
  // 处理起点角落 - 确保对称
  if (prevDir) {
    const prevNormal = Vec2Math.perpendicular(prevDir);
    
    // 计算角平分线方向（两个法向量的和）
    const bisectorDir = Vec2Math.add(prevNormal, normal);
    const bisectorLength = Vec2Math.length(bisectorDir);
    
    if (bisectorLength > 0.01) {
      const bisector = Vec2Math.normalize(bisectorDir);
      
      // 计算延伸系数：保证垂直距离为offset
      const dot = Vec2Math.dot(bisector, normal);
      if (Math.abs(dot) > 0.01) {
        const extendFactor = Math.min(1 / Math.abs(dot), 5);
        
        // 外侧和内侧使用相同的角平分线，只是方向相反
        outerStart = Vec2Math.add(start, Vec2Math.scale(bisector, offset * extendFactor));
        innerStart = Vec2Math.add(start, Vec2Math.scale(bisector, -offset * extendFactor));
      }
    }
  }
  
  // 处理终点角落 - 确保对称
  if (nextDir) {
    const nextNormal = Vec2Math.perpendicular(nextDir);
    
    // 计算角平分线方向
    const bisectorDir = Vec2Math.add(normal, nextNormal);
    const bisectorLength = Vec2Math.length(bisectorDir);
    
    if (bisectorLength > 0.01) {
      const bisector = Vec2Math.normalize(bisectorDir);
      
      // 计算延伸系数
      const dot = Vec2Math.dot(bisector, normal);
      if (Math.abs(dot) > 0.01) {
        const extendFactor = Math.min(1 / Math.abs(dot), 5);
        
        // 外侧和内侧使用相同的角平分线，只是方向相反
        outerEnd = Vec2Math.add(end, Vec2Math.scale(bisector, offset * extendFactor));
        innerEnd = Vec2Math.add(end, Vec2Math.scale(bisector, -offset * extendFactor));
      }
    }
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
    centerLine: [start, end], // 真实的节点连线，用于验证渲染是否居中
  };
}

