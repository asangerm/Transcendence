import { FastifyInstance } from "fastify";
import { requireAuth } from "../../middleware/authMiddleware";

export default async function listUsers(app: FastifyInstance) {
  app.get("/", { preHandler: [requireAuth] }, async (req, reply) => {
    const users = app.db
      .prepare("SELECT id, display_name AS name, email FROM users")
      .all();
    return reply.send({ success: true, users });
  });
}
