import Fastify from 'fastify';
import userRoutes from './routes/userRoutes'; // ou le bon chemin
import dbPlugin from './db';

const app = Fastify();

app.register(dbPlugin);      // Connexion à la DB
app.register(userRoutes);    // Enregistrement des routes

app.listen({ port: 8000, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`🚀 Server running at ${address}`);
});
