import buildApp from './app.js';

const start = async () => {
  const app = buildApp();

  try {
    await app.listen({ port: 8000, host: '0.0.0.0' });
    app.log.info('Serveur lancé sur http://localhost:8000');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();