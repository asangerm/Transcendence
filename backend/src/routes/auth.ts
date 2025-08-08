import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

type User = {
  id: number;
  email: string;
  display_name: string;
  password_hash: string;
};

async function authRoutes(app: FastifyInstance) {
  app.post('/login', async (request, reply) => {
    const { email, password } = request.body as { email: string; password: string };

    try {
      const stmt = app.db.prepare('SELECT * FROM users WHERE email = ?');
      const user = stmt.get(email) as User | undefined;

      if (!user) {
        return reply.status(401).send({ error: 'Invalid email or password' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password_hash);

      if (!isPasswordValid) {
        return reply.status(401).send({ error: 'Invalid email or password' });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, username: user.display_name },
        process.env.JWT_SECRET as string,
        { expiresIn: '2h' }
      );

      return reply.send({ token });
    } catch (err) {
      console.error(err);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
}

export default authRoutes;
