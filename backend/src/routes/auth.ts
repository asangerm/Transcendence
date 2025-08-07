import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config(); // Charge les variables d’environnement (.env)

async function authRoutes(app: FastifyInstance) {
  app.post('/login', async (request, reply) => {
    const { email, password } = request.body as { email: string; password: string };

    try {
      // Vérifie si l'utilisateur existe
      const stmt = app.db.prepare('SELECT * FROM users WHERE email = ?');
      const user = stmt.get(email);

      if (!user) {
        return reply.status(401).send({ error: 'Invalid email or password' });
      }

      // Vérifie le mot de passe
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);

      if (!isPasswordValid) {
        return reply.status(401).send({ error: 'Invalid email or password' });
      }

      // Génére un token JWT
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          username: user.display_name,
        },
        process.env.JWT_SECRET as string, // doit être défini dans le fichier .env
        {
          expiresIn: '2h', // Durée de vie du token
        }
      );

      return reply.send({ token }); // Envoie le token au client
    } catch (err) {
      console.error(err);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
}

export default authRoutes;
