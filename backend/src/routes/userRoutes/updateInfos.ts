import { FastifyInstance } from "fastify";
import jwt from "jsonwebtoken";
import { requireAuth } from "../../middleware/authMiddleware";
import validateUser from "../../validators/validator";

export default async function updateInfos(app: FastifyInstance) {
  app.put("/", { preHandler: [requireAuth] }, async (req: any, reply) => {
    const userId = req.user.id; //utilise uniquement l'utilisateur connecté
    const { display_name, email } = req.body as { display_name: string; email: string };

    // Valide les données côté serveur
    try {
      validateUser({ name: display_name, email, password: "dummyPassword123!" });
    } catch (err: any) {
      return reply.status(400).send({ error: true, message: err.message });
    }

    // Vérifie si le nom d’utilisateur est déjà pris 
    const existingName = app.db
      .prepare("SELECT id FROM users WHERE display_name = ? AND id != ?")
      .get(display_name, userId);

    if (existingName) {
      return reply.status(400).send({ error: true, message: "Ce nom d'utilisateur est déjà utilisé." });
    }

    // Vérifie si email est déjà pris
    const existingEmail = app.db
      .prepare("SELECT id FROM users WHERE email = ? AND id != ?")
      .get(email, userId);

    if (existingEmail) {
      return reply.status(400).send({ error: true, message: "Cet email est déjà utilisé par un autre utilisateur." });
    }

    // Mise à jour
    app.db.prepare("UPDATE users SET display_name = ?, email = ? WHERE id = ?")
      .run(display_name, email, userId);

    // Récupère l'utilisateur mis à jour
    const updatedUser = app.db
      .prepare("SELECT id, display_name, email FROM users WHERE id = ?")
      .get(userId);

    // Regénère JWT
    const token = jwt.sign(
      { id: userId, email, display_name },
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

    return reply.send(updatedUser);
  });
}
