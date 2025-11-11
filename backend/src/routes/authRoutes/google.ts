import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

interface GoogleAuthBody {
  idToken: string;
}

export default async function googleAuth(app: FastifyInstance) {
  app.post('/google', async (request: FastifyRequest<{ Body: GoogleAuthBody }>, reply: FastifyReply) => {
    try {
      const { idToken } = request.body;
      
      if (!idToken) {
        return reply.status(400).send({ error: 'ID token is required' });
      }

      const ticket = await client.verifyIdToken({
        idToken: idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        return reply.status(401).send({ error: 'Invalid Google token' });
      }

      const { sub: googleId, email, name, picture } = payload;

      let user = app.db.prepare('SELECT * FROM users WHERE google_id = ? OR email = ?').get(googleId, email) as any;

      if (!user) {
        const insertUser = app.db.prepare(`
          INSERT INTO users (email, display_name, avatar_url, google_id, two_factor_enabled, wins, losses, is_online)
          VALUES (?, ?, ?, ?, 0, 0, 0, 1)
        `);
        
        const result = insertUser.run(email, name, picture, googleId);
        const userId = result.lastInsertRowid;
        
        user = app.db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
      } else {
        app.db.prepare('UPDATE users SET is_online = 1, google_id = ? WHERE id = ?').run(googleId, user.id);
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

      return reply.send({ success: true, message: "Logged in successfully" });

    } catch (error) {
      console.error('Google auth error:', error);
      return reply.status(500).send({ error: 'Google authentication failed' });
    }
  });
}