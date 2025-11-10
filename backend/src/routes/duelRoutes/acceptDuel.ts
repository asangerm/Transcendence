import { FastifyInstance } from "fastify";
import { requireAuth } from "../../middleware/authMiddleware";
import { roomManager } from "../../realtime/RoomManager";

export default async function acceptDuel(app: FastifyInstance) {
    app.post("/accept-duel", { preHandler: [requireAuth] }, async (req: any, reply: any) => {
        try {
            const { duelRequestId } = req.body;
            const duel = app.db
                .prepare("SELECT id, requester_id, requester_username, challenged_id, challenged_username FROM duel_requests WHERE id = ?")
                .get(duelRequestId) as any;
            if (!duel) return reply.send({ error: true, message: "Duel introuvable" });
            app.db.prepare("DELETE FROM duel_requests WHERE id = ?").run(duelRequestId);

            const ownerId = String(duel.requester_id);
            const ownerUsername = duel.requester_username as string;
            const challengedId = String(duel.challenged_id);
            const challengedUsername = duel.challenged_username as string;

            const room = roomManager.createRoom(ownerId, ownerUsername, `${ownerUsername} vs ${challengedUsername}`, 'pong');
            if (!room) {
                return reply.code(500).send({ error: true, message: "Erreur lors de la création de la salle de jeu" });
            }
            roomManager.joinRoom(room.id, challengedId, challengedUsername);
            roomManager.setPlayerReady(ownerId, true);
            roomManager.setPlayerReady(challengedId, true);

            console.log('[ROOM] room created', { room });

            return reply.send({ success: true, message: "Demande de duel acceptée", room });
        } catch (error: any) {
            return reply.code(500).send({ error: true, message: "Erreur interne lors de l’acceptation" });
        }
    });
}