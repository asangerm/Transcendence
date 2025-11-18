import { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { requireAuth } from "../../middleware/authMiddleware";
import validateUser from "../../validators/validator";

export default async function updatePassword(app: FastifyInstance) {
  app.put("/:id/password", { preHandler: [requireAuth] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const { oldPassword, newPassword } = req.body as { oldPassword: string; newPassword: string };

    // Vérifier que le nouveau mot de passe est valide
    try {
      // validateUser attend normalement { name, email, password }, donc on peut juste tester le mot de passe
      validateUser({ name: "dummy", email: "dummy@example.com", password: newPassword });
    } catch (err: any) {
      return reply.status(400).send({ error: true, message: err.message });
    }

    // On récupère l'utilisateur
    const row = app.db
      .prepare("SELECT password_hash FROM users WHERE id = ?")
      .get(id) as { password_hash: string; google_id?: string  } | undefined;
    if (!row) {
      return reply.status(404).send({ error: true, message: "Utilisateur non trouve" });
    }

    if (row.google_id || !row.password_hash) {
      return reply.status(400).send({
        error: "Cannot change password for Google accounts"
      });
    }

    const match = await bcrypt.compare(oldPassword, row.password_hash);
    if (!match) {
      return reply.status(400).send({ error: true, message: "Mot de passe actuel incorect" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    app.db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hashed, id);

    return reply.send({ success: true, message: "Mot de passe mis a jour !" });
  });
}
