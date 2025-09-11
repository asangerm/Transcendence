import { FastifyInstance } from "fastify";

export default async function privacyRoute(app: FastifyInstance) {
  app.get("/privacy", async (_, reply) => {
    return reply.send({
      success: true,
      privacy: {
        message: "Nous respectons vos données personnelles conformément au RGPD.",
        points: [
          "Vos données peuvent être consultées via /users/:id",
          "Vous pouvez les mettre à jour via PUT /users/:id",
          "Vous pouvez anonymiser votre compte via POST /users/:id/anonymize",
          "Vous pouvez supprimer définitivement votre compte via DELETE /users/:id",
        ],
      },
    });
  });
}
