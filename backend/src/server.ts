import fastify from "fastify";
import fastifyCors from "@fastify/cors";
import fastifyCookie from "@fastify/cookie";
import dbPlugin from "./db";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";

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

  // Routes
  app.register(authRoutes, { prefix: "/auth" });
  app.register(userRoutes, { prefix: "/" });

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
