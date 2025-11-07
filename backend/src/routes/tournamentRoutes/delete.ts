import { FastifyInstance } from "fastify";
import { requireAuth } from "../../middleware/authMiddleware";

export default async function deleteTournament(app: FastifyInstance) {
	app.delete("/:tournamentId", { preHandler: [requireAuth] }, async (req, reply) => {
		try {
			const { tournamentId } = req.params as { tournamentId: string };

			// Vérifie que le tournoi existe
			const tournament = app.db
				.prepare("SELECT * FROM tournaments WHERE id = ?")
				.get(tournamentId);

			if (!tournament) {
				return reply.status(404).send({
					error: true,
					message: "Tournoi introuvable.",
				});
			}

			// Supprime les participants associés
			app.db.prepare("DELETE FROM participants WHERE tournament_id = ?").run(tournamentId);

			// Supprime les matchs associés
			app.db.prepare("DELETE FROM tournament_matches WHERE tournament_id = ?").run(tournamentId);

			// Supprime le tournoi
			app.db.prepare("DELETE FROM tournaments WHERE id = ?").run(tournamentId);

			return reply.send({
				success: true,
				message: "Tournoi supprimé avec succès.",
			});
		} catch (err) {
			console.error("Erreur suppression tournoi:", err);
			return reply.status(500).send({
				error: true,
				message: "Erreur interne lors de la suppression du tournoi.",
			});
		}
	});
}
