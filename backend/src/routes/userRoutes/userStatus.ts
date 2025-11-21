import { FastifyInstance } from "fastify";
import { requireAuth } from "../../middleware/authMiddleware";

export default async function userStatus(app: FastifyInstance) {
  app.post("/users/offline", { preHandler: [requireAuth] }, async (req: any, reply) => {
    const userId = req.user.id; // Utilise uniquement l'utilisateur connecté
    app.db.prepare("UPDATE users SET is_online = 0 WHERE id = ?").run(userId);
    return reply.send({ success: true });
  });
}
