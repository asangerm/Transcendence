import { FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";

export interface AuthUser {
  id: number;
  email: string;
  username: string;
}

// Vérifie JWT depuis le cookie
export function requireAuth(request: FastifyRequest, reply: FastifyReply, done: Function) {
  try {
    const token = request.cookies.token;
    if (!token) {
      reply.status(401).send({ error: true, message: "Unauthorized" });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret") as AuthUser;
    (request as any).user = decoded;
    done();
  } catch {
    reply.status(401).send({ error: true, message: "Invalid token" });
  }
}
