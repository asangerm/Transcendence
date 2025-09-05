import { FastifyInstance } from "fastify";
import jwt from "jsonwebtoken";
import { requireAuth } from "../../middleware/auth";

export default async function meRoute(app: FastifyInstance) {
  app.get("/me", { preHandler: [requireAuth] }, async (req, reply) => {
    const { token } = req.cookies as { token?: string };
    if (!token) return reply.status(401).send({ error: true, message: "Not authenticated" });

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret") as {
        id: number;
        email: string;
        display_name: string;
      };
      return reply.send({ success: true, user: decoded });
    } catch {
      return reply.status(401).send({ error: true, message: "Invalid token" });
    }
  });
}
