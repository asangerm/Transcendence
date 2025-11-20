import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { loseBonus, matchmakingManager, winBonus } from '../../realtime/Matchmaking';

export default async function matchmakingRoutes(app: FastifyInstance) {
  app.post('/matchmaking/game2/search', async (req, reply) => {
    try {
      const body = await z.object({
        playerId: z.string().min(1),
        username: z.string().min(1)
      }).parseAsync((req as any).body);

      const gameRow = app.db.prepare("SELECT id FROM games WHERE name = ?").get('Game2') as { id?: number } | undefined;
      const game2Id = (gameRow && typeof gameRow.id === 'number') ? gameRow.id : 0;
      let wins = 0, defeats = 0;
      if (game2Id) {
        const w = app.db.prepare(`
          SELECT COUNT(*) AS c
          FROM matches
          WHERE game_id = ? AND winner_id = ?
        `).get(game2Id, Number(body.playerId)) as { c?: number } | undefined;
        wins = Number(w?.c || 0);
        const d = app.db.prepare(`
          SELECT COUNT(*) AS c
          FROM matches
          WHERE game_id = ?
            AND (player1_id = ? OR player2_id = ?)
            AND winner_id IS NOT NULL
            AND winner_id != ?
        `).get(game2Id, Number(body.playerId), Number(body.playerId), Number(body.playerId)) as { c?: number } | undefined;
        defeats = Number(d?.c || 0);
      }
      const elo = 400 + wins * winBonus + defeats * loseBonus;

      const res = matchmakingManager.joinGame2(body.playerId, body.username, elo);
      return res;
    } catch (error) {
      reply.code(400);
      return { error: 'Invalid request' };
    }
  });

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


