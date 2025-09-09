import { FastifyInstance } from "fastify";
import { requireAuth } from "../../middleware/auth";

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

    app.db.prepare(
      `UPDATE users 
       SET email = ?, 
           display_name = ?, 
           avatar_url = ?, 
           password_hash = NULL, 
           two_factor_secret = NULL, 
           two_factor_enabled = 0 
       WHERE id = ?`
    ).run(anonEmail, anonName, anonAvatar, id);

    return reply.send({ success: true, message: "User anonymized successfully" });
  });
}
