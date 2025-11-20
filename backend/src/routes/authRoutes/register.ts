import { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import validateUser from "../../validators/validator";

export default async function registerRoute(app: FastifyInstance) {
  app.post("/register", async (req, reply) => {
    let validatedUser;
    try {
      validatedUser = validateUser(req.body);
    } catch (err: any) {
      return reply.status(400).send({ error: true, message: err.message });
    }

    const { name, email, password } = validatedUser;

    const existing = app.db
      .prepare("SELECT id FROM users WHERE email = ? OR display_name = ?")
      .get(email, name);
    if (existing) {
      return reply.status(409).send({ error: true, message: "Email ou nom d'utilisateur déjà pris" });
    }

    const hashed = await bcrypt.hash(password, 10);
    app.db
      .prepare("INSERT INTO users (email, display_name, password_hash) VALUES (?, ?, ?)")
      .run(email, name, hashed);

    return reply.status(201).send({ success: true, message: "Inscription réalisée avec succès" });
  });
}
