export type GameKind = 'pong' | 'game2' | 'test';

export type Vector3 = { x: number; y: number; z: number };

export type ServerGameState = {
  id: string;
  kind: GameKind;
  players: {
    top?: { id: string; username?: string };
    bottom?: { id: string; username?: string };
  };
  ball: { position: Vector3; velocity: Vector3 };
  paddles: {
    top: { position: Vector3 };
    bottom: { position: Vector3 };
  };
  scores: { top: number; bottom: number };
  createdAt: number;
  updatedAt: number;
  gameOver: boolean;
  winner: 'top' | 'bottom' | null;
};

export type ClientInput = {
  gameId: string;
  playerSide: 'top' | 'bottom';
  action: 'moveLeft' | 'moveRight' | 'stop';
  seq?: number;
};

export type ClientPaddleUpdate = {
  type: 'paddle';
  gameId: string;
  playerSide: 'top' | 'bottom';
  x: number;
};

// Test Engine Types
export type TestEngineState = {
  id: string;
  kind: 'test';
  players: {
    player1?: { id: string; username?: string };
  };
  cube: {
    position: Vector3;
    velocity: Vector3;
    acceleration: Vector3;
  };
  createdAt: number;
  updatedAt: number;
  gameOver: boolean;
  winner: string | null;
};

export type TestEngineInput = {
  gameId: string;
  action: 'moveUp' | 'moveDown' | 'moveLeft' | 'moveRight' | 'moveForward' | 'moveBackward' | 'stop';
  seq?: number;
};

export type RealtimeMessage =
  | { type: 'hello'; serverTime: number }
  | { type: 'state'; state: ServerGameState | TestEngineState }
  | { type: 'created'; gameId: string }
  | { type: 'joined'; gameId: string; side: 'top' | 'bottom' }
  | { type: 'error'; message: string };


