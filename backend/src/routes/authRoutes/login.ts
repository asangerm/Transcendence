import { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export default async function loginRoute(app: FastifyInstance) {
  app.post("/login", async (req, reply) => {
    const { email, password } = req.body as { email: string; password: string };

    const user = app.db.prepare("SELECT * FROM users WHERE email = ?").get(email) as
      | { id: number; email: string; display_name: string; password_hash: string; google_id?: string }
      | undefined;

    if (!user) return reply.status(401).send({ error: true, message: "Email ou mot de passe invalide" });

    // Vérifier si c'est un compte Google avant bcrypt.compare()
    if (user.google_id || !user.password_hash) {
      return reply.status(400).send({
        error: true,
        message: "Ce compte utilise Google. Veuillez vous connecter avec Google."
      });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return reply.status(401).send({ error: true, message: "Email ou mot de passe invalide" });

    app.db.prepare("UPDATE users SET is_online = 1 WHERE id = ?").run(user.id);

    const token = jwt.sign(
      { id: user.id, email: user.email, display_name: user.display_name },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "1h" }
    );

    reply.setCookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60,
    });

    return reply.send({ success: true, message: "Connexion succes" });
  });
}
