import { TopologyGraph } from '../topology/TopologyGraph';
import { Edge } from '../topology/Edge';
import { Node } from '../topology/Node';
import { Vec2 } from '../geometry/Vec2';
import { Polygon } from '../geometry/Polygon';

export interface DetectedRoom {
  id: string;
  edgeIds: string[];
  vertices: Vec2[];
  area: number;
}

export class RoomDetection {
  static detectRooms(graph: TopologyGraph): DetectedRoom[] {
    const rooms: DetectedRoom[] = [];
    const visitedEdges = new Set<string>();
    
    for (const edge of graph.getAllEdges()) {
      if (visitedEdges.has(edge.id)) continue;
      
      const cycle = this.findMinimalCycle(graph, edge, visitedEdges);
      if (cycle && cycle.length >= 3) {
        const vertices = this.getVerticesFromEdges(graph, cycle);
        const area = Polygon.area(vertices);
        
        if (area > 0) {
          rooms.push({
            id: `room_${rooms.length}`,
            edgeIds: cycle,
            vertices,
            area
          });
          
          cycle.forEach(edgeId => visitedEdges.add(edgeId));
        }
      }
    }
    
    return rooms;
  }

  private static findMinimalCycle(
    graph: TopologyGraph,
    startEdge: Edge,
    visitedEdges: Set<string>
  ): string[] | null {
    const path: string[] = [startEdge.id];
    const visited = new Set<string>([startEdge.id]);
    let currentNodeId = startEdge.endNodeId;
    const targetNodeId = startEdge.startNodeId;
    
    while (path.length < 100) {
      const currentNode = graph.getNode(currentNodeId);
      if (!currentNode) break;
      
      let nextEdge: Edge | null = null;
      let minAngle = Infinity;
      
      const lastEdge = graph.getEdge(path[path.length - 1]);
      if (!lastEdge) break;
      
      const lastNode = graph.getNode(lastEdge.startNodeId === currentNodeId 
        ? lastEdge.endNodeId 
        : lastEdge.startNodeId);
      if (!lastNode) break;
      
      const incomingDir = currentNode.position.sub(lastNode.position).normalize();
      
      for (const edgeId of currentNode.edgeIds) {
        if (visited.has(edgeId)) continue;
        
        const edge = graph.getEdge(edgeId);
        if (!edge) continue;
        
        const nextNodeId = edge.startNodeId === currentNodeId 
          ? edge.endNodeId 
          : edge.startNodeId;
        const nextNode = graph.getNode(nextNodeId);
        if (!nextNode) continue;
        
        const outgoingDir = nextNode.position.sub(currentNode.position).normalize();
        const angle = incomingDir.angleTo(outgoingDir);
        const normalizedAngle = angle < 0 ? angle + 2 * Math.PI : angle;
        
        if (normalizedAngle < minAngle) {
          minAngle = normalizedAngle;
          nextEdge = edge;
        }
      }
      
      if (!nextEdge) break;
      
      path.push(nextEdge.id);
      visited.add(nextEdge.id);
      
      currentNodeId = nextEdge.startNodeId === currentNodeId 
        ? nextEdge.endNodeId 
        : nextEdge.startNodeId;
      
      if (currentNodeId === targetNodeId) {
        return path;
      }
    }
    
    return null;
  }

  private static getVerticesFromEdges(
    graph: TopologyGraph,
    edgeIds: string[]
  ): Vec2[] {
    const vertices: Vec2[] = [];
    
    for (const edgeId of edgeIds) {
      const edge = graph.getEdge(edgeId);
      if (edge) {
        const startNode = graph.getNode(edge.startNodeId);
        if (startNode) {
          vertices.push(startNode.position);
        }
      }
    }
    
    return vertices;
  }
}
