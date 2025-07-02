import Fastify from 'fastify';
import rootRoute from './routes/root.js';

export default function buildApp() {
    const app = Fastify({ logger: true });
  
    // Enregistre les routes
    app.register(rootRoute);
  
    return app;
  }
  