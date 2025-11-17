import type { FastifyInstance } from "fastify";
import { requireAuth } from "../../middleware/authMiddleware";

export default async function logoutRoute(app: FastifyInstance) {
  app.post("/logout", { preHandler: [requireAuth] }, async (req: any, reply: any) => {
    const user = req.user;

    // Supprime le cookie
    reply.clearCookie("token", { path: "/" });

    // Met le statut hors ligne
    app.db.prepare("UPDATE users SET is_online = 0 WHERE id = ?").run(user.id);

    return reply.send({ success: true, message: "Deconnexion" });
  });
}
