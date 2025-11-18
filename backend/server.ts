import fastify from "fastify";
import fastifyCors from "@fastify/cors";
import fastifyCookie from "@fastify/cookie";
import fastifyWebsocket from "@fastify/websocket";
import fastifyStatic from "@fastify/static";
import fastifyMultipart from "@fastify/multipart";
import dbPlugin from "./src/db";
import routes from "./src/routes";
import { errorHandler } from "./src/middleware/errorHandler";
import path from "path";
import fs from "fs";

const HTTPS_ENABLED = process.env.HTTPS_ENABLED === "true";

let fastifyOptions: any = {
  logger: true,
};

if (HTTPS_ENABLED) {
  const certPath = path.join(__dirname, "../ssl/cert.pem");
  const keyPath = path.join(__dirname, "../ssl/key.pem");

  if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    fastifyOptions.https = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    };
    console.log("[HTTPS] ✅ Certificats SSL chargés");
  } else {
    console.warn("[HTTPS] ⚠️  Certificats non trouvés, mode HTTP");
  }
}

const app = fastify(fastifyOptions);

async function buildServer() {
  // DB
  await app.register(dbPlugin);

  // CORS
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

  await app.register(fastifyCors, { origin: frontendUrl, credentials: true });

  // Cookies
  await app.register(fastifyCookie, {
    secret: process.env.COOKIE_SECRET || "supersecret", // pour signer les cookies
  });
  
  // Servir les fichiers statiques
  const uploadsPath = path.join(process.cwd(), "uploads");

  // WebSocket
  await app.register(fastifyWebsocket);

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
    const port = parseInt(process.env.PORT || "8000", 10);
    const protocol = HTTPS_ENABLED ? "HTTPS" : "HTTP";

    app.listen({ port, host: "0.0.0.0" }, (err, address) => {
      if (err) {
        app.log.error(err);
        process.exit(1);
      }
      console.log(`[${protocol}] 🚀 Server listening on ${address}`);
    });
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
