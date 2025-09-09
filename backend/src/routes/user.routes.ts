/*import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { userService } from '../services/user.service';
import { AuthenticatedRequest, authenticate, optionalAuthenticate } from '../middleware/auth.middleware';

interface UpdateProfileBody {
  displayName?: string;
}

interface FriendActionBody {
  friendId: number;
}

interface FriendRequestActionBody {
  requestId: number;
}

interface SearchQuery {
  q: string;
}

export async function userRoutes(app: FastifyInstance) {
  app.get('/api/users/profile', { preHandler: authenticate }, async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      if (!request.userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
      
      const profile = await userService.getUserProfile(request.userId);
      
      if (!profile) {
        return reply.status(404).send({ error: 'User not found' });
      }
      
      return reply.send(profile);
    } catch (error) {
      console.error('Get profile error:', error);
      return reply.status(500).send({ error: 'Failed to get profile' });
    }
  });

  app.get('/api/users/:id', { preHandler: optionalAuthenticate }, async (request: AuthenticatedRequest & { Params: { id: string } }, reply: FastifyReply) => {
    try {
      const userId = parseInt(request.params.id);
      
      if (isNaN(userId)) {
        return reply.status(400).send({ error: 'Invalid user ID' });
      }
      
      const profile = await userService.getUserProfile(userId);
      
      if (!profile) {
        return reply.status(404).send({ error: 'User not found' });
      }
      
      return reply.send(profile);
    } catch (error) {
      console.error('Get user profile error:', error);
      return reply.status(500).send({ error: 'Failed to get user profile' });
    }
  });

  app.patch('/api/users/profile', { preHandler: authenticate }, async (request: AuthenticatedRequest & { Body: UpdateProfileBody }, reply: FastifyReply) => {
    try {
      if (!request.userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
      
      const { displayName } = request.body;
      
      if (displayName) {
        const isAvailable = await userService.searchUsers(displayName, request.userId);
        if (isAvailable.length > 0 && isAvailable[0].display_name === displayName) {
          return reply.status(409).send({ error: 'Display name already taken' });
        }
      }
      
      const updatedUser = await userService.updateUserProfile(request.userId, request.body);
      
      if (!updatedUser) {
        return reply.status(404).send({ error: 'User not found' });
      }
      
      return reply.send(updatedUser);
    } catch (error) {
      console.error('Update profile error:', error);
      return reply.status(500).send({ error: 'Failed to update profile' });
    }
  });

  app.post('/api/users/avatar', { preHandler: authenticate }, async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      if (!request.userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
      
      const data = await request.file();
      
      if (!data) {
        return reply.status(400).send({ error: 'No file uploaded' });
      }
      
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(data.mimetype)) {
        return reply.status(400).send({ error: 'Only image files are allowed' });
      }
      
      const buffer = await data.toBuffer();
      
      const avatarUrl = await userService.uploadAvatar(
        request.userId,
        buffer,
        data.filename
      );
      
      return reply.send({ avatarUrl });
    } catch (error) {
      console.error('Avatar upload error:', error);
      return reply.status(500).send({ error: 'Failed to upload avatar' });
    }
  });

  app.get('/api/users/:id/stats', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const userId = parseInt(request.params.id);
      
      if (isNaN(userId)) {
        return reply.status(400).send({ error: 'Invalid user ID' });
      }
      
      const stats = await userService.getUserStats(userId);
      
      if (!stats) {
        return reply.status(404).send({ error: 'User not found' });
      }
      
      return reply.send(stats);
    } catch (error) {
      console.error('Get stats error:', error);
      return reply.status(500).send({ error: 'Failed to get user stats' });
    }
  });

  app.get('/api/users/:id/matches', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const userId = parseInt(request.params.id);
      
      if (isNaN(userId)) {
        return reply.status(400).send({ error: 'Invalid user ID' });
      }
      
      const matches = await userService.getUserMatchHistory(userId);
      
      return reply.send(matches);
    } catch (error) {
      console.error('Get match history error:', error);
      return reply.status(500).send({ error: 'Failed to get match history' });
    }
  });

  app.get('/api/users/:id/friends', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const userId = parseInt(request.params.id);
      
      if (isNaN(userId)) {
        return reply.status(400).send({ error: 'Invalid user ID' });
      }
      
      const friends = await userService.getUserFriends(userId);
      
      return reply.send(friends);
    } catch (error) {
      console.error('Get friends error:', error);
      return reply.status(500).send({ error: 'Failed to get friends' });
    }
  });

  app.post('/api/users/friends/request', { preHandler: authenticate }, async (request: AuthenticatedRequest & { Body: FriendActionBody }, reply: FastifyReply) => {
    try {
      if (!request.userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
      
      const { friendId } = request.body;
      
      if (!friendId) {
        return reply.status(400).send({ error: 'Friend ID is required' });
      }
      
      const success = await userService.sendFriendRequest(request.userId, friendId);
      
      if (!success) {
        return reply.status(400).send({ error: 'Failed to send friend request' });
      }
      
      return reply.send({ message: 'Friend request sent' });
    } catch (error) {
      console.error('Send friend request error:', error);
      return reply.status(500).send({ error: 'Failed to send friend request' });
    }
  });

  app.post('/api/users/friends/accept', { preHandler: authenticate }, async (request: AuthenticatedRequest & { Body: FriendRequestActionBody }, reply: FastifyReply) => {
    try {
      if (!request.userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
      
      const { requestId } = request.body;
      
      if (!requestId) {
        return reply.status(400).send({ error: 'Request ID is required' });
      }
      
      const success = await userService.acceptFriendRequest(requestId, request.userId);
      
      if (!success) {
        return reply.status(400).send({ error: 'Failed to accept friend request' });
      }
      
      return reply.send({ message: 'Friend request accepted' });
    } catch (error) {
      console.error('Accept friend request error:', error);
      return reply.status(500).send({ error: 'Failed to accept friend request' });
    }
  });

  app.post('/api/users/friends/reject', { preHandler: authenticate }, async (request: AuthenticatedRequest & { Body: FriendRequestActionBody }, reply: FastifyReply) => {
    try {
      if (!request.userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
      
      const { requestId } = request.body;
      
      if (!requestId) {
        return reply.status(400).send({ error: 'Request ID is required' });
      }
      
      const success = await userService.rejectFriendRequest(requestId, request.userId);
      
      if (!success) {
        return reply.status(400).send({ error: 'Failed to reject friend request' });
      }
      
      return reply.send({ message: 'Friend request rejected' });
    } catch (error) {
      console.error('Reject friend request error:', error);
      return reply.status(500).send({ error: 'Failed to reject friend request' });
    }
  });

  app.get('/api/users/friends/requests', { preHandler: authenticate }, async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      if (!request.userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
      
      const requests = await userService.getPendingFriendRequests(request.userId);
      
      return reply.send(requests);
    } catch (error) {
      console.error('Get friend requests error:', error);
      return reply.status(500).send({ error: 'Failed to get friend requests' });
    }
  });

  app.delete('/api/users/friends/:friendId', { preHandler: authenticate }, async (request: AuthenticatedRequest & { Params: { friendId: string } }, reply: FastifyReply) => {
    try {
      if (!request.userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
      
      const friendId = parseInt(request.params.friendId);
      
      if (isNaN(friendId)) {
        return reply.status(400).send({ error: 'Invalid friend ID' });
      }
      
      const success = await userService.removeFriend(request.userId, friendId);
      
      if (!success) {
        return reply.status(400).send({ error: 'Failed to remove friend' });
      }
      
      return reply.send({ message: 'Friend removed' });
    } catch (error) {
      console.error('Remove friend error:', error);
      return reply.status(500).send({ error: 'Failed to remove friend' });
    }
  });

  app.get('/api/users/search', { preHandler: optionalAuthenticate }, async (request: AuthenticatedRequest & { Querystring: SearchQuery }, reply: FastifyReply) => {
    try {
      const { q } = request.query;
      
      if (!q) {
        return reply.status(400).send({ error: 'Search query is required' });
      }
      
      const users = await userService.searchUsers(q, request.userId);
      
      return reply.send(users);
    } catch (error) {
      console.error('Search users error:', error);
      return reply.status(500).send({ error: 'Failed to search users' });
    }
  });
}*/