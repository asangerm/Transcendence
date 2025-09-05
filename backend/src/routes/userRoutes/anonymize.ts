import { FastifyInstance } from "fastify";
import { requireAuth } from "../../middleware/auth";

export default async function anonymizeUser(app: FastifyInstance) {
  app.post("/:id/anonymize", { preHandler: [requireAuth] }, async (req, reply) => {
    const { id } = req.params as { id: string };

    const existing = app.db.prepare("SELECT id FROM users WHERE id = ?").get(id);
    if (!existing) return reply.status(404).send({ error: true, message: "User not found" });

    app.db
      .prepare("UPDATE users SET email = ?, display_name = ?, password_hash = ? WHERE id = ?")
      .run(`anon_${id}@example.com`, `anon_user_${id}`, "", id);

    return reply.send({ success: true, message: "User anonymized" });
  });
}
