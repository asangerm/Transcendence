import { FastifyInstance } from "fastify";
import { requireAuth } from "../../middleware/authMiddleware";

export interface Tournament {
	id: number;
	name: string;
	gameId: string;
	status: string;
	started_at: Date;
	created_at: Date;
}

export default async function getOngoingTournament(app: FastifyInstance) {
	app.get("/:creatorId", { preHandler: [requireAuth] }, async (req, reply) => {
		try {
			const { creatorId } = req.params as { creatorId: string };

			const tournament = app.db
				.prepare(`
					SELECT 
						id, name, status, started_at, created_at
					FROM tournaments
					WHERE creator_id = ? AND status = 'ongoing'
					LIMIT 1
				`)
				.get(creatorId) as Tournament | undefined;

			if (!tournament) {
				return reply.send({
					error: true,
					message: "No ongoing tournament found for this user.",
					data: null,
				});
			}

			const matches = app.db
				.prepare(`
					SELECT
						m.id,
						m.round,
						m.match_number,
						m.player1_id,
						p1.name AS player1_name,
						m.player2_id,
						p2.name AS player2_name,
						m.winner_id,
						winner.name AS winner_name,
						m.next_match_id
					FROM tournament_matches m
					LEFT JOIN participants p1 ON m.player1_id = p1.id
					LEFT JOIN participants p2 ON m.player2_id = p2.id
					LEFT JOIN participants winner ON m.winner_id = winner.id
					WHERE m.tournament_id = ?
					ORDER BY m.round DESC, m.match_number ASC
				`)
				.all(tournament.id);

			return reply.send({
				success: true,
				data: {
					tournament,
					matches,
				},
			});
		} catch (err) {
			console.error("Error fetching tournament:", err);
			return reply.status(500).send({
				error: true,
				message: "An unexpected error occurred while fetching the tournament.",
			});
		}
	});
}