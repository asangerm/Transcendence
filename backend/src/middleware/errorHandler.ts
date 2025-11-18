import { FastifyError } from "fastify";

export function errorHandler(error: FastifyError, _request: any, reply: any) {
  const statusCode = error.statusCode || 500;

  reply.status(statusCode).send({
    error: true,
    message: error.message || "Internal Server Error",
  });
}
