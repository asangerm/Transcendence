import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { requireAuth, AuthUser } from "../../middleware/authMiddleware";
import fs from "fs";
import path from "path";


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

      // Empêche un utilisateur de supprimer quelqu’un d’autre
      if (req.user.id !== userId) {
        return reply.status(403).send({ error: true, message: "Forbidden: cannot delete another user" });
      }

      // Vérifie si l'utilisateur existe
      const existing = app.db.prepare("SELECT id FROM users WHERE id = ?").get(userId);
      if (!existing) {
        return reply.status(404).send({ error: true, message: "User not found" });
      }

      app.log.info(`Starting deletion for user ID ${userId}...`);

      // Transaction sécurisée pour supprimer toutes les données liées
      const transaction = app.db.transaction(() => {
        app.log.info("Deleting user...");
        app.db.prepare("DELETE FROM users WHERE id = ?").run(userId);
      });

      const user = app.db
        .prepare("SELECT avatar_url FROM users WHERE id = ?")
        .get(req.user.id) as { avatar_url?: string } | undefined;

      if (user?.avatar_url && !user.avatar_url.includes("default.png")) {
        const oldPath = path.join(process.cwd(), user.avatar_url.replace(/^\/+/g, ""));
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      transaction();

      app.log.info(`User ${userId} and related data deleted successfully!`);
      return reply.send({ success: true, message: "Utilisateur supprimé" });

    } catch (error: any) {
      app.log.error("Error deleting user:", error);
      return reply.status(500).send({ error: true, message: "Internal Server Error" });
    }
  });
}
