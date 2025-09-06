import { FastifyInstance } from "fastify";
import { requireAuth } from "../../middleware/authMiddleware";

export default async function logoutRoute(app: FastifyInstance) {
  app.post("/logout", { preHandler: [requireAuth] }, async (_, reply) => {
    reply.clearCookie("token", { path: "/" });
    return reply.send({ success: true, message: "Logged out" });
  });
}
