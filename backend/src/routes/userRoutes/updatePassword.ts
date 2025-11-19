import { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { requireAuth } from "../../middleware/authMiddleware";
import validateUser from "../../validators/validator";

export default async function updatePassword(app: FastifyInstance) {
  app.put("/password", { preHandler: [requireAuth] }, async (req: any, reply) => {
    const userId = req.user.id; //Utilisation de l’ID de l’utilisateur authentifié
    const { oldPassword, newPassword } = req.body as { oldPassword: string; newPassword: string };

    // Vérification du nouveau mot de passe
    try {
      // validateUser attend { name, email, password }, on passe des valeurs dummy pour name/email
      validateUser({ name: "dummy", email: "dummy@example.com", password: newPassword });
    } catch (err: any) {
      return reply.status(400).send({ error: true, message: err.message });
    }

    // Récupération du hash du mot de passe actuel
    const row = app.db
      .prepare("SELECT password_hash FROM users WHERE id = ?")
<<<<<<< Updated upstream
      .get(id) as { password_hash: string; google_id?: string  } | undefined;
=======
      .get(userId) as { password_hash: string } | undefined;

>>>>>>> Stashed changes
    if (!row) {
      return reply.status(404).send({ error: true, message: "Utilisateur non trouvé" });
    }

<<<<<<< Updated upstream
    if (row.google_id || !row.password_hash) {
      return reply.status(400).send({
        error: "Cannot change password for Google accounts"
      });
    }

=======
    // Vérification de l’ancien mot de passe
>>>>>>> Stashed changes
    const match = await bcrypt.compare(oldPassword, row.password_hash);
    if (!match) {
      return reply.status(400).send({ error: true, message: "Mot de passe actuel incorrect" });
    }

    // Hash du nouveau mot de passe et mise à jour
    const hashed = await bcrypt.hash(newPassword, 10);
    app.db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hashed, userId);

    return reply.send({ success: true, message: "Mot de passe mis à jour !" });
  });
}
