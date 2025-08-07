import { FastifyInstance } from 'fastify';
import db from '../db';
import validateUser from '../validators/validator'; // corriger l'import ici
import bcrypt from 'bcryptjs';

async function userRoutes(app: FastifyInstance) {
  app.post('/users', async (request, reply) => {
    const { username, email, password } = request.body as any;

    try {
      // validation attend un objet complet { name, email, password }
      validateUser({ name: username, email, password });
    } catch (error: any) {
      return reply.status(400).send({ error: "Invalid input" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const stmt = app.db.prepare('INSERT INTO users (email, display_name, password_hash) VALUES (?, ?, ?)');
      const result = stmt.run(email, username, hashedPassword);
      return reply.status(201).send({ id: result.lastInsertRowid, username, email });
    } catch (err: any) {
      return reply.status(400).send({ error: 'User already exists or invalid data' });
    }
  });

  app.get('/users', async (request, reply) => {
    const stmt = app.db.prepare('SELECT id, display_name AS username, email FROM users');
    const users = stmt.all();
    return reply.send(users);
  });
}

export default userRoutes;

