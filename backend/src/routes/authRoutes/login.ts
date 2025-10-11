import { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export default async function loginRoute(app: FastifyInstance) {
  app.post("/login", async (req, reply) => {
    const { email, password } = req.body as { email: string; password: string };

    const user = app.db.prepare("SELECT * FROM users WHERE email = ?").get(email) as
      | { id: number; email: string; display_name: string; password_hash: string }
      | undefined;

    if (!user) return reply.status(401).send({ error: true, message: "Invalid email or password" });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return reply.status(401).send({ error: true, message: "Invalid email or password" });

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

    return reply.send({ success: true, message: "Logged in successfully" });
  });
}
