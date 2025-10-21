import { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { requireAuth } from "../../middleware/authMiddleware";

export default async function updatePassword(app: FastifyInstance) {
  app.put("/:id/password", { preHandler: [requireAuth] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const { oldPassword, newPassword } = req.body as { oldPassword: string; newPassword: string };

    // On récupère l'utilisateur, typé avec "as"
    const row = app.db.prepare("SELECT password_hash FROM users WHERE id = ?").get(id) as { password_hash: string } | undefined;
    if (!row) {
      return reply.status(404).send({ error: true, message: "User not found" });
    }

    const match = await bcrypt.compare(oldPassword, row.password_hash);
    if (!match) {
      return reply.status(400).send({ error: true, message: "Incorrect current password" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    app.db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hashed, id);

    return reply.send({ success: true, message: "Password updated successfully" });
  });
}
