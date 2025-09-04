import { FastifyRequest, FastifyReply } from 'fastify';
import { authService } from '../services/auth.service';

export interface AuthenticatedRequest extends FastifyRequest {
  userId?: number;
}

export async function authenticate(request: AuthenticatedRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Unauthorized: No token provided' });
    }
    
    const token = authHeader.substring(7);
    const decoded = authService.verifyAccessToken(token);
    
    if (!decoded) {
      return reply.status(401).send({ error: 'Unauthorized: Invalid token' });
    }
    
    request.userId = decoded.userId;
  } catch (error) {
    return reply.status(401).send({ error: 'Unauthorized: Token verification failed' });
  }
}

export async function optionalAuthenticate(request: AuthenticatedRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = authService.verifyAccessToken(token);
      
      if (decoded) {
        request.userId = decoded.userId;
      }
    }
  } catch (error) {
  }
}