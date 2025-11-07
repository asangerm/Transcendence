import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { matchmakingManager } from '../../realtime/Matchmaking';

export default async function matchmakingRoutes(app: FastifyInstance) {
  // Rejoindre la file de matchmaking pour game2
  app.post('/matchmaking/game2/search', async (req, reply) => {
    try {
      const body = await z.object({
        playerId: z.string().min(1),
        username: z.string().min(1)
      }).parseAsync((req as any).body);

      const res = matchmakingManager.joinGame2(body.playerId, body.username);
      return res;
    } catch (error) {
      reply.code(400);
      return { error: 'Invalid request' };
    }
  });

  // Annuler la recherche
  app.post('/matchmaking/cancel', async (req, reply) => {
    try {
      const body = await z.object({
        playerId: z.string().min(1)
      }).parseAsync((req as any).body);

      return matchmakingManager.cancel(body.playerId);
    } catch (error) {
      reply.code(400);
      return { error: 'Invalid request' };
    }
  });

  // Interroger le statut
  app.get('/matchmaking/status/:playerId', async (req, reply) => {
    try {
      const params = await z.object({ playerId: z.string() }).parseAsync(req.params);
      return matchmakingManager.status(params.playerId);
    } catch (error) {
      reply.code(400);
      return { error: 'Invalid request' };
    }
  });
}


