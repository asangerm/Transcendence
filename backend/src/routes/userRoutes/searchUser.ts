import { FastifyInstance } from "fastify";
import { requireAuth } from "../../middleware/authMiddleware";

export default async function searchUser(app: FastifyInstance) {
  app.get("/search", { preHandler: [requireAuth] }, async (req, reply) => {
	const { q } = req.query;
    if (!q) {
        return reply.code(400).send({ error: 'Missing search query' });
    }
    try {
		const friends = app.db
		.prepare(`
			SELECT id, display_name, avatar_url, is_online
				FROM users
				WHERE LOWER(display_name) LIKE LOWER(?) 
				ORDER BY display_name ASC
				LIMIT 20;
		`)
		.all(`%${q}%`);

		return reply.send({ success: true, friends });
    } catch (err) {
        return reply.code(500).send({ error: 'Database error' });
    }
  });
}