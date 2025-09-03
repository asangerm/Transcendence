import { FastifyInstance } from "fastify";

export default async function listUsers(app: FastifyInstance) {
  app.get("/", async (req, reply) => {
    const users = app.db
      .prepare("SELECT id, display_name AS name, email FROM users")
      .all();
    return reply.send({ success: true, users });
  });
}
