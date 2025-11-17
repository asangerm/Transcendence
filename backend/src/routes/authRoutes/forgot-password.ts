import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { v4 as uuidv4 } from "uuid";
import { sendResetPasswordEmail } from "../../services/email.service";

interface UserRow {
  id: number;
  email: string;
}

export default async function forgotPasswordRoutes(app: FastifyInstance) {
  app.post("/forgot-password", async (request: FastifyRequest<{ Body: { email: string } }>, reply: FastifyReply) => {
    const { email } = request.body;

    if (!email) {
      return reply.status(400).send({ error: true, message: "Email requis" });
    }

    try {
      const userRaw = app.db.prepare("SELECT id, email FROM users WHERE email = ?").get(email);
      const user = userRaw as UserRow | undefined;

      if (!user) {
        return reply.send({ success: true, message: "Si un compte existe pour cet email, un lien a été envoyé." });
      }

      const resetToken = uuidv4();

      app.db.prepare("UPDATE users SET reset_token = ? WHERE id = ?").run(resetToken, user.id);

      const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

      await sendResetPasswordEmail(user.email, resetLink);

      return reply.send({ success: true, message: "Si un compte existe pour cet email, un lien a été envoyé a MAITRE SHERPA pour test." });
    } catch (err) {
      console.error("Erreur forgot-password:", err);
      return reply.status(500).send({ error: true, message: "Erreur interne" });
    }
  });
}
