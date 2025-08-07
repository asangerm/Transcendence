import Fastify from 'fastify';
import cors from '@fastify/cors';
import dbPlugin from "./db";
import userRoutes from './routes/userRoutes'; // ajout import des routes utilisateur

async function startServer() {
  const fastify = Fastify({
    logger: true
  });

  await fastify.register(cors, {
    origin: true
  });

  await fastify.register(dbPlugin);

  // Enregistre les routes utilisateur
  await fastify.register(userRoutes);

  fastify.get('/', async (request, reply) => {
    return { message: 'Backend is working!' }
  });

  fastify.get('/db-test', async (request, reply) => {
    try {
      const result = fastify.db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as Array<{name: string}>;
      return {
        message: 'Database is working!',
        tables: result.map(row => row.name)
      }
    } catch (error) {
      return {
        message: 'Database error',
        error: (error as Error).message
      }
    }
  });

  try {
    await fastify.listen({ port: 8000, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

startServer();
