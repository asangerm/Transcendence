import { FastifyInstance } from "fastify";

export default async function deleteUser(app: FastifyInstance) {
  app.delete("/users/:id", async (req, reply) => {
    const { id } = req.params as { id: string };

    const existing = app.db.prepare("SELECT id FROM users WHERE id = ?").get(id);
    if (!existing) {
      return reply.status(404).send({ error: true, message: "User not found" });
    }

    app.db.prepare("DELETE FROM users WHERE id = ?").run(id);

    return reply.send({ success: true, message: "User deleted successfully" });
  });
}
