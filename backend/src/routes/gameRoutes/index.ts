import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { gameManager } from '../../realtime/GameManager';

export default async function gameRoutes(app: FastifyInstance) {
  app.get('/games', async () => {
    return { games: gameManager.list() };
  });

  app.post('/games', async (req, reply) => {
    const body = await z.object({ kind: z.enum(['pong', 'test']).default('pong') }).parseAsync((req as any).body ?? {});
    const { id } = gameManager.createGame(body.kind);
    reply.code(201);
    return { id };
  });

  app.get('/games/:id', async (req, reply) => {
    const id = (req.params as any).id as string;
    const state = gameManager.getState(id);
    if (!state) return reply.code(200).send({ message: 'Not found' });
    return state;
  });

  app.post('/games/:id/forfeit', async (req, reply) => {
    try {
      const params = await z.object({ id: z.string() }).parseAsync(req.params);
      const body = await z.object({ side: z.enum(['top', 'bottom']).optional() }).parseAsync((req as any).body ?? {});
      const state = gameManager.getState(params.id);
      if (!state) {
        reply.code(200);
        return { message: 'No game for this id' };
      }
      const side = body.side ?? 'top';
      const ok = gameManager.forfeit(params.id, side);
      if (!ok) {
        reply.code(400);
        return { error: 'Unsupported game' };
      }
      return { success: true };
    } catch {
      reply.code(400);
      return { error: 'Invalid request' };
    }
  });
}
