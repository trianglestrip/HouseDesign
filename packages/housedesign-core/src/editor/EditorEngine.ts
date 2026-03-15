import { TopologyGraph } from '../core/topology/TopologyGraph';
import { Wall } from '../core/model/Wall';
import { Room } from '../core/model/Room';
import { Opening } from '../core/model/Opening';
import { SnapEngine } from '../systems/snap/SnapEngine';
import { UndoRedo } from '../systems/history/UndoRedo';
import { ConstraintSolver } from '../systems/constraint/ConstraintSolver';
import { EventBus } from './EventBus';
import { ToolManager } from './ToolManager';
import { SelectionManager } from './SelectionManager';

export class EditorEngine {
  private graph: TopologyGraph;
  private walls: Map<string, Wall>;
  private rooms: Map<string, Room>;
  private openings: Map<string, Opening>;
  
  public snapEngine: SnapEngine;
  public undoRedo: UndoRedo;
  public constraintSolver: ConstraintSolver;
  public eventBus: EventBus;
  public toolManager: ToolManager;
  public selectionManager: SelectionManager;

  constructor() {
    this.graph = new TopologyGraph();
    this.walls = new Map();
    this.rooms = new Map();
    this.openings = new Map();
    
    this.eventBus = new EventBus();
    this.snapEngine = new SnapEngine();
    this.undoRedo = new UndoRedo();
    this.constraintSolver = new ConstraintSolver();
    this.toolManager = new ToolManager(this.eventBus);
    this.selectionManager = new SelectionManager(this.eventBus);
  }

  getGraph(): TopologyGraph {
    return this.graph;
  }

  getWalls(): Map<string, Wall> {
    return this.walls;
  }

  getWall(id: string): Wall | undefined {
    return this.walls.get(id);
  }

  addWall(wall: Wall): void {
    this.walls.set(wall.id, wall);
    this.eventBus.emit('wall:added', wall);
  }

  removeWall(id: string): void {
    const wall = this.walls.get(id);
    if (wall) {
      this.walls.delete(id);
      this.eventBus.emit('wall:removed', wall);
    }
  }

  getRooms(): Map<string, Room> {
    return this.rooms;
  }

  getRoom(id: string): Room | undefined {
    return this.rooms.get(id);
  }

  addRoom(room: Room): void {
    this.rooms.set(room.id, room);
    this.eventBus.emit('room:added', room);
  }

  removeRoom(id: string): void {
    const room = this.rooms.get(id);
    if (room) {
      this.rooms.delete(id);
      this.eventBus.emit('room:removed', room);
    }
  }

  getOpenings(): Map<string, Opening> {
    return this.openings;
  }

  getOpening(id: string): Opening | undefined {
    return this.openings.get(id);
  }

  addOpening(opening: Opening): void {
    this.openings.set(opening.id, opening);
    this.eventBus.emit('opening:added', opening);
  }

  removeOpening(id: string): void {
    const opening = this.openings.get(id);
    if (opening) {
      this.openings.delete(id);
      this.eventBus.emit('opening:removed', opening);
    }
  }

  clear(): void {
    this.graph.clear();
    this.walls.clear();
    this.rooms.clear();
    this.openings.clear();
    this.undoRedo.clear();
    this.selectionManager.clearSelection();
    this.eventBus.emit('editor:cleared');
  }

  generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
