import { FastifyInstance } from "fastify";
import { requireAuth } from "../../middleware/authMiddleware";

export default async function deleteUser(app: FastifyInstance) {
  app.delete("/:id", { preHandler: [requireAuth] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const mode = (req.query as { mode?: string })?.mode;

    // Vérifie si l'utilisateur existe
    const existing = app.db.prepare("SELECT * FROM users WHERE id = ?").get(id);
    if (!existing) {
      return reply.status(404).send({ error: true, message: "User not found" });
    }

    if (mode === "hard") {
      // SUPPRESSION COMPLÈTE
      app.db.prepare("DELETE FROM users WHERE id = ?").run(id);
      return reply.send({ success: true, message: "User permanently deleted" });
    } else {
      // ANONYMISATION (safe)
      const anonEmail = `deleted_${id}@example.com`;
      const anonName = `DeletedUser${id}`;
      const anonAvatar = "/avatars/default.png";

      app.db.prepare(
        "UPDATE users SET email = ?, display_name = ?, avatar_url = ?, password_hash = NULL, two_factor_secret = NULL, two_factor_enabled = 0 WHERE id = ?"
      ).run(anonEmail, anonName, anonAvatar, id);

      return reply.send({ success: true, message: "User anonymized successfully" });
    }
  });
}

/* ATTENTION
/users/:id?mode=hard → supprime tout définitivement.
/users/:id sans query → anonymise email, pseudo, avatar, supprime mot de passe et 2FA.*/