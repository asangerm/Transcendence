import { FastifyInstance } from "fastify";
import { requireAuth } from "../../middleware/authMiddleware";

export default async function sendDuel(app: FastifyInstance) {
  app.post("/send-duel", { preHandler: [requireAuth] }, async (req: any, reply: any) => {
    try {
      const authUserId = (req as any).user?.id;
      const { challengedId } = req.body as { challengedId: number | string };
      const requesterId = parseInt(String(authUserId), 10);
      const challengedIdNum = parseInt(String(challengedId), 10);

      if (!requesterId || Number.isNaN(requesterId)) {
        return reply.code(401).send({ error: true, message: "Non autorisé" });
      }
      if (!challengedId || Number.isNaN(challengedIdNum)) {
        return reply.code(400).send({ error: true, message: "Identifiant de l’adversaire invalide" });
      }
      if (requesterId === challengedIdNum) {
        return reply.send({ error: true, message: "Vous ne pouvez pas vous défier vous-même" });
      }

      const requester = app.db.prepare("SELECT * FROM users WHERE id = ?").get(requesterId) as any;
      const challenged = app.db.prepare("SELECT * FROM users WHERE id = ?").get(challengedIdNum) as any;
      if (!requester) {
        return reply.send({ error: true, message: "Demandeur introuvable" });
      }
      if (!challenged) {
        return reply.send({ error: true, message: "Adversaire introuvable" });
      }
      if (!requester.display_name || !challenged.display_name) {
        return reply.code(400).send({ error: true, message: "Profils utilisateurs invalides" });
      }

      const existing = app.db
        .prepare("SELECT id FROM duel_requests WHERE requester_id = ? AND status = 'pending'")
        .get(requesterId) as any;
      if (existing) {
        return reply.send({ error: true, message: "Vous avez déjà une demande de duel en attente" });
      }

      try {
        app.db
          .prepare("INSERT INTO duel_requests (requester_id, requester_username, challenged_id, challenged_username) VALUES (?, ?, ?, ?)")
          .run(requesterId, requester.display_name, challengedIdNum, challenged.display_name);
      } catch (e: any) {
        app.log.error({ err: e }, "Erreur SQL insert duel_requests");
        return reply.code(500).send({ error: true, message: "Erreur base de données: " + (e?.message || '') });
      }
      return reply.send({ success: true, message: "Demande de duel envoyée" });
    } catch (error: any) {
      return reply.code(500).send({ error: true, message: "Erreur interne lors de l’envoi de la demande" + error.message });
    }
  });
}