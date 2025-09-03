import { FastifyInstance } from "fastify";

export default async function logoutRoute(app: FastifyInstance) {
  app.post("/logout", async (_, reply) => {
    reply.clearCookie("token", { path: "/" });
    return reply.send({ success: true, message: "Logged out" });
  });
}
