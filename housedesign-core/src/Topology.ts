/**
 * 拓扑系统 - Node/Edge/HalfEdge/Face/TopologyGraph
 * 合并自：topology/Node.ts, Edge.ts, HalfEdge.ts, Face.ts, TopologyGraph.ts
 */

import type { Vec2 } from './geometry/Vec2';
import * as Vec2Math from './geometry/Vec2';

// ============ Node ============
export class Node {
  id: string;
  position: Vec2;
  edges: string[] = [];

  constructor(id: string, position: Vec2) {
    this.id = id;
    this.position = position;
  }

  addEdge(edgeId: string): void {
    if (!this.edges.includes(edgeId)) {
      this.edges.push(edgeId);
    }
  }

  removeEdge(edgeId: string): void {
    const index = this.edges.indexOf(edgeId);
    if (index !== -1) {
      this.edges.splice(index, 1);
    }
  }

  getDegree(): number {
    return this.edges.length;
  }

  clone(): Node {
    const node = new Node(this.id, { ...this.position });
    node.edges = [...this.edges];
    return node;
  }

  toJSON(): object {
    return {
      id: this.id,
      position: this.position,
      edges: this.edges,
    };
  }

  static fromJSON(data: any): Node {
    const node = new Node(data.id, data.position);
    node.edges = data.edges || [];
    return node;
  }
}

// ============ Edge ============
export class Edge {
  id: string;
  nodeA: string;
  nodeB: string;
  wallId?: string;

  constructor(id: string, nodeA: string, nodeB: string) {
    this.id = id;
    this.nodeA = nodeA;
    this.nodeB = nodeB;
  }

  hasNode(nodeId: string): boolean {
    return this.nodeA === nodeId || this.nodeB === nodeId;
  }

  getOtherNode(nodeId: string): string | null {
    if (this.nodeA === nodeId) return this.nodeB;
    if (this.nodeB === nodeId) return this.nodeA;
    return null;
  }

  reverse(): void {
    [this.nodeA, this.nodeB] = [this.nodeB, this.nodeA];
  }

  clone(): Edge {
    const edge = new Edge(this.id, this.nodeA, this.nodeB);
    edge.wallId = this.wallId;
    return edge;
  }

  toJSON(): object {
    return {
      id: this.id,
      nodeA: this.nodeA,
      nodeB: this.nodeB,
      wallId: this.wallId,
    };
  }

  static fromJSON(data: any): Edge {
    const edge = new Edge(data.id, data.nodeA, data.nodeB);
    edge.wallId = data.wallId;
    return edge;
  }
}

// ============ HalfEdge ============
export class HalfEdge {
  id: string;
  originNode: string;
  twin: string | null = null;
  next: string | null = null;
  prev: string | null = null;
  face: string | null = null;
  edgeId: string;

  constructor(id: string, originNode: string, edgeId: string) {
    this.id = id;
    this.originNode = originNode;
    this.edgeId = edgeId;
  }

  getTargetNode(halfEdges: Map<string, HalfEdge>): string | null {
    if (!this.twin) return null;
    const twinHE = halfEdges.get(this.twin);
    return twinHE ? twinHE.originNode : null;
  }

  clone(): HalfEdge {
    const he = new HalfEdge(this.id, this.originNode, this.edgeId);
    he.twin = this.twin;
    he.next = this.next;
    he.prev = this.prev;
    he.face = this.face;
    return he;
  }

  toJSON(): object {
    return {
      id: this.id,
      originNode: this.originNode,
      edgeId: this.edgeId,
      twin: this.twin,
      next: this.next,
      prev: this.prev,
      face: this.face,
    };
  }

  static fromJSON(data: any): HalfEdge {
    const he = new HalfEdge(data.id, data.originNode, data.edgeId);
    he.twin = data.twin;
    he.next = data.next;
    he.prev = data.prev;
    he.face = data.face;
    return he;
  }
}

// ============ Face ============
export class Face {
  id: string;
  halfEdges: string[] = [];
  isRoom: boolean = false;
  area: number = 0;
  centroid: Vec2 = { x: 0, y: 0 };
  name?: string;

  constructor(id: string) {
    this.id = id;
  }

  addHalfEdge(halfEdgeId: string): void {
    if (!this.halfEdges.includes(halfEdgeId)) {
      this.halfEdges.push(halfEdgeId);
    }
  }

  calculateArea(polygon: Vec2[]): number {
    if (polygon.length < 3) return 0;

    let area = 0;
    for (let i = 0; i < polygon.length; i++) {
      const j = (i + 1) % polygon.length;
      area += polygon[i].x * polygon[j].y;
      area -= polygon[j].x * polygon[i].y;
    }

    this.area = Math.abs(area / 2);
    return this.area;
  }

  calculateCentroid(polygon: Vec2[]): Vec2 {
    if (polygon.length === 0) return { x: 0, y: 0 };

    let cx = 0;
    let cy = 0;

    for (const p of polygon) {
      cx += p.x;
      cy += p.y;
    }

    this.centroid = {
      x: cx / polygon.length,
      y: cy / polygon.length,
    };

    return this.centroid;
  }

  static isCounterClockwise(polygon: Vec2[]): boolean {
    if (polygon.length < 3) return false;

    let sum = 0;
    for (let i = 0; i < polygon.length; i++) {
      const j = (i + 1) % polygon.length;
      sum += (polygon[j].x - polygon[i].x) * (polygon[j].y + polygon[i].y);
    }

    return sum < 0;
  }

  clone(): Face {
    const face = new Face(this.id);
    face.halfEdges = [...this.halfEdges];
    face.isRoom = this.isRoom;
    face.area = this.area;
    face.centroid = { ...this.centroid };
    face.name = this.name;
    return face;
  }

  toJSON(): object {
    return {
      id: this.id,
      halfEdges: this.halfEdges,
      isRoom: this.isRoom,
      area: this.area,
      centroid: this.centroid,
      name: this.name,
    };
  }

  static fromJSON(data: any): Face {
    const face = new Face(data.id);
    face.halfEdges = data.halfEdges || [];
    face.isRoom = data.isRoom || false;
    face.area = data.area || 0;
    face.centroid = data.centroid || { x: 0, y: 0 };
    face.name = data.name;
    return face;
  }
}

// ============ TopologyGraph ============
export class TopologyGraph {
  private nodes: Map<string, Node> = new Map();
  private edges: Map<string, Edge> = new Map();
  private halfEdges: Map<string, HalfEdge> = new Map();
  private faces: Map<string, Face> = new Map();

  private nextNodeId = 0;
  private nextEdgeId = 0;
  private nextHalfEdgeId = 0;
  private nextFaceId = 0;

  createNode(position: Vec2): Node {
    const id = `node_${this.nextNodeId++}`;
    const node = new Node(id, position);
    this.nodes.set(id, node);
    return node;
  }

  createEdge(nodeA: string, nodeB: string): Edge {
    const id = `edge_${this.nextEdgeId++}`;
    const edge = new Edge(id, nodeA, nodeB);
    this.edges.set(id, edge);

    const he1Id = `he_${this.nextHalfEdgeId++}`;
    const he2Id = `he_${this.nextHalfEdgeId++}`;

    const he1 = new HalfEdge(he1Id, nodeA, id);
    const he2 = new HalfEdge(he2Id, nodeB, id);

    he1.twin = he2Id;
    he2.twin = he1Id;

    this.halfEdges.set(he1Id, he1);
    this.halfEdges.set(he2Id, he2);

    const nodeAObj = this.nodes.get(nodeA);
    const nodeBObj = this.nodes.get(nodeB);
    if (nodeAObj) nodeAObj.addEdge(id);
    if (nodeBObj) nodeBObj.addEdge(id);

    return edge;
  }

  deleteEdge(edgeId: string): void {
    const edge = this.edges.get(edgeId);
    if (!edge) return;

    this.halfEdges.forEach((he) => {
      if (he.edgeId === edgeId) {
        this.halfEdges.delete(he.id);
      }
    });

    const nodeA = this.nodes.get(edge.nodeA);
    const nodeB = this.nodes.get(edge.nodeB);
    if (nodeA) nodeA.removeEdge(edgeId);
    if (nodeB) nodeB.removeEdge(edgeId);

    this.edges.delete(edgeId);
  }

  findNearestNode(position: Vec2, maxDistance: number): Node | null {
    let nearest: Node | null = null;
    let minDist = maxDistance;

    this.nodes.forEach((node) => {
      const dist = Vec2Math.distance(position, node.position);
      if (dist < minDist) {
        minDist = dist;
        nearest = node;
      }
    });

    return nearest;
  }

  mergeNodes(nodeAId: string, nodeBId: string): void {
    const nodeA = this.nodes.get(nodeAId);
    const nodeB = this.nodes.get(nodeBId);
    if (!nodeA || !nodeB) return;

    nodeA.position = {
      x: (nodeA.position.x + nodeB.position.x) / 2,
      y: (nodeA.position.y + nodeB.position.y) / 2,
    };

    nodeB.edges.forEach((edgeId) => {
      const edge = this.edges.get(edgeId);
      if (edge) {
        if (edge.nodeA === nodeBId) edge.nodeA = nodeAId;
        if (edge.nodeB === nodeBId) edge.nodeB = nodeAId;
        nodeA.addEdge(edgeId);
      }
    });

    this.nodes.delete(nodeBId);
    this.rebuildHalfEdges();
  }

  rebuildHalfEdges(): void {
    this.halfEdges.clear();

    this.edges.forEach((edge) => {
      const he1Id = `he_${this.nextHalfEdgeId++}`;
      const he2Id = `he_${this.nextHalfEdgeId++}`;

      const he1 = new HalfEdge(he1Id, edge.nodeA, edge.id);
      const he2 = new HalfEdge(he2Id, edge.nodeB, edge.id);

      he1.twin = he2Id;
      he2.twin = he1Id;

      this.halfEdges.set(he1Id, he1);
      this.halfEdges.set(he2Id, he2);
    });

    this.buildHalfEdgeConnections();
  }

  private buildHalfEdgeConnections(): void {
    this.nodes.forEach((node) => {
      const outgoingHEs: HalfEdge[] = [];
      this.halfEdges.forEach((he) => {
        if (he.originNode === node.id) {
          outgoingHEs.push(he);
        }
      });

      if (outgoingHEs.length < 2) return;

      outgoingHEs.sort((a, b) => {
        const targetA = this.getHalfEdgeTargetPosition(a);
        const targetB = this.getHalfEdgeTargetPosition(b);
        if (!targetA || !targetB) return 0;

        const angleA = Math.atan2(targetA.y - node.position.y, targetA.x - node.position.x);
        const angleB = Math.atan2(targetB.y - node.position.y, targetB.x - node.position.x);

        return angleA - angleB;
      });

      for (let i = 0; i < outgoingHEs.length; i++) {
        const currentHE = outgoingHEs[i];
        const nextHE = outgoingHEs[(i + 1) % outgoingHEs.length];

        if (currentHE.twin) {
          const twinHE = this.halfEdges.get(currentHE.twin);
          if (twinHE) {
            twinHE.next = nextHE.id;
            nextHE.prev = twinHE.id;
          }
        }
      }
    });
  }

  private getHalfEdgeTargetPosition(he: HalfEdge): Vec2 | null {
    const targetNodeId = he.getTargetNode(this.halfEdges);
    if (!targetNodeId) return null;
    const targetNode = this.nodes.get(targetNodeId);
    return targetNode ? targetNode.position : null;
  }

  detectFaces(): Face[] {
    this.faces.clear();
    const visited = new Set<string>();

    this.halfEdges.forEach((startHE) => {
      if (visited.has(startHE.id)) return;

      const faceHEs: string[] = [];
      let currentHEId: string | null = startHE.id;
      const maxSteps = 1000;
      let steps = 0;

      while (currentHEId && !visited.has(currentHEId) && steps < maxSteps) {
        faceHEs.push(currentHEId);
        visited.add(currentHEId);

        const currentHE = this.halfEdges.get(currentHEId);
        if (!currentHE || !currentHE.next) break;

        currentHEId = currentHE.next;
        if (currentHEId === startHE.id) break;
        steps++;
      }

      if (faceHEs.length >= 3) {
        const faceId = `face_${this.nextFaceId++}`;
        const face = new Face(faceId);
        face.halfEdges = faceHEs;

        faceHEs.forEach((heId) => {
          const he = this.halfEdges.get(heId);
          if (he) he.face = faceId;
        });

        const polygon = this.getFacePolygon(face);
        if (polygon.length >= 3) {
          face.calculateArea(polygon);
          face.calculateCentroid(polygon);

          const isCCW = Face.isCounterClockwise(polygon);
          const minRoomArea = 1000000;
          face.isRoom = isCCW && face.area > minRoomArea;

          this.faces.set(faceId, face);
        }
      }
    });

    return Array.from(this.faces.values()).filter((f) => f.isRoom);
  }

  getFacePolygon(face: Face): Vec2[] {
    const polygon: Vec2[] = [];

    for (const heId of face.halfEdges) {
      const he = this.halfEdges.get(heId);
      if (!he) continue;

      const node = this.nodes.get(he.originNode);
      if (node) {
        polygon.push(node.position);
      }
    }

    return polygon;
  }

  getNodes(): Node[] {
    return Array.from(this.nodes.values());
  }

  getEdges(): Edge[] {
    return Array.from(this.edges.values());
  }

  getFaces(): Face[] {
    return Array.from(this.faces.values());
  }

  getNode(id: string): Node | undefined {
    return this.nodes.get(id);
  }

  getEdge(id: string): Edge | undefined {
    return this.edges.get(id);
  }

  clear(): void {
    this.nodes.clear();
    this.edges.clear();
    this.halfEdges.clear();
    this.faces.clear();
    this.nextNodeId = 0;
    this.nextEdgeId = 0;
    this.nextHalfEdgeId = 0;
    this.nextFaceId = 0;
  }

  toJSON(): object {
    return {
      nodes: Array.from(this.nodes.values()).map((n) => n.toJSON()),
      edges: Array.from(this.edges.values()).map((e) => e.toJSON()),
      halfEdges: Array.from(this.halfEdges.values()).map((he) => he.toJSON()),
      faces: Array.from(this.faces.values()).map((f) => f.toJSON()),
      nextNodeId: this.nextNodeId,
      nextEdgeId: this.nextEdgeId,
      nextHalfEdgeId: this.nextHalfEdgeId,
      nextFaceId: this.nextFaceId,
    };
  }

  static fromJSON(data: any): TopologyGraph {
    const graph = new TopologyGraph();

    if (data.nodes) {
      data.nodes.forEach((n: any) => {
        const node = Node.fromJSON(n);
        graph.nodes.set(node.id, node);
      });
    }

    if (data.edges) {
      data.edges.forEach((e: any) => {
        const edge = Edge.fromJSON(e);
        graph.edges.set(edge.id, edge);
      });
    }

    if (data.halfEdges) {
      data.halfEdges.forEach((he: any) => {
        const halfEdge = HalfEdge.fromJSON(he);
        graph.halfEdges.set(halfEdge.id, halfEdge);
      });
    }

    if (data.faces) {
      data.faces.forEach((f: any) => {
        const face = Face.fromJSON(f);
        graph.faces.set(face.id, face);
      });
    }

    graph.nextNodeId = data.nextNodeId || 0;
    graph.nextEdgeId = data.nextEdgeId || 0;
    graph.nextHalfEdgeId = data.nextHalfEdgeId || 0;
    graph.nextFaceId = data.nextFaceId || 0;

    return graph;
  }
}
