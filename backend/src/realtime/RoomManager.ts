import { randomUUID } from 'crypto';
import type { GameRoom, RoomPlayer } from './gameTypes';
import { gameManager } from './GameManager';

export class RoomManager {
  private rooms: Map<string, GameRoom> = new Map();
  private playerRooms: Map<string, string> = new Map(); // playerId -> roomId

  createRoom(ownerId: string, ownerUsername: string, roomName: string): GameRoom {
    const roomId = randomUUID();
    const room: GameRoom = {
      id: roomId,
      name: roomName,
      ownerId,
      ownerUsername,
      players: {
        top: {
          id: ownerId,
          username: ownerUsername,
          ready: false
        }
      },
      createdAt: Date.now(),
      maxPlayers: 2,
      status: 'waiting'
    };
    
    this.rooms.set(roomId, room);
    this.playerRooms.set(ownerId, roomId);
    
    return room;
  }

  joinRoom(roomId: string, playerId: string, username: string): { success: boolean; room?: GameRoom; error?: string } {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { success: false, error: 'Room not found' };
    }

    if (room.status !== 'waiting') {
      return { success: false, error: 'Room is not accepting new players' };
    }

    // Check if player is already in a room
    if (this.playerRooms.has(playerId)) {
      return { success: false, error: 'Player is already in a room' };
    }

    // Check if room is full
    const playerCount = Object.keys(room.players).length;
    if (playerCount >= room.maxPlayers) {
      return { success: false, error: 'Room is full' };
    }

    // If the creator is joining their own room, they're already in it as top player
    if (playerId === room.ownerId) {
      return { success: true, room };
    }

    // Other players go to bottom
    room.players.bottom = { id: playerId, username, ready: false };
    this.playerRooms.set(playerId, roomId);

    return { success: true, room };
  }

  leaveRoom(playerId: string): { success: boolean; room?: GameRoom; error?: string } {
    const roomId = this.playerRooms.get(playerId);
    if (!roomId) {
      return { success: false, error: 'Player is not in any room' };
    }

    const room = this.rooms.get(roomId);
    if (!room) {
      return { success: false, error: 'Room not found' };
    }

    // If the room creator leaves, delete the entire room
    if (playerId === room.ownerId) {
      // Remove all players from the room
      for (const player of Object.values(room.players)) {
        this.playerRooms.delete(player.id);
      }
      // Delete the room
      this.rooms.delete(roomId);
      return { success: true };
    }

    // Remove player from room
    const side = room.players.top?.id === playerId ? 'top' : 'bottom';
    if (side && room.players[side]) {
      delete room.players[side];
    }

    this.playerRooms.delete(playerId);

    // If room is empty, delete it
    if (Object.keys(room.players).length === 0) {
      this.rooms.delete(roomId);
      return { success: true };
    }

    return { success: true, room };
  }

  kickPlayer(roomId: string, ownerId: string, targetPlayerId: string): { success: boolean; room?: GameRoom; error?: string } {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { success: false, error: 'Room not found' };
    }

    if (room.ownerId !== ownerId) {
      return { success: false, error: 'Only room owner can kick players' };
    }

    const side = room.players.top?.id === targetPlayerId ? 'top' : 'bottom';
    if (side && room.players[side]) {
      delete room.players[side];
      this.playerRooms.delete(targetPlayerId);
    }

    return { success: true, room };
  }

  setPlayerReady(playerId: string, ready: boolean): { success: boolean; room?: GameRoom; error?: string } {
    const roomId = this.playerRooms.get(playerId);
    if (!roomId) {
      return { success: false, error: 'Player is not in any room' };
    }

    const room = this.rooms.get(roomId);
    if (!room) {
      return { success: false, error: 'Room not found' };
    }

    const side = room.players.top?.id === playerId ? 'top' : 'bottom';
    if (side && room.players[side]) {
      room.players[side]!.ready = ready;
    }

    return { success: true, room };
  }

  startGame(roomId: string, ownerId: string): { success: boolean; gameId?: string; room?: GameRoom; error?: string } {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { success: false, error: 'Room not found' };
    }

    if (room.ownerId !== ownerId) {
      return { success: false, error: 'Only room owner can start the game' };
    }

    if (room.status !== 'waiting') {
      return { success: false, error: 'Game already started or finished' };
    }

    // Check if all players are ready
    const players = Object.values(room.players);
    if (players.length < 2) {
      return { success: false, error: 'Need at least 2 players to start' };
    }

    if (!players.every(p => p.ready)) {
      return { success: false, error: 'All players must be ready to start' };
    }

    // Create the game
    const { id: gameId } = gameManager.createGame('pong');
    room.gameId = gameId;
    room.status = 'in_progress';

    // Set players in the game engine
    const engine = gameManager.getEngine(gameId);
    if (engine && 'setPlayer' in engine) {
      if (room.players.top) {
        (engine as any).setPlayer('top', { id: room.players.top.id, username: room.players.top.username });
      }
      if (room.players.bottom) {
        (engine as any).setPlayer('bottom', { id: room.players.bottom.id, username: room.players.bottom.username });
      }
    }

    return { success: true, gameId, room };
  }

  getRoom(roomId: string): GameRoom | null {
    return this.rooms.get(roomId) || null;
  }

  getPlayerRoom(playerId: string): GameRoom | null {
    const roomId = this.playerRooms.get(playerId);
    return roomId ? this.rooms.get(roomId) || null : null;
  }

  listRooms(): GameRoom[] {
    return Array.from(this.rooms.values())
      .filter(room => room.status === 'waiting' && Object.keys(room.players).length < room.maxPlayers)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  cleanup(): void {
    // Remove empty rooms and finished games
    for (const [roomId, room] of this.rooms.entries()) {
      if (Object.keys(room.players).length === 0 || room.status === 'finished') {
        this.rooms.delete(roomId);
        // Clean up player room mappings
        for (const [playerId, mappedRoomId] of this.playerRooms.entries()) {
          if (mappedRoomId === roomId) {
            this.playerRooms.delete(playerId);
          }
        }
      }
    }
  }
}

export const roomManager = new RoomManager();
