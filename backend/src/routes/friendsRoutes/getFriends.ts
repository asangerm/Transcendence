import { FastifyInstance } from "fastify";
import { requireAuth } from "../../middleware/authMiddleware";

export default async function getFriends(app: FastifyInstance) {
  app.get("/:userId", { preHandler: [requireAuth] }, async (req, reply) => {
    const { userId } = req.params as { userId: string };

    const friends = app.db
      .prepare(`
        SELECT 
          u.id AS friend_id,
          u.display_name AS friend_name,
          u.avatar_url,
          f.created_at AS since
        FROM friends f
        JOIN users u ON f.friend_id = u.id
        WHERE f.user_id = ?
      `)
      .all(userId);

    return reply.send({ success: true, friends });
  });
}