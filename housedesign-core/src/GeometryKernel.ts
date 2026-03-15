/**
 * 几何内核 - CAD级别的拓扑图系统
 * 
 * 核心功能：
 * - 拓扑图管理（Node/Edge/HalfEdge/Face）
 * - 墙体语义对象
 * - 房间自动识别
 * - Snap吸附系统
 * - Miter Join处理
 */

import { TopologyGraph, type Node, type Edge } from './Topology';
import { Wall, Opening, OpeningType, Room } from './Semantic';
import { SnapSystem, SnapType, type SnapResult } from './Snap';
import { UndoRedoManager } from './UndoRedo';
import { AuxiliaryLineManager } from './AuxiliaryLines';
import type { Vec2 } from './geometry/Vec2';
import * as Vec2Math from './geometry/Vec2';
import { generateWallMesh } from './geometry/WallMesh';
import * as TrimExtend from './geometry/TrimExtend';
import * as Offset from './geometry/Offset';

export class GeometryKernel {
  private topology: TopologyGraph;
  private walls: Map<string, Wall> = new Map();
  private openings: Map<string, Opening> = new Map();
  private rooms: Map<string, Room> = new Map();
  private snapSystem: SnapSystem;
  private undoRedoManager: UndoRedoManager;
  private auxiliaryLineManager: AuxiliaryLineManager;
  private autoTrimExtend: boolean = false; // 自动修剪/延伸开关

  private nextWallId = 0;
  private nextOpeningId = 0;
  private nextRoomId = 0;

  constructor() {
    this.topology = new TopologyGraph();
    this.snapSystem = new SnapSystem(15, 100);
    this.undoRedoManager = new UndoRedoManager({ maxHistorySize: 100 });
    this.auxiliaryLineManager = new AuxiliaryLineManager();
  }

  /**
   * 获取辅助线管理器
   */
  getAuxiliaryLineManager(): AuxiliaryLineManager {
    return this.auxiliaryLineManager;
  }

  /**
   * 获取撤销/重做管理器
   */
  getUndoRedoManager(): UndoRedoManager {
    return this.undoRedoManager;
  }

  /**
   * 撤销上一个操作
   */
  undo(): boolean {
    return this.undoRedoManager.undo();
  }

  /**
   * 重做上一个撤销的操作
   */
  redo(): boolean {
    return this.undoRedoManager.redo();
  }

  /**
   * 是否可以撤销
   */
  canUndo(): boolean {
    return this.undoRedoManager.canUndo;
  }

  /**
   * 是否可以重做
   */
  canRedo(): boolean {
    return this.undoRedoManager.canRedo;
  }

  /**
   * 设置自动修剪/延伸开关
   */
  setAutoTrimExtend(enabled: boolean): void {
    this.autoTrimExtend = enabled;
  }

  /**
   * 获取自动修剪/延伸状态
   */
  getAutoTrimExtend(): boolean {
    return this.autoTrimExtend;
  }

  /**
   * 手动触发墙体修剪/延伸检测
   */
  processTrimExtend(): number {
    return TrimExtend.autoTrimExtendWalls(this.walls, this.topology);
  }

  /**
   * 偏移复制墙体
   */
  offsetWall(
    wallId: string,
    distance: number,
    side: 'left' | 'right'
  ): { wall: Wall; nodeA: Node; nodeB: Node; edge: Edge } | null {
    const wall = this.walls.get(wallId);
    if (!wall) return null;

    const result = Offset.offsetWall(wall, distance, side, this.topology);
    if (!result) return null;

    // 创建新墙体
    return this.createWall(result.start, result.end, wall.thickness);
  }

  /**
   * 预览偏移效果
   */
  previewOffsetWall(
    wallId: string,
    distance: number,
    side: 'left' | 'right'
  ): { start: Vec2; end: Vec2 } | null {
    const wall = this.walls.get(wallId);
    if (!wall) return null;

    return Offset.previewOffset(wall, distance, side, this.topology);
  }

  /**
   * 创建墙体（基于两个点）
   */
  createWall(start: Vec2, end: Vec2, thickness: number = 200): {
    wall: Wall;
    nodeA: Node;
    nodeB: Node;
    edge: Edge;
  } {
    // 创建节点
    const nodeA = this.topology.createNode(start);
    const nodeB = this.topology.createNode(end);

    // 创建边
    const edge = this.topology.createEdge(nodeA.id, nodeB.id);

    // 创建墙体
    const wallId = `wall_${this.nextWallId++}`;
    const wall = new Wall(wallId, edge.id, thickness);
    edge.wallId = wallId;
    this.walls.set(wallId, wall);

    // 重建拓扑结构
    this.topology.rebuildHalfEdges();

    return { wall, nodeA, nodeB, edge };
  }

  /**
   * 添加墙体点（连续绘制）
   */
  addWallPoint(position: Vec2, prevNodeId?: string, thickness: number = 200): {
    node: Node;
    edge?: Edge;
    wall?: Wall;
  } {
    // 查找吸附点
    const snap = this.findSnap(position, prevNodeId);
    const finalPos = snap ? snap.position : position;

    // 如果吸附到已有节点，直接使用
    let node: Node;
    if (snap && snap.type === 'endpoint' && snap.targetId) {
      const existingNode = this.topology.getNode(snap.targetId);
      if (existingNode) {
        node = existingNode;
      } else {
        node = this.topology.createNode(finalPos);
      }
    } else {
      node = this.topology.createNode(finalPos);
    }

    // 如果有前一个节点，创建边和墙体
    if (prevNodeId) {
      const edge = this.topology.createEdge(prevNodeId, node.id);

      const wallId = `wall_${this.nextWallId++}`;
      const wall = new Wall(wallId, edge.id, thickness);
      edge.wallId = wallId;
      this.walls.set(wallId, wall);

      this.topology.rebuildHalfEdges();
      
      // 自动修剪/延伸（如果开启）
      if (this.autoTrimExtend) {
        this.processTrimExtend();
      }

      return { node, edge, wall };
    }

    return { node };
  }

  /**
   * 查找吸附点
   */
  findSnap(position: Vec2, excludeNodeId?: string): SnapResult | null {
    const nodes = this.topology.getNodes();
    const edges = this.topology.getEdges();
    const nodePositions = new Map<string, Vec2>();

    nodes.forEach((node) => {
      nodePositions.set(node.id, node.position);
    });

    // 先检查辅助线吸附（优先级高于网格）
    const auxSnap = this.auxiliaryLineManager.snapToLine(position, 20);
    if (auxSnap) {
      // 辅助线吸附成功，但仍然检查端点吸附（端点优先级最高）
      const endpointSnap = this.snapSystem.findBestSnap(auxSnap, nodes, edges, nodePositions, excludeNodeId);
      if (endpointSnap) {
        return endpointSnap;
      }
      // 返回辅助线吸附结果（使用Grid类型，优先级介于端点和网格之间）
      return {
        position: auxSnap,
        type: SnapType.Grid,
        priority: 50, // 介于端点(100)和网格(10)之间
      };
    }

    return this.snapSystem.findBestSnap(position, nodes, edges, nodePositions, excludeNodeId);
  }

  /**
   * 获取墙体
   */
  getWall(wallId: string): Wall | undefined {
    return this.walls.get(wallId);
  }

  /**
   * 获取所有墙体
   */
  getWalls(): Wall[] {
    return Array.from(this.walls.values());
  }

  /**
   * 删除墙体
   */
  deleteWall(wallId: string): void {
    const wall = this.walls.get(wallId);
    if (!wall) return;

    // 删除边
    this.topology.deleteEdge(wall.edgeId);

    // 删除墙体
    this.walls.delete(wallId);

    // 重建拓扑结构
    this.topology.rebuildHalfEdges();

    // 重新检测房间
    this.detectRooms();
  }

  /**
   * 更新墙体厚度
   */
  updateWallThickness(wallId: string, thickness: number): void {
    const wall = this.walls.get(wallId);
    if (!wall) return;

    wall.thickness = thickness;
  }

  /**
   * 移动节点
   */
  moveNode(nodeId: string, newPosition: Vec2): void {
    const node = this.topology.getNode(nodeId);
    if (!node) return;

    node.position = newPosition;

    // 触发约束求解（如果有）
    // TODO: 实现约束系统
    
    // 自动修剪/延伸（如果开启）
    if (this.autoTrimExtend) {
      this.processTrimExtend();
    }

    // 重新检测房间
    this.detectRooms();
  }

  /**
   * 检测所有房间
   */
  detectRooms(): Room[] {
    this.rooms.clear();

    const faces = this.topology.detectFaces();

    faces.forEach((face) => {
      const polygon = this.topology.getFacePolygon(face);
      if (polygon.length < 3) return;

      const roomId = `room_${this.nextRoomId++}`;
      const room = new Room(roomId, face.id, polygon);
      room.calculateArea();
      room.calculateCentroid();
      room.inferType();

      this.rooms.set(roomId, room);
    });

    return Array.from(this.rooms.values());
  }

  /**
   * 添加开口（门或窗）
   */
  addOpening(
    wallId: string,
    type: OpeningType,
    t: number,
    width: number,
    height: number
  ): Opening | null {
    const wall = this.walls.get(wallId);
    if (!wall) return null;

    const openingId = `opening_${this.nextOpeningId++}`;
    const opening = new Opening(openingId, type, wallId, t, width, height);

    this.openings.set(openingId, opening);
    wall.addOpening(openingId);

    return opening;
  }

  /**
   * 生成墙体渲染多边形（带尖角处理）
   * 每个墙体只负责自己的部分，角落按角度分配
   */
  generateWallPolygons(): Map<
    string,
    {
      polygon: Vec2[];
      centerLine: [Vec2, Vec2];
    }
  > {
    const result = new Map();

    // 1. 构建节点连接信息
    const nodeConnections = new Map<string, Array<{ edgeId: string; otherEnd: Vec2; isOutgoing: boolean }>>();
    
    this.topology.getEdges().forEach((edge) => {
      const nodeA = this.topology.getNode(edge.nodeA);
      const nodeB = this.topology.getNode(edge.nodeB);
      if (!nodeA || !nodeB) return;
      
      const startKey = `${nodeA.position.x},${nodeA.position.y}`;
      const endKey = `${nodeB.position.x},${nodeB.position.y}`;
      
      if (!nodeConnections.has(startKey)) {
        nodeConnections.set(startKey, []);
      }
      if (!nodeConnections.has(endKey)) {
        nodeConnections.set(endKey, []);
      }
      
      nodeConnections.get(startKey)!.push({
        edgeId: edge.id,
        otherEnd: nodeB.position,
        isOutgoing: true,
      });
      
      nodeConnections.get(endKey)!.push({
        edgeId: edge.id,
        otherEnd: nodeA.position,
        isOutgoing: false,
      });
    });

    // 2. 为每个墙体生成网格
    this.walls.forEach((wall) => {
      const edge = this.topology.getEdge(wall.edgeId);
      if (!edge) return;

      const nodeA = this.topology.getNode(edge.nodeA);
      const nodeB = this.topology.getNode(edge.nodeB);
      if (!nodeA || !nodeB) return;

      const start = nodeA.position;
      const end = nodeB.position;
      
      // 获取起点和终点的连接信息
      const startKey = `${start.x},${start.y}`;
      const endKey = `${end.x},${end.y}`;
      const startConns = nodeConnections.get(startKey);
      const endConns = nodeConnections.get(endKey);
      
      // 查找相邻墙体的方向
      let prevDir: Vec2 | undefined;
      let nextDir: Vec2 | undefined;
      
      if (startConns && startConns.length > 1) {
        // 找到另一条连接边
        const otherConn = startConns.find(conn => conn.edgeId !== edge.id);
        if (otherConn) {
          // 计算方向（从当前节点指向另一个节点）
          prevDir = Vec2Math.normalize(Vec2Math.sub(otherConn.otherEnd, start));
          // 如果是入边，反转方向
          if (!otherConn.isOutgoing) {
            prevDir = Vec2Math.scale(prevDir, -1);
          }
        }
      }
      
      if (endConns && endConns.length > 1) {
        const otherConn = endConns.find(conn => conn.edgeId !== edge.id);
        if (otherConn) {
          nextDir = Vec2Math.normalize(Vec2Math.sub(otherConn.otherEnd, end));
          if (!otherConn.isOutgoing) {
            nextDir = Vec2Math.scale(nextDir, -1);
          }
        }
      }
      
      // 生成墙体网格
      const mesh = generateWallMesh(start, end, wall.thickness, prevDir, nextDir);
      
      result.set(wall.id, {
        polygon: mesh.polygon,
        centerLine: [start, end],
      });
    });

    return result;
  }

  /**
   * 获取所有房间
   */
  getRooms(): Room[] {
    return Array.from(this.rooms.values());
  }

  /**
   * 获取所有开口
   */
  getOpenings(): Opening[] {
    return Array.from(this.openings.values());
  }

  /**
   * 获取拓扑图
   */
  getTopology(): TopologyGraph {
    return this.topology;
  }

  /**
   * 清空所有数据
   */
  clear(): void {
    this.topology.clear();
    this.walls.clear();
    this.openings.clear();
    this.rooms.clear();
    this.nextWallId = 0;
    this.nextOpeningId = 0;
    this.nextRoomId = 0;
  }

  /**
   * 序列化
   */
  toJSON(): object {
    return {
      topology: this.topology.toJSON(),
      walls: Array.from(this.walls.values()).map((w) => w.toJSON()),
      openings: Array.from(this.openings.values()).map((o) => o.toJSON()),
      rooms: Array.from(this.rooms.values()).map((r) => r.toJSON()),
      nextWallId: this.nextWallId,
      nextOpeningId: this.nextOpeningId,
      nextRoomId: this.nextRoomId,
    };
  }

  /**
   * 反序列化
   */
  static fromJSON(data: any): GeometryKernel {
    const kernel = new GeometryKernel();

    if (data.topology) {
      kernel.topology = TopologyGraph.fromJSON(data.topology);
    }

    if (data.walls) {
      data.walls.forEach((w: any) => {
        const wall = Wall.fromJSON(w);
        kernel.walls.set(wall.id, wall);
      });
    }

    if (data.openings) {
      data.openings.forEach((o: any) => {
        const opening = Opening.fromJSON(o);
        kernel.openings.set(opening.id, opening);
      });
    }

    if (data.rooms) {
      data.rooms.forEach((r: any) => {
        const room = Room.fromJSON(r);
        kernel.rooms.set(room.id, room);
      });
    }

    kernel.nextWallId = data.nextWallId || 0;
    kernel.nextOpeningId = data.nextOpeningId || 0;
    kernel.nextRoomId = data.nextRoomId || 0;

    return kernel;
  }
}
