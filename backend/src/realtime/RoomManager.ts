import { randomUUID } from 'crypto';
import type { GameRoom, RoomPlayer, GameKind } from './gameTypes';
import { gameManager } from './GameManager';

export class RoomManager {
  private rooms: Map<string, GameRoom> = new Map();
  private playerRooms: Map<string, string> = new Map();

  createRoom(ownerId: string, ownerUsername: string, roomName: string, gameType: GameKind = 'pong'): GameRoom {
    const roomId = randomUUID();
    
    let players: any = {};
    if (gameType === 'game2') {
      players = {
        player1: {
          id: ownerId,
          username: ownerUsername,
          ready: false
        }
      };
    } else {
      players = {
        top: {
          id: ownerId,
          username: ownerUsername,
          ready: false
        }
      };
    }
    
    const room: GameRoom = {
      id: roomId,
      name: roomName,
      ownerId,
      ownerUsername,
      players,
      createdAt: Date.now(),
      maxPlayers: 2,
      status: 'waiting',
      gameType: gameType
    };
    
    this.rooms.set(roomId, room);
    this.playerRooms.set(ownerId, roomId);

    console.log('[ROOM] createRoom', { roomId, ownerId, ownerUsername, gameType });
    
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

    if (this.playerRooms.has(playerId)) {
      return { success: false, error: 'Player is already in a room' };
    }

    const playerCount = Object.keys(room.players).length;
    if (playerCount >= room.maxPlayers) {
      return { success: false, error: 'Room is full' };
    }

    if (playerId === room.ownerId) {
      return { success: true, room };
    }

    if (room.gameType === 'game2') {
      room.players.player2 = { id: playerId, username, ready: false };
    } else {
      room.players.bottom = { id: playerId, username, ready: false };
    }
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

    if (playerId === room.ownerId) {
      for (const player of Object.values(room.players)) {
        this.playerRooms.delete(player.id);
      }
      this.rooms.delete(roomId);
      return { success: true };
    }

    if (room.gameType === 'game2') {
      if (room.players.player1?.id === playerId) {
        delete room.players.player1;
      } else if (room.players.player2?.id === playerId) {
        delete room.players.player2;
      }
    } else {
      const side = room.players.top?.id === playerId ? 'top' : 'bottom';
      if (side && room.players[side]) {
        delete room.players[side];
      }
    }

    this.playerRooms.delete(playerId);

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

    if (room.gameType === 'game2') {
      if (room.players.player1?.id === playerId) {
        room.players.player1.ready = ready;
      } else if (room.players.player2?.id === playerId) {
        room.players.player2.ready = ready;
      }
    } else {
      const side = room.players.top?.id === playerId ? 'top' : 'bottom';
      if (side && room.players[side]) {
        room.players[side]!.ready = ready;
      }
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

    const players = Object.values(room.players);
    if (players.length < 2) {
      return { success: false, error: 'Need at least 2 players to start' };
    }

    if (!players.every(p => p.ready)) {
      return { success: false, error: 'All players must be ready to start' };
    }

    const gameType = (room.gameType || 'pong') as GameKind;
    const { id: gameId } = gameManager.createGame(gameType, room.players.top as { id: string; username?: string }, room.players.bottom as { id: string; username?: string });
    room.gameId = gameId;
    room.status = 'in_progress';
    console.log('[ROOM] startGame', { roomId, gameId, gameType, ownerId });

    const engine = gameManager.getEngine(gameId);
    if (engine && 'setPlayer' in engine) {
      if (room.gameType === 'game2') {
        if (room.players.player1) {
          (engine as any).setPlayer('player1', { id: room.players.player1.id, username: room.players.player1.username });
        }
        if (room.players.player2) {
          (engine as any).setPlayer('player2', { id: room.players.player2.id, username: room.players.player2.username });
        }
        console.log('[ROOM] set players for game2', { roomId, player1: room.players.player1?.id, player2: room.players.player2?.id });
      } else {
        if (room.players.top) {
          (engine as any).setPlayer('top', { id: room.players.top.id, username: room.players.top.username });
        }
        if (room.players.bottom) {
          (engine as any).setPlayer('bottom', { id: room.players.bottom.id, username: room.players.bottom.username });
        }
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

  listRooms(gameType?: GameKind): GameRoom[] {
    const rooms = Array.from(this.rooms.values())
      .sort((a, b) => b.createdAt - a.createdAt);
    
    if (gameType) {
      return rooms.filter(room => room.gameType === gameType);
    }
    return rooms;
  }

  cleanup(): void {
    for (const [roomId, room] of this.rooms.entries()) {
      if (Object.keys(room.players).length === 0 || room.status === 'finished') {
        this.rooms.delete(roomId);
        for (const [playerId, mappedRoomId] of this.playerRooms.entries()) {
          if (mappedRoomId === roomId) {
            this.playerRooms.delete(playerId);
          }
        }
      }
    }
  }

  deleteRoom(roomId: string): { success: boolean } {
    const room = this.rooms.get(roomId);
    if (!room) return { success: false };
    for (const player of Object.values(room.players)) {
      this.playerRooms.delete(player.id);
    }
    this.rooms.delete(roomId);
    return { success: true };
  }
}

export const roomManager = new RoomManager();
