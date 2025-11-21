import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { requireAuth, AuthUser } from "../../middleware/authMiddleware";
import fs from "fs";
import path from "path";

type AuthRequest = FastifyRequest & { user?: AuthUser };

export default async function anonymizeUser(app: FastifyInstance) {
  app.post("/anonymize", { preHandler: [requireAuth] }, async (req: AuthRequest, reply: FastifyReply) => {
    if (!req.user) {
      return reply.status(401).send({ error: true, message: "Unauthorized" });
    }

    const userId = req.user.id;

    const existing = app.db.prepare("SELECT id FROM users WHERE id = ?").get(userId);
    if (!existing) {
      return reply.status(404).send({ error: true, message: "User not found" });
    }

    const anonEmail = `anon_${userId}@example.com`;
    const anonName = `anon_user_${userId}`;
    const anonAvatar = "/uploads/default.png";

    const transaction = app.db.transaction(() => {
      // Récupérer avatar existant
      const user = app.db
        .prepare("SELECT avatar_url FROM users WHERE id = ?")
        .get(userId) as { avatar_url?: string } | undefined;

      if (user?.avatar_url && !user.avatar_url.includes("default.png")) {
        const oldPath = path.join(process.cwd(), user.avatar_url.replace(/^\/+/g, ""));
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      // Anonymiser l’utilisateur
      app.db.prepare(
        `UPDATE users 
         SET email = ?, 
             display_name = ?, 
             avatar_url = ?, 
             is_online = 0,
             password_hash = NULL  
         WHERE id = ?`
      ).run(anonEmail, anonName, anonAvatar, userId);
    });

    transaction();

    return reply.send({ success: true, message: "Utilisateur anonymisé avec succès" });
  });
}
