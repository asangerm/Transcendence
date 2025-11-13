import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { requireAuth, AuthUser } from "../../middleware/authMiddleware";
import fs from "fs";
import path from "path";


type AuthRequest = FastifyRequest & { user?: AuthUser };

export default async function anonymizeUser(app: FastifyInstance) {
  app.post("/:id/anonymize", { preHandler: [requireAuth] }, async (req: AuthRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const userId = Number(id);

          //Vérifie que l'utilisateur est bien authentifié
      if (!req.user) {
        return reply.status(401).send({ error: true, message: "Unauthorized" });
      }

      // Vérifie que l'utilisateur essaie bien d'anonymiser son propre compte
      if (req.user.id !== userId) {
        return reply.status(403).send({ error: true, message: "You can only anonymize your own account" });
      }

      if (isNaN(userId)) {
        return reply.status(400).send({ error: true, message: "Invalid user ID" });
      }


    const existing = app.db.prepare("SELECT id FROM users WHERE id = ?").get(id);
    if (!existing) {
      return reply.status(404).send({ error: true, message: "User not found" });
    }

    const anonEmail = `anon_${id}@example.com`;
    const anonName = `anon_user_${id}`;
    const anonAvatar = "/uploads/default.png";

    const transaction = app.db.transaction(() => {
      // --- Anonymiser l'utilisateur ---
    const user = app.db
      .prepare("SELECT avatar_url FROM users WHERE id = ?")
      .get(req.user!.id) as { avatar_url?: string } | undefined;

    if (user?.avatar_url && !user.avatar_url.includes("default.png")) {
        const oldPath = path.join(process.cwd(), user.avatar_url.replace(/^\/+/g, ""));
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      app.db.prepare(
        `UPDATE users 
         SET email = ?, 
             display_name = ?, 
             avatar_url = ?, 
             is_online = 0,
             password_hash = NULL  
         WHERE id = ?`
      ).run(anonEmail, anonName, anonAvatar, id);

    });

    transaction();

    return reply.send({ success: true, message: "Utilisateur anonymisé avec succes" });
  });
}
