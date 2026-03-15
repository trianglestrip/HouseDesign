import { Node } from './Node';
import { Edge } from './Edge';
import { HalfEdge } from './HalfEdge';
import { Face } from './Face';
import { Vec2 } from '../geometry/Vec2';

export class TopologyGraph {
  private nodes: Map<string, Node> = new Map();
  private edges: Map<string, Edge> = new Map();
  private halfEdges: Map<string, HalfEdge> = new Map();
  private faces: Map<string, Face> = new Map();

  addNode(node: Node): void {
    this.nodes.set(node.id, node);
  }

  getNode(id: string): Node | undefined {
    return this.nodes.get(id);
  }

  removeNode(id: string): void {
    const node = this.nodes.get(id);
    if (node) {
      node.edgeIds.forEach(edgeId => this.removeEdge(edgeId));
      this.nodes.delete(id);
    }
  }

  getAllNodes(): Node[] {
    return Array.from(this.nodes.values());
  }

  addEdge(edge: Edge): void {
    this.edges.set(edge.id, edge);
    
    const startNode = this.nodes.get(edge.startNodeId);
    const endNode = this.nodes.get(edge.endNodeId);
    
    if (startNode) startNode.addEdge(edge.id);
    if (endNode) endNode.addEdge(edge.id);
  }

  getEdge(id: string): Edge | undefined {
    return this.edges.get(id);
  }

  removeEdge(id: string): void {
    const edge = this.edges.get(id);
    if (edge) {
      const startNode = this.nodes.get(edge.startNodeId);
      const endNode = this.nodes.get(edge.endNodeId);
      
      if (startNode) startNode.removeEdge(id);
      if (endNode) endNode.removeEdge(id);
      
      edge.halfEdgeIds.forEach(heId => this.removeHalfEdge(heId));
      this.edges.delete(id);
    }
  }

  getAllEdges(): Edge[] {
    return Array.from(this.edges.values());
  }

  addHalfEdge(halfEdge: HalfEdge): void {
    this.halfEdges.set(halfEdge.id, halfEdge);
    
    const edge = this.edges.get(halfEdge.edgeId);
    if (edge) {
      edge.addHalfEdge(halfEdge.id);
    }
  }

  getHalfEdge(id: string): HalfEdge | undefined {
    return this.halfEdges.get(id);
  }

  removeHalfEdge(id: string): void {
    const halfEdge = this.halfEdges.get(id);
    if (halfEdge) {
      const edge = this.edges.get(halfEdge.edgeId);
      if (edge) {
        edge.removeHalfEdge(id);
      }
      this.halfEdges.delete(id);
    }
  }

  getAllHalfEdges(): HalfEdge[] {
    return Array.from(this.halfEdges.values());
  }

  addFace(face: Face): void {
    this.faces.set(face.id, face);
  }

  getFace(id: string): Face | undefined {
    return this.faces.get(id);
  }

  removeFace(id: string): void {
    this.faces.delete(id);
  }

  getAllFaces(): Face[] {
    return Array.from(this.faces.values());
  }

  findNodeAt(position: Vec2, tolerance: number = 5): Node | undefined {
    for (const node of this.nodes.values()) {
      if (node.position.distance(position) <= tolerance) {
        return node;
      }
    }
    return undefined;
  }

  findEdgeAt(position: Vec2, tolerance: number = 5): Edge | undefined {
    for (const edge of this.edges.values()) {
      const startNode = this.nodes.get(edge.startNodeId);
      const endNode = this.nodes.get(edge.endNodeId);
      
      if (startNode && endNode) {
        const distance = this.pointToSegmentDistance(
          position,
          startNode.position,
          endNode.position
        );
        if (distance <= tolerance) {
          return edge;
        }
      }
    }
    return undefined;
  }

  private pointToSegmentDistance(point: Vec2, start: Vec2, end: Vec2): number {
    const line = end.sub(start);
    const len = line.lengthSquared();
    
    if (len === 0) return point.distance(start);
    
    const t = Math.max(0, Math.min(1, point.sub(start).dot(line) / len));
    const projection = start.add(line.mul(t));
    return point.distance(projection);
  }

  mergeNodes(nodeId1: string, nodeId2: string): void {
    const node1 = this.nodes.get(nodeId1);
    const node2 = this.nodes.get(nodeId2);
    
    if (!node1 || !node2 || nodeId1 === nodeId2) return;
    
    node2.edgeIds.forEach(edgeId => {
      const edge = this.edges.get(edgeId);
      if (edge) {
        if (edge.startNodeId === nodeId2) {
          edge.startNodeId = nodeId1;
        }
        if (edge.endNodeId === nodeId2) {
          edge.endNodeId = nodeId1;
        }
        node1.addEdge(edgeId);
      }
    });
    
    this.nodes.delete(nodeId2);
  }

  clear(): void {
    this.nodes.clear();
    this.edges.clear();
    this.halfEdges.clear();
    this.faces.clear();
  }

  clone(): TopologyGraph {
    const graph = new TopologyGraph();
    
    this.nodes.forEach(node => graph.addNode(node.clone()));
    this.edges.forEach(edge => graph.addEdge(edge.clone()));
    this.halfEdges.forEach(he => graph.addHalfEdge(he.clone()));
    this.faces.forEach(face => graph.addFace(face.clone()));
    
    return graph;
  }

  toJSON(): any {
    return {
      nodes: Array.from(this.nodes.values()).map(n => n.toJSON()),
      edges: Array.from(this.edges.values()).map(e => e.toJSON()),
      halfEdges: Array.from(this.halfEdges.values()).map(he => he.toJSON()),
      faces: Array.from(this.faces.values()).map(f => f.toJSON())
    };
  }

  static fromJSON(data: any): TopologyGraph {
    const graph = new TopologyGraph();
    
    if (data.nodes) {
      data.nodes.forEach((nodeData: any) => {
        graph.addNode(Node.fromJSON(nodeData));
      });
    }
    
    if (data.edges) {
      data.edges.forEach((edgeData: any) => {
        graph.addEdge(Edge.fromJSON(edgeData));
      });
    }
    
    if (data.halfEdges) {
      data.halfEdges.forEach((heData: any) => {
        graph.addHalfEdge(HalfEdge.fromJSON(heData));
      });
    }
    
    if (data.faces) {
      data.faces.forEach((faceData: any) => {
        graph.addFace(Face.fromJSON(faceData));
      });
    }
    
    return graph;
  }
}
