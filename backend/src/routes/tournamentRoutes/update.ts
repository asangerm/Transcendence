import { FastifyInstance } from "fastify";
import { requireAuth } from "../../middleware/authMiddleware";
import { Match, updateMatchTournament } from "../../services/tournament.service";

export default async function updateMatch(app: FastifyInstance) {
	app.put("/update", { preHandler: [requireAuth] }, async (req, reply) => {
		const matchInfos = req.body as Match;
		updateMatchTournament(app.db, matchInfos);
	});
}