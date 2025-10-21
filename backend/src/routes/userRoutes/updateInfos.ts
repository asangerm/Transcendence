import { FastifyInstance } from "fastify";
import { requireAuth } from "../../middleware/authMiddleware";

export default async function updateUser(app: FastifyInstance) {
  app.put("/:id", { preHandler: [requireAuth] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const { name, email } = req.body as { name: string; email: string };

    const existing = app.db.prepare("SELECT id FROM users WHERE id = ?").get(id);
    if (!existing) return reply.status(404).send({ error: true, message: "User not found" });

    app.db.prepare("UPDATE users SET display_name = ?, email = ? WHERE id = ?").run(name, email, id);
    return reply.send({ success: true, message: "Profile updated" });
  });
}
