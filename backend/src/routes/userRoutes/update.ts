import { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import validateUser from "../../validators/validator";
import { requireAuth } from "../../middleware/authMiddleware";

export default async function updateUser(app: FastifyInstance) {
  app.put("/:id", { preHandler: [requireAuth] }, async (req, reply) => {
    const { id } = req.params as { id: string };

    let validatedData;
    try {
      validatedData = validateUser(req.body);
    } catch (err: any) {
      return reply.status(400).send({ error: true, message: err.message });
    }

    const { name, email, password } = validatedData;
    const hashed = await bcrypt.hash(password, 10);

    // Vérifie si l'utilisateur existe
    const existing = app.db.prepare("SELECT id FROM users WHERE id = ?").get(id);
    if (!existing) return reply.status(404).send({ error: true, message: "User not found" });

    // Vérifie si email ou pseudo sont déjà utilisés par un autre utilisateur
    const duplicate = app.db
      .prepare("SELECT id FROM users WHERE (email = ? OR display_name = ?) AND id != ?")
      .get(email, name, id);

    if (duplicate) {
      return reply.status(409).send({ error: true, message: "Email or username already taken" });
    }

    // Mise à jour
    app.db
      .prepare("UPDATE users SET display_name = ?, email = ?, password_hash = ? WHERE id = ?")
      .run(name, email, hashed, id);

    return reply.send({ success: true, message: "User updated successfully" });
  });
}