import { FastifyInstance } from "fastify";
import { requireAuth } from "../../middleware/authMiddleware";

export default async function exportData(app: FastifyInstance & { db: any }) {
  app.get("/:id/export", { preHandler: [requireAuth] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const userId = Number(id);

    try {
      // Vérification de l'utilisateur
      const user = app.db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
      if (!user) return reply.status(404).send({ error: "Utilisateur introuvable" });

      // Récupération des données associées
      const friends = app.db.prepare("SELECT * FROM friends WHERE user_id = ? OR friend_id = ?").all(userId, userId);
      const matches = app.db.prepare("SELECT * FROM matches WHERE player1_id = ? OR player2_id = ?").all(userId, userId);
      const friendRequests = app.db.prepare("SELECT * FROM friend_requests WHERE sender_id = ? OR receiver_id = ?").all(userId, userId);

      // Assemblage de l’export
      const exportData = {
        generated_at: new Date().toISOString(),
        user,
        related_data: { friends, friend_requests: friendRequests, matches },
      };

      const fileName = `user_${userId}_export_${Date.now()}.json`;

      // Envoi en Buffer pour que le front puisse créer un Blob
      reply
        .header("Content-Type", "application/json")
        .header("Content-Disposition", `attachment; filename="${fileName}"`)
        .send(Buffer.from(JSON.stringify(exportData, null, 2)));
    } catch (error) {
      console.error("Erreur lors de l'export RGPD :", error);
      return reply.status(500).send({ error: "Erreur lors de l'export des données utilisateur." });
    }
  });
}
