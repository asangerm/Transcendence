import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { requireAuth, AuthUser } from "../../middleware/authMiddleware";
import fs from "fs";
import path from "path";

type AuthRequest = FastifyRequest & { user?: AuthUser };

interface UserAvatar {
  avatar_url?: string;
}

export default async function deleteUser(app: FastifyInstance) {
  app.delete("/users", { preHandler: [requireAuth] }, async (req: AuthRequest, reply: FastifyReply) => {
    try {
      if (!req.user) return reply.status(401).send({ error: true, message: "Unauthorized" });

      const userId = req.user.id;

      // Cast explicite pour TypeScript
      const existing = app.db
        .prepare("SELECT avatar_url FROM users WHERE id = ?")
        .get(userId) as UserAvatar | undefined;

      if (!existing) return reply.status(404).send({ error: true, message: "User not found" });

      // Transaction sécurisée : supprime toutes les données liées
      const transaction = app.db.transaction(() => {
        app.db.prepare("DELETE FROM friends WHERE user_id = ? OR friend_id = ?").run(userId, userId);
        app.db.prepare("DELETE FROM matches WHERE player1_id = ? OR player2_id = ?").run(userId, userId);
        app.db.prepare("DELETE FROM users WHERE id = ?").run(userId);
      });

      transaction();

      // Supprimer l’avatar (hors default.png)
      if (existing.avatar_url && !existing.avatar_url.includes("default.png")) {
        const oldPath = path.join(process.cwd(), existing.avatar_url.replace(/^\/+/g, ""));
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      app.log.info(`User ${userId} and related data deleted successfully!`);
      return reply.send({ success: true, message: "Utilisateur supprimé" });

    } catch (error: any) {
      app.log.error("Error deleting user:", error);
      return reply.status(500).send({ error: true, message: "Internal Server Error" });
    }
  });
}
