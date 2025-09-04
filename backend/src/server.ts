import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyMultipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import * as dotenv from 'dotenv';
import path from 'path';
import { db } from './database';
import { authRoutes } from './routes/auth.routes';
import { userRoutes } from './routes/user.routes';

dotenv.config();

async function startServer() {
  const fastify = Fastify({
    logger: true
  });

  await db.connect();
  await db.initialize();

  await fastify.register(cors, {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  });

  await fastify.register(fastifyMultipart, {
    limits: {
      fileSize: 10 * 1024 * 1024,
      files: 1,
      fieldSize: 100 * 1024,
      fields: 10
    }
  });

  await fastify.register(fastifyStatic, {
    root: path.join(__dirname, '..', 'uploads'),
    prefix: '/uploads/'
  });

  await fastify.register(authRoutes);
  await fastify.register(userRoutes);

  fastify.get('/', async (request, reply) => {
    return { 
      message: 'ft_transcendence Backend API',
      version: '1.0.0',
      status: 'healthy'
    };
  });

  fastify.get('/api/health/db', async (request, reply) => {
    try {
      const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table'");
      return { 
        message: 'Database is working!',
        tables: tables.map((row: any) => row.name)
      };
    } catch (error) {
      return reply.status(500).send({
        message: 'Database error',
        error: (error as Error).message
      });
    }
  });

  const port = parseInt(process.env.PORT || '8000');
  try {
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`Server running on port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    await db.close();
    process.exit(1);
  }

  process.on('SIGTERM', async () => {
    await fastify.close();
    await db.close();
  });

  process.on('SIGINT', async () => {
    await fastify.close();
    await db.close();
  });
}

startServer().catch(console.error);