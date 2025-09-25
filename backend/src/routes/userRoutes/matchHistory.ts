import { FastifyInstance } from "fastify";
import { requireAuth } from "../../middleware/authMiddleware";

export default async function getUserMatchHistory(app: FastifyInstance) {
	app.get("/:id/matchHistory", { preHandler: [requireAuth] }, async (req, reply) => {
	  const { id } = req.params as { id: string };
	  
	  const matchHistory = app.db.prepare(`
		SELECT 
		  m.id,
		  g.name as game_name,
		  m.score_p1,
		  m.score_p2,
		  m.played_at,
		  m.player1_id,
		  m.player2_id,
		  m.winner_id,
		  CASE 
			WHEN m.player1_id = ? THEN u2.display_name
			ELSE u1.display_name
		  END as opponent_name,
		  CASE 
			WHEN m.player1_id = ? THEN m.player2_id
			ELSE m.player1_id
		  END as opponent_id
		FROM matches m
		JOIN games g ON m.game_id = g.id
		JOIN users u1 ON m.player1_id = u1.id
		JOIN users u2 ON m.player2_id = u2.id
		WHERE m.player1_id = ? OR m.player2_id = ?
		ORDER BY m.played_at DESC
	  `).all(id, id, id, id);
	  
	  return reply.send({ success: true, matches: matchHistory });
	});
  }