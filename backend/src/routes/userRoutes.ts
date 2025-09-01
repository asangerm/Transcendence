import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import validateUser from '../validators/validator';

export default async function userRoutes(app: FastifyInstance) {

  // ----------------- LISTE DE TOUS LES UTILISATEURS -----------------
  app.get('/users', async (req, reply) => {
    const users = app.db
      .prepare('SELECT id, display_name AS name, email FROM users')
      .all();
    return reply.send({ success: true, users });
  });

  // ----------------- INFO UTILISATEUR -----------------
  app.get('/users/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const user = app.db
      .prepare('SELECT id, display_name AS name, email FROM users WHERE id = ?')
      .get(id);

    if (!user) return reply.status(404).send({ error: true, message: 'User not found' });
    return reply.send({ success: true, user });
  });

  // ----------------- MISE À JOUR UTILISATEUR -----------------
  app.put('/users/:id', async (req, reply) => {
    const { id } = req.params as { id: string };

    // Valide les données du corps de la requête
    let validatedData;
    try {
      validatedData = validateUser(req.body);
    } catch (err: any) {
      return reply.status(400).send({ error: true, message: err.message });
    }

    const { name, email, password } = validatedData;
    const hashed = await bcrypt.hash(password, 10);

    // Vérifie si l'utilisateur existe
    const existing = app.db.prepare('SELECT id FROM users WHERE id = ?').get(id);
    if (!existing) return reply.status(404).send({ error: true, message: 'User not found' });

    // Met à jour l'utilisateur
    app.db
      .prepare('UPDATE users SET display_name = ?, email = ?, password_hash = ? WHERE id = ?')
      .run(name, email, hashed, id);

    return reply.send({ success: true, message: 'User updated successfully' });
  });

  // ----------------- STATS UTILISATEUR (exemple) -----------------
  app.get('/users/:id/stats', async (req, reply) => {
    const { id } = req.params as { id: string };

    // Exemple : récupération de victoires/défaites depuis une table "matches"
    const stats = app.db
      .prepare(
        `SELECT 
           SUM(CASE WHEN winner_id = ? THEN 1 ELSE 0 END) AS victories,
           SUM(CASE WHEN loser_id = ? THEN 1 ELSE 0 END) AS defeats
         FROM matches`
      )
      .get(id, id);

    return reply.send({ success: true, stats });
  });

}
