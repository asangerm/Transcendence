declare const require: any;
const websocket = require('@fastify/websocket');
type FastifyInstance = any;
import { gameManager } from './GameManager';
import { roomManager } from './RoomManager';
import { Game2SimpleEngine } from './Game2SimpleEngine';

import type { ClientInput, ClientPaddleUpdate, TestEngineInput, RealtimeMessage, RoomMessage } from './gameTypes';

export async function registerRealtime(app: FastifyInstance) {
  console.log('Registering WebSocket routes...');

  const connections = new Map<string, Set<any>>();
  const roomConnections = new Map<string, Set<any>>();
  const playerConnections = new Map<string, any>();
  const recordedMatches = new Set<string>();
  const recordedTournamentMatches = new Set<number>();
  let cachedPongGameId: number | null = null;
  let cachedGame2Id: number | null = null;

  const ensurePongId = (): number => {
    if (cachedPongGameId != null) return cachedPongGameId;
    try {
      const row = app.db.prepare("SELECT id FROM games WHERE name = ?").get('Pong') as { id?: number } | undefined;
      if (row && typeof row.id === 'number') {
        cachedPongGameId = row.id;
        return cachedPongGameId;
      }
      const res = app.db.prepare("INSERT INTO games (name, description) VALUES (?, ?)").run('Pong', 'Pong');
      cachedPongGameId = Number(res.lastInsertRowid);
      return cachedPongGameId;
    } catch {
      cachedPongGameId = 0;
      return 0;
    }
  };

  const ensureGame2Id = (): number => {
    if (cachedGame2Id != null) return cachedGame2Id;
    try {
      const row = app.db.prepare("SELECT id FROM games WHERE name = ?").get('Game2') as { id?: number } | undefined;
      if (row && typeof row.id === 'number') {
        cachedGame2Id = row.id;
        return cachedGame2Id;
      }
      const res = app.db.prepare("INSERT INTO games (name, description) VALUES (?, ?)").run('Game2', 'Description du deuxième jeu');
      cachedGame2Id = Number(res.lastInsertRowid);
      return cachedGame2Id;
    } catch {
      cachedGame2Id = 0;
      return 0;
    }
  };

  const recordGame2MatchIfNeeded = (gameId: string) => {
    if (recordedMatches.has(gameId)) return;
    const engine = gameManager.getEngine(gameId);
    if (!engine || !(engine instanceof Game2SimpleEngine)) return;
    const state: any = engine.getState?.() ?? null;
    if (!state || !state.gameOver) return;
    const p1 = state.players?.player1?.userId;
    const p2 = state.players?.player2?.userId;
    if (!p1 || !p2) return;
    const player1Id = Number(p1);
    const player2Id = Number(p2);
    if (!Number.isFinite(player1Id) || !Number.isFinite(player2Id)) return;
    const game2Id = ensureGame2Id();
    if (!game2Id) return;
    let winnerId: number | null = null;
    let s1 = 0, s2 = 0;
    if (state.winner === 'player1') {
      winnerId = player1Id;
      s1 = 1; s2 = 0;
    } else if (state.winner === 'player2') {
      winnerId = player2Id;
      s1 = 0; s2 = 1;
    } else {
      winnerId = null;
      s1 = 0; s2 = 0;
    }
    try {
      app.db.prepare(
        "INSERT INTO matches (game_id, player1_id, player2_id, winner_id, score_p1, score_p2) VALUES (?, ?, ?, ?, ?, ?)"
      ).run(game2Id, player1Id, player2Id, winnerId, s1, s2);
      recordedMatches.add(gameId);
      try {
        const rooms = roomManager.listRooms();
        const room = rooms.find(r => r.gameId === gameId);
        if (room) {
          roomManager.deleteRoom(room.id);
        }
      } catch {}
      try {
        gameManager.remove(gameId);
      } catch {}
    } catch {
    }
  };

  const recordPongMatchIfNeeded = (gameId: string) => {
    if (recordedMatches.has(gameId)) return;
    const state: any = gameManager.getState(gameId);
    if (!state || state.kind !== 'pong' || !state.gameOver) return;
    try {
      const meta = (gameManager as any).getTournamentMeta?.(gameId);
      if (meta) return;
    } catch {}
    const topIdRaw = state.players?.top?.id;
    const bottomIdRaw = state.players?.bottom?.id;
    if (!topIdRaw || !bottomIdRaw) return;
    const player1Id = Number(topIdRaw);
    const player2Id = Number(bottomIdRaw);
    if (!Number.isFinite(player1Id) || !Number.isFinite(player2Id)) return;
    const pongId = ensurePongId();
    if (!pongId) return;
    const scores = state.scores || {};
    const s1 = Number(scores.top ?? 0);
    const s2 = Number(scores.bottom ?? 0);
    let winnerId: number | null = null;
    if (state.winner === 'top') {
      winnerId = player1Id;
    } else if (state.winner === 'bottom') {
      winnerId = player2Id;
    }
    try {
      app.db.prepare(
        "INSERT INTO matches (game_id, player1_id, player2_id, winner_id, score_p1, score_p2) VALUES (?, ?, ?, ?, ?, ?)"
      ).run(pongId, player1Id, player2Id, winnerId, s1, s2);
    } catch {}
    recordedMatches.add(gameId);
    try {
      const rooms = roomManager.listRooms();
      const room = rooms.find(r => r.gameId === gameId);
      if (room) {
        roomManager.deleteRoom(room.id);
      }
    } catch {}
    try {
      gameManager.remove(gameId);
    } catch {}
  };

  const recordTournamentMatchIfNeeded = (gameId: string) => {
    try {
      const meta = (gameManager as any).getTournamentMeta?.(gameId) as { matchId: number; topDbId: number; bottomDbId: number; reported: boolean } | null;
      if (!meta || meta.reported) return;
      if (recordedTournamentMatches.has(meta.matchId)) return;
      const state: any = gameManager.getState(gameId);
      if (!state || state.kind !== 'pong' || !state.gameOver) return;
      const winnerSide = state.winner;
      if (winnerSide !== 'top' && winnerSide !== 'bottom') return;
      const winnerId = winnerSide === 'top' ? meta.topDbId : meta.bottomDbId;
      try {
        const svc = require('../services/tournament.service');
        const updateMatchTournament = svc.updateMatchTournament as (db: any, match: { id: number; winner_id: number }) => void;
        updateMatchTournament(app.db, { id: meta.matchId, winner_id: winnerId });
      } catch {}
      recordedTournamentMatches.add(meta.matchId);
      (gameManager as any).markTournamentReported?.(gameId);
    } catch {}
  };

  const broadcastState = (gameId: string) => {
    const engine = gameManager.getEngine(gameId);
    if (!engine) return;
    const stateMsg: RealtimeMessage = { type: 'state', state: engine.getState() };
    try { recordPongMatchIfNeeded(gameId); } catch {}
    try { recordGame2MatchIfNeeded(gameId); } catch {}
    try { recordTournamentMatchIfNeeded(gameId); } catch {}
    const subs = connections.get(gameId);
    if (!subs) return;
    const payload = JSON.stringify(stateMsg);
    for (const ws of Array.from(subs)) {
      try {
        ws.send(payload);
      } catch {
        subs.delete(ws);
      }
    }
    if (subs.size === 0) {
      connections.delete(gameId);
      const state: any = gameManager.getState(gameId);
      if (!state || state.gameOver === true) {
        console.log('[WS] removing finished game with no subscribers', { gameId });
        gameManager.remove(gameId);
      }
    }
  };

  const broadcastToRoom = (roomId: string, message: RoomMessage) => {
    const connections = roomConnections.get(roomId);
    if (!connections) return;

    const payload = JSON.stringify(message);
    for (const ws of connections) {
      try {
        ws.send(payload);
      } catch (error) {
        connections.delete(ws);
      }
    }
  };

  const broadcastToPlayer = (playerId: string, message: RoomMessage) => {
    const connection = playerConnections.get(playerId);
    if (connection) {
      try {
        connection.send(JSON.stringify(message));
      } catch (error) {
        playerConnections.delete(playerId);
      }
    }
  };

  setInterval(() => {
    gameManager.tickAll();
    for (const gameId of Array.from(connections.keys())) broadcastState(gameId);
  },  (1000 / 120));

  app.get('/ws/health', async (req: any, reply: any) => {
    reply.code(200).send({ status: 'ok', message: 'WebSocket server is running' });
  });

  app.get('/ws', { websocket: true }, (connection: any, req: any) => {
    if (!connection.socket) {
      return;
    }

    const url = new URL(req.url ?? '', 'http://localhost');
    const gameId = url.searchParams.get('gameId') ?? '';
    
    if (gameId) {
      if (!connections.has(gameId)) connections.set(gameId, new Set());
      connections.get(gameId)!.add(connection.socket);
    }

    connection.socket.send(JSON.stringify({ type: 'hello', serverTime: Date.now() } as RealtimeMessage));

    connection.socket.on('message', (data: any) => {
      try {
        const raw = typeof data === 'string' ? data : (data?.toString?.() ?? '');
        if (!raw) return;
        const anyMsg = JSON.parse(raw);
        if (anyMsg?.type === 'create_game' && anyMsg?.kind) {
            const game = gameManager.createGame(anyMsg.kind);
            console.log(`Game created: ${game.id}`);
            if (!connections.has(game.id)) connections.set(game.id, new Set());
            connections.get(game.id)!.add(connection.socket);
            
            connection.socket.send(JSON.stringify({ 
                type: 'created', 
                gameId: game.id 
            } satisfies RealtimeMessage));
            
            const state = gameManager.getState(game.id);
            if (state) {
                connection.socket.send(JSON.stringify({ 
                    type: 'state', 
                    state: state 
                } satisfies RealtimeMessage));
            }
            return;
        }

        if (anyMsg?.gameId && anyMsg?.type === 'input' && anyMsg?.playerId) {
            const engine = gameManager.getEngine(anyMsg.gameId);
            if (!engine) return;

            if (engine instanceof Game2SimpleEngine) {
                engine.applyInput(anyMsg.playerId, anyMsg.action);
                return;
            }
        }
  
        if (anyMsg?.type === 'paddle') {
          const msg = anyMsg as ClientPaddleUpdate;
          const engine = gameManager.getEngine(msg.gameId);
          if (!engine) return;
          (engine as any).setPaddleX(msg.playerSide, msg.x);
          return;
        }
        
        if (anyMsg?.gameId && anyMsg?.type === 'input') {
          const engine = gameManager.getEngine(anyMsg.gameId);
          if (!engine) return;
          if (anyMsg.side && (anyMsg.left !== undefined || anyMsg.right !== undefined)) {
            const input = {
              left: anyMsg.left || 0,
              right: anyMsg.right || 0
            };
            (engine as any).setInput(anyMsg.side, input);
          }
          return;
        }
        
        if (anyMsg?.gameId && (anyMsg?.up !== undefined || anyMsg?.down !== undefined || 
            anyMsg?.left !== undefined || anyMsg?.right !== undefined || 
            anyMsg?.forward !== undefined || anyMsg?.backward !== undefined)) {
          const engine = gameManager.getEngine(anyMsg.gameId);
          if (!engine) return;
          const inputData: Record<string, number> = {};
          if (anyMsg.up !== undefined) inputData.up = anyMsg.up;
          if (anyMsg.down !== undefined) inputData.down = anyMsg.down;
          if (anyMsg.left !== undefined) inputData.left = anyMsg.left;
          if (anyMsg.right !== undefined) inputData.right = anyMsg.right;
          if (anyMsg.forward !== undefined) inputData.forward = anyMsg.forward;
          if (anyMsg.backward !== undefined) inputData.backward = anyMsg.backward;
          (engine as any).applyInput(inputData);
          return;
        }
        
        if (anyMsg?.action && ['moveUp', 'moveDown', 'moveLeft', 'moveRight', 'moveForward', 'moveBackward', 'stop'].includes(anyMsg.action)) {
          const msg = anyMsg as TestEngineInput;
          const engine = gameManager.getEngine(msg.gameId);
          if (!engine) return;
          const inputData: Record<string, number> = {};
          switch (msg.action) {
            case 'moveUp': inputData.up = 1; break;
            case 'moveDown': inputData.down = 1; break;
            case 'moveLeft': inputData.left = 1; break;
            case 'moveRight': inputData.right = 1; break;
            case 'moveForward': inputData.forward = 1; break;
            case 'moveBackward': inputData.backward = 1; break;
            case 'stop': 
              inputData.up = 2; inputData.down = 2; inputData.left = 2; 
              inputData.right = 2; inputData.forward = 2; inputData.backward = 2;
              break;
          }
          (engine as any).applyInput(inputData);
          return;
        }
        
        const msg = anyMsg as ClientInput;
        const engine = gameManager.getEngine(msg.gameId);
        if (!engine) return;
        (engine as any).applyInputLegacy(msg.playerSide, msg.action);
      } catch {}
    });

    connection.socket.on('close', () => {
      for (const [gid, set] of Array.from(connections.entries())) {
        if (set.delete(connection.socket) && set.size === 0) {
          connections.delete(gid);
          const state: any = gameManager.getState(gid);
          if (!state || state.gameOver === true) {
            console.log('[WS] removing finished game after last socket closed', { gameId: gid });
            gameManager.remove(gid);
          }
        }
      }
    });
  });

  app.get('/test-ws', (req: any, reply: any) => {
    reply.send({ message: 'WebSocket routes are working' });
  });

  app.get('/test-ws-simple', { websocket: true }, (connection: any, req: any) => {
    connection.socket.send('Hello WebSocket!');
    connection.socket.close();
  });


  try {
    console.log('Registering /ws/room endpoint...');
    app.get('/ws/room', { websocket: true }, (connection: any, req: any) => {
    const url = new URL(req.url ?? '', 'http://localhost');
    const playerId = url.searchParams.get('playerId') ?? '';
    const roomId = url.searchParams.get('roomId') ?? '';
    
    if (!playerId) {
      connection.socket.send(JSON.stringify({ 
        type: 'room_error', 
        message: 'Missing playerId' 
      } satisfies RoomMessage));
      connection.socket.close();
      return;
    }

    playerConnections.set(playerId, connection.socket);

    if (roomId) {
      if (!roomConnections.has(roomId)) {
        roomConnections.set(roomId, new Set());
      }
      roomConnections.get(roomId)!.add(connection.socket);
    }

    const rooms = roomManager.listRooms();
    connection.socket.send(JSON.stringify({ 
      type: 'room_list', 
      rooms 
    } satisfies RoomMessage));

    connection.socket.on('message', (data: any) => {
      try {
        const raw = typeof data === 'string' ? data : (data?.toString?.() ?? '');
        if (!raw) return;
        const message = JSON.parse(raw);
        if (message.type === 'create_room') {
          const { name, ownerId, ownerUsername } = message;
          const room = roomManager.createRoom(ownerId, ownerUsername, name);
          if (!roomConnections.has(room.id)) {
            roomConnections.set(room.id, new Set());
          }
          roomConnections.get(room.id)!.add(connection.socket);
          broadcastToPlayer(playerId, { type: 'room_created', room });
        }

        if (message.type === 'join_room') {
          const { roomId, playerId, username } = message;
          const result = roomManager.joinRoom(roomId, playerId, username);
          
          if (result.success && result.room) {
            if (!roomConnections.has(roomId)) {
              roomConnections.set(roomId, new Set());
            }
            roomConnections.get(roomId)!.add(connection.socket);
            
            broadcastToRoom(roomId, { 
              type: 'room_joined', 
              room: result.room, 
              player: { id: playerId, username, ready: false } 
            });
          } else {
            broadcastToPlayer(playerId, { 
              type: 'room_error', 
              message: result.error || 'Failed to join room' 
            });
          }
        }

        if (message.type === 'leave_room') {
          const { playerId } = message;
          const result = roomManager.leaveRoom(playerId);
          
          if (result.success) {
            for (const [roomId, connections] of roomConnections.entries()) {
              connections.delete(connection.socket);
              if (connections.size === 0) {
                roomConnections.delete(roomId);
              }
            }
            
            if (result.room) {
              broadcastToRoom(result.room.id, { 
                type: 'room_left', 
                room: result.room, 
                playerId 
              });
            }
          }
        }

        if (message.type === 'player_ready') {
          const { playerId, ready } = message;
          const result = roomManager.setPlayerReady(playerId, ready);
          
          if (result.success && result.room) {
            broadcastToRoom(result.room.id, { 
              type: 'player_ready', 
              room: result.room, 
              playerId, 
              ready 
            });
          }
        }

        if (message.type === 'kick_player') {
          const { roomId, ownerId, targetPlayerId } = message;
          const result = roomManager.kickPlayer(roomId, ownerId, targetPlayerId);
          
          if (result.success && result.room) {
            const kickedConnection = playerConnections.get(targetPlayerId);
            if (kickedConnection) {
              roomConnections.get(roomId)?.delete(kickedConnection);
            }
            
            broadcastToRoom(roomId, { 
              type: 'player_kicked', 
              room: result.room, 
              playerId: targetPlayerId 
            });
            
            broadcastToPlayer(targetPlayerId, { 
              type: 'player_kicked', 
              room: result.room, 
              playerId: targetPlayerId 
            });
          }
        }

        if (message.type === 'start_game') {
          const { roomId, ownerId } = message;
          const result = roomManager.startGame(roomId, ownerId);
          
          if (result.success && result.room && result.gameId) {
            broadcastToRoom(roomId, { 
              type: 'game_started', 
              room: result.room, 
              gameId: result.gameId 
            });
          } else {
            broadcastToPlayer(playerId, { 
              type: 'room_error', 
              message: result.error || 'Failed to start game' 
            });
          }
        }

        if (message.type === 'get_rooms') {
          const rooms = roomManager.listRooms();
          broadcastToPlayer(playerId, { 
            type: 'room_list', 
            rooms 
          });
        }

      } catch (error) {
        console.error('Room WebSocket error:', error);
      }
    });

    connection.socket.on('close', () => {
      for (const [roomId, connections] of roomConnections.entries()) {
        connections.delete(connection.socket);
        if (connections.size === 0) {
          roomConnections.delete(roomId);
        }
      }
      
      playerConnections.delete(playerId);
    });
  });
  } catch (error) {
    console.error('Error registering /ws/room endpoint:', error);
    throw error;
  }
}


