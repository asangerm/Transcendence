import { FastifyInstance } from "fastify";
import { requireAuth } from "../../middleware/authMiddleware";

export default async function userStats(app: FastifyInstance) {
  app.get("/:id/stats", { preHandler: [requireAuth] }, async (req, reply) => {
    const { id } = req.params as { id: string };

    const stats = app.db
        .prepare(
			`SELECT 
				g.name AS game_name,
				m.game_id,
				SUM(CASE WHEN m.winner_id = ? THEN 1 ELSE 0 END) AS victories,
				SUM(CASE 
					WHEN (m.player1_id = ? OR m.player2_id = ?) 
						AND m.winner_id IS NOT NULL 
						AND m.winner_id != ? 
					THEN 1 ELSE 0 
					END) AS defeats
			FROM matches m
			JOIN games g ON g.id = m.game_id
			GROUP BY m.game_id`
		)
		.all(id, id, id, id);

    return reply.send({ success: true, stats });
  });
}

  