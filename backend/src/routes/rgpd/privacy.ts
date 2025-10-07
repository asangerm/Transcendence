import { FastifyInstance } from "fastify";

export default async function privacyRoute(app: FastifyInstance) {
  app.get("/privacy", async (_, reply) => {
    return reply.send({
      success: true,
      privacy_policy: "Nous respectons vos données personnelles conformément au RGPD.",
      rights: {
        access: "Consultez vos données via 'Profil",
        rectification: "Modifiez vos données via 'Profil' --> 'Modifier le profil'",
        anonymization: "Anonymisez vos données via 'Profil' --> 'Modifier le profil' --> 'Anonymiser mon compte'",
        erasure: "Supprimez définitivement votre compte via 'Profil' --> 'Modifier le profil' --> 'Supprimer mon compte'",
        portability: "Exportez vos données via 'Profil' --> 'Modifier le profil' --> 'Exporter mes données'"
      },
      contact: {
        dpo: "Mail : onievayoan@gmail.com / Tel : 06.28.32.27.46",
        help: "En cas de problème, contactez notre support.",
      },
    });
  });
}
