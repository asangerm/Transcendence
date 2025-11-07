import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { requireAuth, AuthUser } from "../../middleware/authMiddleware";

type AuthRequest = FastifyRequest & { user?: AuthUser };

export default async function deleteUser(app: FastifyInstance) {
  app.delete("/:id", { preHandler: [requireAuth] }, async (req: AuthRequest, reply: FastifyReply) => {
    try {
      const { id } = req.params as { id: string };
      const userId = Number(id);

      if (!req.user) {
        return reply.status(401).send({ error: true, message: "Unauthorized" });
      }

      if (isNaN(userId)) {
        return reply.status(400).send({ error: true, message: "Invalid user ID" });
      }

      // Vérifie si l'utilisateur existe
      const existing = app.db.prepare("SELECT id FROM users WHERE id = ?").get(userId);
      if (!existing) {
        return reply.status(404).send({ error: true, message: "User not found" });
      }

      console.log(`Starting deletion for user ID ${userId}...`);

      // Transaction sécurisée pour supprimer toutes les données liées
      const transaction = app.db.transaction(() => {
        console.log("Deleting two_factor_codes...");
        app.db.prepare("DELETE FROM two_factor_codes WHERE user_id = ?").run(userId);

        console.log("Deleting sessions...");
        app.db.prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);

        console.log("Deleting friends...");
        app.db.prepare("DELETE FROM friends WHERE user_id = ? OR friend_id = ?").run(userId, userId);

        console.log("Deleting friend_requests...");
        app.db.prepare("DELETE FROM friend_requests WHERE sender_id = ? OR receiver_id = ?").run(userId, userId);

        console.log("Deleting matches...");
        app.db.prepare("DELETE FROM matches WHERE player1_id = ? OR player2_id = ?").run(userId, userId);

        console.log("Deleting user...");
        app.db.prepare("DELETE FROM users WHERE id = ?").run(userId);
      });

      transaction();

      console.log(`User ${userId} and related data deleted successfully!`);
      return reply.send({ success: true, message: "User permanently deleted" });

    } catch (error: any) {
      console.error("Error deleting user:", error);
      console.error("Error stack:", error.stack);
      return reply.status(500).send({ error: true, message: "Internal Server Error" });
    }
  });
}
