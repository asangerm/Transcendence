import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import validateUser from '../validators/validator';

export default async function authRoutes(app: FastifyInstance) {

  // ----------------- REGISTER -----------------
  app.post('/register', async (req, reply) => {
    let validatedUser;
    try {
      validatedUser = validateUser(req.body); // valide et lève erreur si invalide
    } catch (err: any) {
      return reply.status(400).send({ error: true, message: err.message });
    }

    const { name, email, password } = validatedUser;

    // Vérification doublon
    const existing = app.db.prepare("SELECT id FROM users WHERE email = ? OR display_name = ?").get(email, name);
    if (existing) {
      return reply.status(409).send({ error: true, message: "User already exists" });
    }

    // Hash du mot de passe et insertion
    const hashed = await bcrypt.hash(password, 10);
    app.db.prepare("INSERT INTO users (email, display_name, password_hash) VALUES (?, ?, ?)").run(email, name, hashed);

    return reply.status(201).send({ success: true, message: "User registered successfully" });
  });

  // ----------------- LOGIN -----------------
  app.post('/login', async (req, reply) => {
    const { email, password } = req.body as { email: string; password: string };

    const user = app.db.prepare("SELECT * FROM users WHERE email = ?").get(email) as
      | { id: number; email: string; display_name: string; password_hash: string }
      | undefined;

    if (!user) return reply.status(401).send({ error: true, message: "Invalid email or password" });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return reply.status(401).send({ error: true, message: "Invalid email or password" });

    const token = jwt.sign(
      { id: user.id, email: user.email, display_name: user.display_name },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '1h' }
    );

    // Cookie HttpOnly
    reply.setCookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60, // 1h
    });

    return reply.send({ success: true, message: "Logged in successfully" });
  });

  // ----------------- LOGOUT -----------------
  app.post('/logout', async (_, reply) => {
    reply.clearCookie('token', { path: '/' });
    return reply.send({ success: true, message: "Logged out" });
  });

  // ----------------- ME -----------------
  app.get('/me', async (req, reply) => {
    const { token } = req.cookies as { token?: string };
    if (!token) return reply.status(401).send({ error: true, message: "Not authenticated" });

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as {
        id: number;
        email: string;
        display_name: string;
      };
      return reply.send({ success: true, user: decoded });
    } catch {
      return reply.status(401).send({ error: true, message: "Invalid token" });
    }
  });
}
