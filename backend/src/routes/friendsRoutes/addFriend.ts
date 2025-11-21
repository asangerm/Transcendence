import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { requireAuth, AuthUser } from "../../middleware/authMiddleware";

type AuthRequest = FastifyRequest & { user?: AuthUser };

export default async function addFriend(app: FastifyInstance) {
  app.post("/add/:friendId", { preHandler: [requireAuth] }, async (req: AuthRequest, reply: FastifyReply) => {
    try {
		
	if (!req.user) return reply.status(401).send({ error: true, message: "Unauthorized" });
    
	const { friendId } = req.params as { friendId: number };
	  const userId = req.user.id;

      if (userId === friendId) {
        return reply.status(400).send({
          error: true,
          message: "You cannot add yourself as a friend.",
        });
      }

      // Vérifier que l'utilisateur à ajouter existe
      const friendExists = app.db
        .prepare("SELECT id FROM users WHERE id = ?")
        .get(friendId);
      if (!friendExists) {  
        return reply.status(404).send({
          error: true,
          message: "The user you are trying to add does not exist.",
        });
      }

      // Vérifier que l'utilisateur n'est pas déjà ami
      const alreadyFriend = app.db
        .prepare("SELECT 1 FROM friends WHERE user_id = ? AND friend_id = ?")
        .get(userId, friendId);
      if (alreadyFriend) {
        return reply.status(409).send({
          error: true,
          message: "This user is already in your friend list.",
        });
      }

      // Ajouter l'ami
      app.db
        .prepare("INSERT INTO friends (user_id, friend_id, created_at) VALUES (?, ?, datetime('now'))")
        .run(userId, friendId);

      return reply.status(201).send({
        success: true,
        message: "Friend added successfully.",
        data: { user_id: userId, friend_id: friendId },
      });
    } catch (err: any) {
      console.error(err);
      return reply.status(500).send({
        error: true,
        message: "An unexpected error occurred.",
      });
    }
  });
}