import { FastifyInstance } from "fastify";
import { requireAuth } from "../../middleware/authMiddleware";

export default async function deleteUser(app: FastifyInstance) {
  app.delete("/:id", { preHandler: [requireAuth] }, async (req, reply) => {
    const { id } = req.params as { id: string };

    // Vérifie si l'utilisateur existe
    const existing = app.db.prepare("SELECT id FROM users WHERE id = ?").get(id);
    if (!existing) {
      return reply.status(404).send({ error: true, message: "User not found" });
    }

    // --- Suppression sécurisée après anonymisation ---
    const transaction = app.db.transaction(() => {
      // Supprimer les 2FA codes restants
      app.db.prepare("DELETE FROM two_factor_codes WHERE user_id = ?").run(id);

      // Supprimer les sessions
      app.db.prepare("DELETE FROM sessions WHERE user_id = ?").run(id);

      // Supprimer l'utilisateur anonymisé de la table users
      app.db.prepare("DELETE FROM users WHERE id = ?").run(id);
    });

    transaction();

    return reply.send({ success: true, message: "User permanently deleted from users table" });
  });
}
