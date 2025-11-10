import { FastifyInstance } from "fastify";
import { requireAuth } from "../../middleware/authMiddleware";

export default async function cancelDuel(app: FastifyInstance) {
    app.post("/cancel-duel", { preHandler: [requireAuth] }, async (req: any, reply: any) => {
        try {
            const { duelRequestId } = req.body as { duelRequestId: number | string };
            const id = parseInt(String(duelRequestId), 10);
            if (!id || Number.isNaN(id)) {
                return reply.code(400).send({ error: true, message: "Identifiant de duel invalide" });
            }
            app.db.prepare("DELETE FROM duel_requests WHERE id = ?").run(id);
            return reply.send({ success: true, message: "Demande de duel annulée" });
        } catch {
            return reply.code(500).send({ error: true, message: "Erreur interne lors de l’annulation" });
        }
    });
}