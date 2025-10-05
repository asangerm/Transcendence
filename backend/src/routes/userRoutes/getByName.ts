import { FastifyInstance } from "fastify";
import { requireAuth } from "../../middleware/authMiddleware";

export default async function getUserByName(app: FastifyInstance) {
  app.get("/name/:username", { preHandler: [requireAuth] }, async (req, reply) => {
    const { username } = req.params as { username: string };
    const user = app.db
      .prepare("SELECT id, display_name, email FROM users WHERE display_name = ?")
      .get(username);

    if (!user) return reply.status(404).send({ error: true, message: "User not found" });
    return reply.send({ success: true, user });
  });
}
