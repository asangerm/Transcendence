import { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import validateUser from "../../validators/validator";
import jwt from "jsonwebtoken";

export default async function registerRoute(app: FastifyInstance) {
  app.post("/register", async (req, reply) => {
    let validatedUser;
    try {
      validatedUser = validateUser(req.body);
    } catch (err: any) {
      return reply.status(400).send({ error: true, message: err.message });
    }

    const { name, email, password } = validatedUser;

    // Vérifier uniquement l'email
    const existingEmail = app.db
      .prepare("SELECT id FROM users WHERE email = ?")
      .get(email);

    if (existingEmail) {
      return reply.status(409).send({ error: true, message: "Cet email est déjà utilisé." });
    }

    // Vérifier uniquement le pseudonyme
    const existingName = app.db
      .prepare("SELECT id FROM users WHERE display_name = ?")
      .get(name);

    if (existingName) {
      return reply.status(409).send({ error: true, message: "Ce nom d'utilisateur est déjà pris." });
    }

    const hashed = await bcrypt.hash(password, 10);
    app.db
      .prepare("INSERT INTO users (email, display_name, password_hash) VALUES (?, ?, ?)")
      .run(email, name, hashed);

    const user = app.db.prepare("SELECT * FROM users WHERE email = ?").get(email) as { id: number; email: string; display_name: string };
    
    if (!user) {
      return reply.status(400).send({ error: true, message: "Erreur lors de la création de l'utilisateur" });
    }

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

    return reply.status(201).send({ success: true, message: "Inscription réalisée avec succès" });
  });
}
