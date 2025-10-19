import { FastifyInstance } from "fastify";
import { requireAuth } from "../../middleware/authMiddleware";

export default async function removeFriend(app: FastifyInstance) {
  app.delete("/remove/:userId/:friendId", { preHandler: [requireAuth] }, async (req, reply) => {
	try {
	  const { friendId } = req.params as { friendId: string };
	  const { userId } = req.params as { userId: string };

	  if (userId === friendId) {
		return reply.status(400).send({
		  error: true,
		  message: "You cannot remove yourself as a friend.",
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

	  // Vérifier que l'utilisateur est déjà ami
	  const alreadyFriend = app.db
		.prepare("SELECT 1 FROM friends WHERE user_id = ? AND friend_id = ?")
		.get(userId, friendId);
	  if (!alreadyFriend) {
		return reply.status(409).send({
		  error: true,
		  message: "This user is not in your friend list.",
		});
	  }

	  // supprimer l'ami
	  app.db
		.prepare("DELETE FROM friends WHERE user_id = ? AND friend_id = ?")
		.run(userId, friendId);

	  return reply.status(201).send({
		success: true,
		message: "Friend removed successfully.",
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