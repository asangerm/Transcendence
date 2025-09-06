import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authService } from '../services/auth.service';
//import { AuthenticatedRequest, authenticate } from '../middleware/auth.middleware';

interface RegisterBody {
  email: string;
  password: string;
  displayName: string;
}

interface LoginBody {
  email: string;
  password: string;
}

interface GoogleLoginBody {
  idToken: string;
}

interface RefreshTokenBody {
  refreshToken: string;
}

export async function authRoutes(app: FastifyInstance) {
  app.post('/api/auth/register', async (request: FastifyRequest<{ Body: RegisterBody }>, reply: FastifyReply) => {
    try {
      const { email, password, displayName } = request.body;
      
      if (!email || !password || !displayName) {
        return reply.status(400).send({ error: 'Email, password, and display name are required' });
      }
      
      if (password.length < 8) {
        return reply.status(400).send({ error: 'Password must be at least 8 characters long' });
      }
      
      const existingUser = await authService.findUserByEmail(email);
      if (existingUser) {
        return reply.status(409).send({ error: 'Email already registered' });
      }
      
      const isDisplayNameAvailable = await authService.isDisplayNameAvailable(displayName);
      if (!isDisplayNameAvailable) {
        return reply.status(409).send({ error: 'Display name already taken' });
      }
      
      const user = await authService.createUser(email, password, displayName);
      const tokens = await authService.generateTokens(user.id);
      
      return reply.send({
        user,
        tokens
      });
    } catch (error) {
      console.error('Registration error:', error);
      return reply.status(500).send({ error: 'Registration failed' });
    }
  });

  app.post('/api/auth/login', async (request: FastifyRequest<{ Body: LoginBody }>, reply: FastifyReply) => {
    try {
      const { email, password } = request.body;
      
      if (!email || !password) {
        return reply.status(400).send({ error: 'Email and password are required' });
      }
      
      const result = await authService.login(email, password);
      
      if (!result) {
        return reply.status(401).send({ error: 'Invalid email or password' });
      }
      
      return reply.send(result);
    } catch (error) {
      console.error('Login error:', error);
      return reply.status(500).send({ error: 'Login failed' });
    }
  });

  app.post('/api/auth/google', async (request: FastifyRequest<{ Body: GoogleLoginBody }>, reply: FastifyReply) => {
    try {
      const { idToken } = request.body;
      
      if (!idToken) {
        return reply.status(400).send({ error: 'ID token is required' });
      }
      
      const result = await authService.googleLogin(idToken);
      
      if (!result) {
        return reply.status(401).send({ error: 'Google authentication failed' });
      }
      
      return reply.send(result);
    } catch (error) {
      console.error('Google login error:', error);
      return reply.status(500).send({ error: 'Google authentication failed' });
    }
  });

  app.post('/api/auth/refresh', async (request: FastifyRequest<{ Body: RefreshTokenBody }>, reply: FastifyReply) => {
    try {
      const { refreshToken } = request.body;
      
      if (!refreshToken) {
        return reply.status(400).send({ error: 'Refresh token is required' });
      }
      
      const result = await authService.refreshAccessToken(refreshToken);
      
      if (!result) {
        return reply.status(401).send({ error: 'Invalid refresh token' });
      }
      
      return reply.send(result);
    } catch (error) {
      console.error('Token refresh error:', error);
      return reply.status(500).send({ error: 'Token refresh failed' });
    }
  });

  app.post('/api/auth/logout', { preHandler: authenticate }, async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      if (!request.userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
      
      await authService.logout(request.userId);
      
      return reply.send({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      return reply.status(500).send({ error: 'Logout failed' });
    }
  });

  app.get('/api/auth/verify', { preHandler: authenticate }, async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      if (!request.userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
      
      const user = await authService.findUserById(request.userId);
      
      if (!user) {
        return reply.status(404).send({ error: 'User not found' });
      }
      
      return reply.send({ user });
    } catch (error) {
      console.error('Verification error:', error);
      return reply.status(500).send({ error: 'Verification failed' });
    }
  });
}