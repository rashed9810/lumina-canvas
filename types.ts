export enum Tool {
  SELECT = 'SELECT',
  PEN = 'PEN',
  ERASER = 'ERASER',
  RECTANGLE = 'RECTANGLE',
  CIRCLE = 'CIRCLE',
  TEXT = 'TEXT',
  LINE = 'LINE',
  ARROW = 'ARROW',
  MOVE = 'MOVE',
  ZOOM = 'ZOOM'
}

export interface UserCursor {
  id: string;
  x: number;
  y: number;
  name: string;
  color: string;
  lastUpdate: number;
}

export enum BroadcastEventType {
  CURSOR_MOVE = 'CURSOR_MOVE',
  OBJECT_ADDED = 'OBJECT_ADDED',
  OBJECT_MODIFIED = 'OBJECT_MODIFIED',
  OBJECT_REMOVED = 'OBJECT_REMOVED',
  CLEAR = 'CLEAR',
  RESTORE_STATE = 'RESTORE_STATE'
}

export interface BroadcastEvent {
  type: BroadcastEventType;
  payload: any;
  userId: string;
}

export interface FabricObject extends fabric.Object {
  id?: string;
}

// Declare fabric globally as it's loaded via script tag
declare global {
  var fabric: any;
}

// Namespace declaration for deeper type access if needed
declare namespace fabric {
  class Object {
    [key: string]: any;
  }
}