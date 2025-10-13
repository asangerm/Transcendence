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
    if (!state) return reply.code(404).send({ message: 'Not found' });
    return state;
  });
}


