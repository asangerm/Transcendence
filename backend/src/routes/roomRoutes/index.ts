import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { roomManager } from '../../realtime/RoomManager';
import type { GameKind } from '../../realtime/gameTypes';

export default async function roomRoutes(app: FastifyInstance) {
  // Create a new room
  app.post('/rooms', async (req, reply) => {
    try {
      const body = await z.object({
        name: z.string().min(1).max(50),
        ownerId: z.string(),
        ownerUsername: z.string(),
        gameType: z.enum(['pong', 'game2', 'test']).optional().default('pong')
      }).parseAsync((req as any).body);
      
      const room = roomManager.createRoom(body.ownerId, body.ownerUsername, body.name, body.gameType);
      reply.code(201);
      return room;
    } catch (error) {
      reply.code(400);
      return { error: 'Invalid request body' };
    }
  });

  // Join a room
  app.post('/rooms/:id/join', async (req, reply) => {
    try {
      const params = await z.object({
        id: z.string()
      }).parseAsync(req.params);
      
      const body = await z.object({
        playerId: z.string(),
        username: z.string()
      }).parseAsync((req as any).body);
      
      const result = roomManager.joinRoom(params.id, body.playerId, body.username);
      
      if (!result.success) {
        reply.code(400);
        return { error: result.error };
      }
      
      return result.room;
    } catch (error) {
      reply.code(400);
      return { error: 'Invalid request' };
    }
  });

  // Leave a room
  app.post('/rooms/:id/leave', async (req, reply) => {
    try {
      const params = await z.object({
        id: z.string()
      }).parseAsync(req.params);
      
      const body = await z.object({
        playerId: z.string()
      }).parseAsync((req as any).body);
      
      const result = roomManager.leaveRoom(body.playerId);
      
      if (!result.success) {
        reply.code(400);
        return { error: result.error };
      }
      
      return { success: true, room: result.room };
    } catch (error) {
      reply.code(400);
      return { error: 'Invalid request' };
    }
  });

  // Kick a player (room owner only)
  app.post('/rooms/:id/kick', async (req, reply) => {
    try {
      const params = await z.object({
        id: z.string()
      }).parseAsync(req.params);
      
      const body = await z.object({
        ownerId: z.string(),
        targetPlayerId: z.string()
      }).parseAsync((req as any).body);
      
      const result = roomManager.kickPlayer(params.id, body.ownerId, body.targetPlayerId);
      
      if (!result.success) {
        reply.code(400);
        return { error: result.error };
      }
      
      return { success: true, room: result.room };
    } catch (error) {
      reply.code(400);
      return { error: 'Invalid request' };
    }
  });

  // Set player ready status
  app.post('/rooms/:id/ready', async (req, reply) => {
    try {
      const params = await z.object({
        id: z.string()
      }).parseAsync(req.params);
      
      const body = await z.object({
        playerId: z.string(),
        ready: z.boolean()
      }).parseAsync((req as any).body);
      
      const result = roomManager.setPlayerReady(body.playerId, body.ready);
      
      if (!result.success) {
        reply.code(400);
        return { error: result.error };
      }
      
      return { success: true, room: result.room };
    } catch (error) {
      reply.code(400);
      return { error: 'Invalid request' };
    }
  });

  // Start the game (room owner only)
  app.post('/rooms/:id/start', async (req, reply) => {
    try {
      const params = await z.object({
        id: z.string()
      }).parseAsync(req.params);
      
      const body = await z.object({
        ownerId: z.string()
      }).parseAsync((req as any).body);
      
      const result = roomManager.startGame(params.id, body.ownerId);
      
      if (!result.success) {
        reply.code(400);
        return { error: result.error };
      }
      
      return { success: true, gameId: result.gameId, room: result.room };
    } catch (error) {
      reply.code(400);
      return { error: 'Invalid request' };
    }
  });

  // Get room details
  app.get('/rooms/:id', async (req, reply) => {
    try {
      const params = await z.object({
        id: z.string()
      }).parseAsync(req.params);
      
      const room = roomManager.getRoom(params.id);
      
      if (!room) {
        reply.code(404);
        return { error: 'Room not found' };
      }
      
      return room;
    } catch (error) {
      reply.code(400);
      return { error: 'Invalid request' };
    }
  });

  // List available rooms
  app.get('/rooms', async (req, reply) => {
    const query = req.query as { gameType?: GameKind };
    return { rooms: roomManager.listRooms(query.gameType) };
  });

  // Get player's current room
  app.get('/players/:playerId/room', async (req, reply) => {
    try {
      const params = await z.object({
        playerId: z.string()
      }).parseAsync(req.params);
      
      const room = roomManager.getPlayerRoom(params.playerId);
      
      if (!room) {
        reply.code(404);
        return { error: 'Player not in any room' };
      }
      
      return room;
    } catch (error) {
      reply.code(400);
      return { error: 'Invalid request' };
    }
  });
}
