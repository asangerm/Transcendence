import { FastifyInstance } from "fastify";

export default async function privacyRoute(app: FastifyInstance) {
  app.get("/privacy", async (_, reply) => {
    return reply.send({
      success: true,
      privacy_policy: "Nous respectons vos données personnelles conformément au RGPD.",
      rights: {
        access: "Consultez vos données via GET /users/:id",
        rectification: "Modifiez vos données via PUT /users/:id",
        anonymization: "Anonymisez vos données via POST /users/:id/anonymize",
        erasure: "Supprimez définitivement votre compte via DELETE /users/:id",
        portability: "Export de vos données (non encore implémenté)",
      },
      contact: {
        dpo: "privacy@tonapp.com",
        help: "En cas de problème, contactez notre support.",
      },
    });
  });
}
