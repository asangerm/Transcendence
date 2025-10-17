// Use untyped imports to avoid type resolution issues
declare const require: any;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const websocket = require('@fastify/websocket');
type FastifyInstance = any;
import { gameManager } from './GameManager';
import { roomManager } from './RoomManager';
import { Game2SimpleEngine } from './Game2SimpleEngine';

import type { ClientInput, ClientPaddleUpdate, TestEngineInput, RealtimeMessage, RoomMessage } from './gameTypes';

export async function registerRealtime(app: FastifyInstance) {
  console.log('Registering WebSocket routes...');

  const connections = new Map<string, Set<any>>();
  const roomConnections = new Map<string, Set<any>>(); // roomId -> Set of connections
  const playerConnections = new Map<string, any>(); // playerId -> connection

  const broadcastState = (gameId: string) => {
    const engine = gameManager.getEngine(gameId);
    if (!engine) return;
    const stateMsg: RealtimeMessage = { type: 'state', state: engine.getState() };
    const subs = connections.get(gameId);
    if (!subs) return;
    const payload = JSON.stringify(stateMsg);
    for (const ws of subs) {
      try { ws.send(payload); } catch {}
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
        // Connection might be closed, remove it
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
        // Connection might be closed, remove it
        playerConnections.delete(playerId);
      }
    }
  };

  // Update loop and broadcast ~120fps for very smooth ball updates
  setInterval(() => {
    gameManager.tickAll();
    for (const gameId of connections.keys()) broadcastState(gameId);
  }, 8);

  app.get('/ws', { websocket: true }, (connection: any, req: any) => {
    const url = new URL(req.url ?? '', 'http://localhost');
    const gameId = url.searchParams.get('gameId') ?? '';
    if (!gameId) {
      connection.socket.send(JSON.stringify({ type: 'error', message: 'Missing gameId' } satisfies RealtimeMessage));
      connection.socket.close();
      return;
    }

    if (!connections.has(gameId)) connections.set(gameId, new Set());
    connections.get(gameId)!.add(connection.socket);

    connection.socket.send(JSON.stringify({ type: 'hello', serverTime: Date.now() } as RealtimeMessage));

    connection.socket.on('message', (data: any) => {
      try {
        const raw = typeof data === 'string' ? data : (data?.toString?.() ?? '');
        if (!raw) return;
        const anyMsg = JSON.parse(raw);
        
        // --- Gère la création de jeu ---
        if (anyMsg?.type === 'create_game' && anyMsg?.gameId && anyMsg?.kind) {
            const game = gameManager.createGame(anyMsg.kind);
            console.log(`Jeu créé: ${game.id}`);
            
            // Envoyer l'état initial du jeu
            const state = gameManager.getState(game.id);
            if (state) {
                connection.socket.send(JSON.stringify({ 
                    type: 'state', 
                    state: state 
                } satisfies RealtimeMessage));
            }
            return;
        }

        // --- Gère notre Game2SimpleEngine ---
        if (anyMsg?.gameId && anyMsg?.type === 'input' && anyMsg?.playerId) {
            const engine = gameManager.getEngine(anyMsg.gameId);
            if (!engine) return;

            if (engine instanceof Game2SimpleEngine) {
                engine.applyInput(anyMsg.playerId, anyMsg.action);
                return;
            }
        }
  
        // Handle paddle position updates (Pong specific)
        if (anyMsg?.type === 'paddle') {
          const msg = anyMsg as ClientPaddleUpdate;
          const engine = gameManager.getEngine(msg.gameId);
          if (!engine) return;
          // Cast to PongEngine to access setPaddleX method
          (engine as any).setPaddleX(msg.playerSide, msg.x);
          return;
        }
        
        // Handle pong engine inputs (new JSON format)
        if (anyMsg?.gameId && anyMsg?.type === 'input') {
          const engine = gameManager.getEngine(anyMsg.gameId);
          if (!engine) return;
          
          // Handle paddle input for specific side
          if (anyMsg.side && (anyMsg.left !== undefined || anyMsg.right !== undefined)) {
            const input = {
              left: anyMsg.left || 0,
              right: anyMsg.right || 0
            };
            (engine as any).setInput(anyMsg.side, input);
          }
          return;
        }
        
        // Handle test engine inputs (new JSON format)
        if (anyMsg?.gameId && (anyMsg?.up !== undefined || anyMsg?.down !== undefined || 
            anyMsg?.left !== undefined || anyMsg?.right !== undefined || 
            anyMsg?.forward !== undefined || anyMsg?.backward !== undefined)) {
          const engine = gameManager.getEngine(anyMsg.gameId);
          if (!engine) return;
          // Extract input data (exclude gameId)
          const inputData: Record<string, number> = {};
          if (anyMsg.up !== undefined) inputData.up = anyMsg.up;
          if (anyMsg.down !== undefined) inputData.down = anyMsg.down;
          if (anyMsg.left !== undefined) inputData.left = anyMsg.left;
          if (anyMsg.right !== undefined) inputData.right = anyMsg.right;
          if (anyMsg.forward !== undefined) inputData.forward = anyMsg.forward;
          if (anyMsg.backward !== undefined) inputData.backward = anyMsg.backward;
          // Cast to TestEngine to access applyInput method
          (engine as any).applyInput(inputData);
          return;
        }
        
        // Handle legacy test engine inputs (fallback)
        if (anyMsg?.action && ['moveUp', 'moveDown', 'moveLeft', 'moveRight', 'moveForward', 'moveBackward', 'stop'].includes(anyMsg.action)) {
          const msg = anyMsg as TestEngineInput;
          const engine = gameManager.getEngine(msg.gameId);
          if (!engine) return;
          // Convert legacy action to new format
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
        
        // Fallback: legacy pong action messages
        const msg = anyMsg as ClientInput;
        const engine = gameManager.getEngine(msg.gameId);
        if (!engine) return;
        // Cast to PongEngine to access legacy applyInput method
        (engine as any).applyInputLegacy(msg.playerSide, msg.action);
      } catch {}
    });

    connection.socket.on('close', () => {
      connections.get(gameId)?.delete(connection.socket);
    });
  });

  // Test regular HTTP route first
  app.get('/test-ws', (req: any, reply: any) => {
    reply.send({ message: 'WebSocket routes are working' });
  });

  // Test simple WebSocket route
  app.get('/test-ws-simple', { websocket: true }, (connection: any, req: any) => {
    connection.socket.send('Hello WebSocket!');
    connection.socket.close();
  });


  // Room WebSocket endpoint
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

    // Store player connection
    playerConnections.set(playerId, connection.socket);

    // If joining a specific room, add to room connections
    if (roomId) {
      if (!roomConnections.has(roomId)) {
        roomConnections.set(roomId, new Set());
      }
      roomConnections.get(roomId)!.add(connection.socket);
    }

    // Send initial room list
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

        // Handle room creation
        if (message.type === 'create_room') {
          const { name, ownerId, ownerUsername } = message;
          const room = roomManager.createRoom(ownerId, ownerUsername, name);
          
          // Add connection to room
          if (!roomConnections.has(room.id)) {
            roomConnections.set(room.id, new Set());
          }
          roomConnections.get(room.id)!.add(connection.socket);
          
          // Broadcast to all players
          broadcastToPlayer(playerId, { type: 'room_created', room });
        }

        // Handle room joining
        if (message.type === 'join_room') {
          const { roomId, playerId, username } = message;
          const result = roomManager.joinRoom(roomId, playerId, username);
          
          if (result.success && result.room) {
            // Add connection to room
            if (!roomConnections.has(roomId)) {
              roomConnections.set(roomId, new Set());
            }
            roomConnections.get(roomId)!.add(connection.socket);
            
            // Broadcast to room
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

        // Handle leaving room
        if (message.type === 'leave_room') {
          const { playerId } = message;
          const result = roomManager.leaveRoom(playerId);
          
          if (result.success) {
            // Remove from room connections
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

        // Handle player ready status
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

        // Handle kicking player
        if (message.type === 'kick_player') {
          const { roomId, ownerId, targetPlayerId } = message;
          const result = roomManager.kickPlayer(roomId, ownerId, targetPlayerId);
          
          if (result.success && result.room) {
            // Remove kicked player from room connections
            const kickedConnection = playerConnections.get(targetPlayerId);
            if (kickedConnection) {
              roomConnections.get(roomId)?.delete(kickedConnection);
            }
            
            broadcastToRoom(roomId, { 
              type: 'player_kicked', 
              room: result.room, 
              playerId: targetPlayerId 
            });
            
            // Notify kicked player
            broadcastToPlayer(targetPlayerId, { 
              type: 'player_kicked', 
              room: result.room, 
              playerId: targetPlayerId 
            });
          }
        }

        // Handle starting game
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

        // Handle room list request
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
      // Remove from all room connections
      for (const [roomId, connections] of roomConnections.entries()) {
        connections.delete(connection.socket);
        if (connections.size === 0) {
          roomConnections.delete(roomId);
        }
      }
      
      // Remove player connection
      playerConnections.delete(playerId);
    });
  });
  } catch (error) {
    console.error('Error registering /ws/room endpoint:', error);
    throw error;
  }
}


