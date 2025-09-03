import { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import validateUser from "../../validators/validator";

export default async function updateUser(app: FastifyInstance) {
  app.put("/:id", async (req, reply) => {
    const { id } = req.params as { id: string };

    let validatedData;
    try {
      validatedData = validateUser(req.body);
    } catch (err: any) {
      return reply.status(400).send({ error: true, message: err.message });
    }

    const { name, email, password } = validatedData;
    const hashed = await bcrypt.hash(password, 10);

    const existing = app.db.prepare("SELECT id FROM users WHERE id = ?").get(id);
    if (!existing) return reply.status(404).send({ error: true, message: "User not found" });

    app.db
      .prepare("UPDATE users SET display_name = ?, email = ?, password_hash = ? WHERE id = ?")
      .run(name, email, hashed, id);

    return reply.send({ success: true, message: "User updated successfully" });
  });
}
