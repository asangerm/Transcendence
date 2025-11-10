import { FastifyInstance } from "fastify";
import { requireAuth } from "../../middleware/authMiddleware";

export default async function getDuels(app: FastifyInstance) {
	app.get("/duels/:userId", { preHandler: [requireAuth] }, async (req: any, reply: any) => {
		try {
			const { userId } = req.params as { userId: string };
			const id = parseInt(userId, 10);
			if (Number.isNaN(id)) {
				return reply.code(400).send({ error: true, message: "Identifiant utilisateur invalide" });
			}
			const duels = app.db
				.prepare("SELECT * FROM duel_requests WHERE requester_id = ? OR challenged_id = ? ORDER BY created_at DESC")
				.all(id, id);
			return reply.send({ success: true, duels });
		} catch {
			return reply.code(500).send({ error: true, message: "Erreur interne lors du chargement des duels" });
		}
	});
}