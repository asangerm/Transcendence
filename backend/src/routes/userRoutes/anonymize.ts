import { FastifyInstance } from "fastify";
import { requireAuth } from "../../middleware/authMiddleware";

export default async function anonymizeUser(app: FastifyInstance) {
  app.post("/:id/anonymize", { preHandler: [requireAuth] }, async (req, reply) => {
    const { id } = req.params as { id: string };

    const existing = app.db.prepare("SELECT id FROM users WHERE id = ?").get(id);
    if (!existing) {
      return reply.status(404).send({ error: true, message: "User not found" });
    }

    const anonEmail = `anon_${id}@example.com`;
    const anonName = `anon_user_${id}`;
    const anonAvatar = "/avatars/default.png";

    const transaction = app.db.transaction(() => {
      // --- Anonymiser l'utilisateur ---
      app.db.prepare(
        `UPDATE users 
         SET email = ?, 
             display_name = ?, 
             avatar_url = ?, 
             password_hash = NULL,  
         WHERE id = ?`
      ).run(anonEmail, anonName, anonAvatar, id);

      // --- Anonymiser friend requests ---
      app.db.prepare(
        `UPDATE friend_requests 
         SET sender_id = NULL, receiver_id = NULL, status = 'deleted' 
         WHERE sender_id = ? OR receiver_id = ?`
      ).run(id, id);

      // --- Supprimer relations d’amis ---
      app.db.prepare("DELETE FROM friends WHERE user_id = ? OR friend_id = ?").run(id, id);

      // --- Anonymiser high scores ---
      app.db.prepare("UPDATE high_scores SET user_id = NULL WHERE user_id = ?").run(id);

      // --- Anonymiser matchs ---
      app.db.prepare(
        `UPDATE matches 
         SET player1_id = CASE WHEN player1_id = ? THEN NULL ELSE player1_id END,
             player2_id = CASE WHEN player2_id = ? THEN NULL ELSE player2_id END,
             winner_id  = CASE WHEN winner_id  = ? THEN NULL ELSE winner_id END
         WHERE player1_id = ? OR player2_id = ? OR winner_id = ?`
      ).run(id, id, id, id, id, id);

      // --- Anonymiser tournaments ---
      app.db.prepare("UPDATE tournaments SET winner_id = NULL WHERE winner_id = ?").run(id);
    });

    transaction();

    return reply.send({ success: true, message: "User anonymized successfully" });
  });
}
