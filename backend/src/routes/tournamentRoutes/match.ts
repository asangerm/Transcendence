import { FastifyInstance } from "fastify";
import { z } from "zod";
import { requireAuth } from "../../middleware/authMiddleware";
import { getMatchData } from "../../services/tournament.service";
import { gameManager } from "../../realtime/GameManager";

export default async function tournamentMatch(app: FastifyInstance) {
  app.get("/match/:id", { preHandler: [requireAuth] }, async (req, reply) => {
    try {
      const params = await z.object({ id: z.string() }).parseAsync(req.params);
      const matchId = parseInt(params.id, 10);
      if (!Number.isFinite(matchId)) {
        reply.code(400);
        return { error: "Invalid match id" };
      }
      const match = getMatchData(app.db, matchId) as any;
      if (!match) {
        reply.code(404);
        return { error: "Match not found" };
      }
      return {
        player1_id: match.player1_id,
        player2_id: match.player2_id,
        player1_name: match.player1_name,
        player2_name: match.player2_name,
      };
    } catch {
      reply.code(400);
      return { error: "Invalid request" };
    }
  });

  app.post("/match/:id/start", { preHandler: [requireAuth] }, async (req, reply) => {
    try {
      const params = await z.object({ id: z.string() }).parseAsync(req.params);
      const matchId = parseInt(params.id, 10);
      if (!Number.isFinite(matchId)) {
        reply.code(400);
        return { error: "Invalid match id" };
      }
      const match = getMatchData(app.db, matchId) as any;
      if (!match) {
        reply.code(404);
        return { error: "Match not found" };
      }
      const p1Id = match.player1_id as number | null | undefined;
      const p2Id = match.player2_id as number | null | undefined;
      if (p1Id == null || p2Id == null) {
        reply.code(400);
        return { error: "Match players not set" };
      }
      const p1Name = match.player1_name || String(p1Id);
      const p2Name = match.player2_name || String(p2Id);
      const game = gameManager.createTournamentPong(matchId, p1Id, p1Name, p2Id, p2Name);
      return {
        gameId: game.id,
        players: {
          top: { id: String(match.player1_id), username: p1Name },
          bottom: { id: String(match.player2_id), username: p2Name },
        },
      };
    } catch {
      reply.code(400);
      return { error: "Invalid request" };
    }
  });
}


