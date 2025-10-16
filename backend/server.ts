import fastify from "fastify";
import fastifyCors from "@fastify/cors";
import fastifyCookie from "@fastify/cookie";
import fastifyStatic from "@fastify/static";
import fastifyMultipart from "@fastify/multipart";
import dbPlugin from "./src/db";
import routes from "./src/routes";
import { errorHandler } from "./src/middleware/errorHandler";
import path from "path";

const app = fastify({
  logger: true,
});

async function buildServer() {
  // DB
  await app.register(dbPlugin);

  // CORS
  await app.register(fastifyCors, {
    origin: "http://localhost:3000",
    credentials: true, // important pour cookies cross-site
  });

  // Cookies
  await app.register(fastifyCookie, {
    secret: process.env.COOKIE_SECRET || "supersecret", // pour signer les cookies
  });
  
  // Servir les fichiers statiques
  const uploadsPath = path.join(process.cwd(), "uploads");

  await app.register(fastifyStatic, {
    root: uploadsPath,
    prefix: "/uploads/", // accessible via http://localhost:8000/uploads/...
  });

  app.register(fastifyMultipart, {
    limits: {
      fileSize: 2 * 1024 * 1024, // 2MB max
    },
  });
  
  // Routes (index.ts)
  app.register(routes);

  // Middleware global d'erreurs
  app.setErrorHandler(errorHandler);

  return app;
}

buildServer()
  .then((app) => {
    app.listen({ port: 8000, host: "0.0.0.0" });
  })
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
