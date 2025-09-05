import { FastifyInstance } from "fastify";
import { requireAuth } from "../../middleware/auth";

export default async function getUserById(app: FastifyInstance) {
  app.get("/:id", { preHandler: [requireAuth] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const user = app.db
      .prepare("SELECT id, display_name AS name, email FROM users WHERE id = ?")
      .get(id);

    if (!user) return reply.status(404).send({ error: true, message: "User not found" });
    return reply.send({ success: true, user });
  });
}
