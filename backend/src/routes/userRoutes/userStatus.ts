import { FastifyInstance } from "fastify";

export default async function userStatus(app: FastifyInstance) {
  app.post("/users/:id/offline", async (req, reply) => {
    const { id } = req.params as { id: string };
    app.db.prepare("UPDATE users SET is_online = 0 WHERE id = ?").run(id);
    return reply.send({ success: true });
  });
}
