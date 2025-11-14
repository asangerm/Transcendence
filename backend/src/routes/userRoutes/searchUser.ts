import { FastifyInstance } from "fastify";
import { requireAuth } from "../../middleware/authMiddleware";

export default async function searchUser(app: FastifyInstance) {
  app.get("/search", { preHandler: [requireAuth] }, async (req, reply) => {
	const { q } = req.query as { q: string };

    if (!q) {
        return reply.code(400).send({ error: 'Requête de recherche manquante' });
    }
    try {
		const users = app.db
		.prepare(`
			SELECT id, display_name, avatar_url, is_online
				FROM users
				WHERE LOWER(display_name) LIKE LOWER(?) 
				ORDER BY display_name ASC
				LIMIT 10;
		`)
		.all(`%${q}%`);

		return reply.send({ success: true, users });
    } catch (err) {
        return reply.code(500).send({ error: 'Erreur base de données' });
    }
  });
}