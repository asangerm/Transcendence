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
    top: { position: Vector3; velocity: Vector3 };
    bottom: { position: Vector3; velocity: Vector3 };
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

import type { Game2State } from './Game2SimpleEngine';

export type RealtimeMessage =
  | { type: 'hello'; serverTime: number }
  | { type: 'state'; state: ServerGameState | TestEngineState | Game2State }
  | { type: 'created'; gameId: string }
  | { type: 'joined'; gameId: string; side: 'top' | 'bottom' }
  | { type: 'error'; message: string };

// Room Management Types
export type GameRoom = {
  id: string;
  name: string;
  ownerId: string;
  ownerUsername: string;
  players: {
    top?: { id: string; username: string; ready: boolean };
    bottom?: { id: string; username: string; ready: boolean };
  };
  gameId?: string; // Set when game starts
  createdAt: number;
  maxPlayers: number;
  status: 'waiting' | 'in_progress' | 'finished';
};

export type RoomPlayer = {
  id: string;
  username: string;
  ready: boolean;
  side?: 'top' | 'bottom';
};

export type RoomMessage =
  | { type: 'room_created'; room: GameRoom }
  | { type: 'room_joined'; room: GameRoom; player: RoomPlayer }
  | { type: 'room_left'; room: GameRoom; playerId: string }
  | { type: 'player_ready'; room: GameRoom; playerId: string; ready: boolean }
  | { type: 'player_kicked'; room: GameRoom; playerId: string }
  | { type: 'game_started'; room: GameRoom; gameId: string }
  | { type: 'room_list'; rooms: GameRoom[] }
  | { type: 'room_error'; message: string };


