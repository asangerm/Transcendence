import { FastifyInstance } from "fastify";

export default async function userStats(app: FastifyInstance) {
  app.get("/:id/stats", async (req, reply) => {
    const { id } = req.params as { id: string };

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
