import { FastifyInstance } from "fastify";

// Auth
import registerRoute from "./authRoutes/register";
import loginRoute from "./authRoutes/login";
import logoutRoute from "./authRoutes/logout";
import meRoute from "./authRoutes/me";
import googleRoute from "./authRoutes/google";

// Users
import listUsers from "./userRoutes/list";
import getUserById from "./userRoutes/getById";
import getUserByName from "./userRoutes/getByName";
import updateUser from "./userRoutes/update";
import userStats from "./userRoutes/stats";
import getUserMatchHistory from "./userRoutes/matchHistory";
import anonymizeUser from "./userRoutes/anonymize";
import deleteUser from "./userRoutes/delete";

// RGPD
import privacyRoute from "./rgpd/privacy";
import gameRoutes from "./gameRoutes";
import { registerRealtime } from "../realtime/ws";



export default async function routes(app: FastifyInstance) {
  // Auth
  app.register(registerRoute, { prefix: "/auth" });
  app.register(loginRoute, { prefix: "/auth" });
  app.register(logoutRoute, { prefix: "/auth" });
  app.register(meRoute, { prefix: "/auth" });
  app.register(googleRoute, { prefix: "/auth" });

  // Users
  app.register(listUsers, { prefix: "/users" });
  app.register(getUserById, { prefix: "/users" });
  app.register(getUserByName, { prefix: "/users" });
  app.register(updateUser, { prefix: "/users" });
  app.register(userStats, { prefix: "/users" });
  app.register(getUserMatchHistory, { prefix: "/users" });
  app.register(anonymizeUser, { prefix: "/users" });
  app.register(deleteUser, { prefix: "/users" });

  //RGPD
  app.register(privacyRoute, { prefix: "/rgpd" });
  // Games (HTTP)
  app.register(gameRoutes, { prefix: "/api" });
  // Realtime (WS)
  await registerRealtime(app);
  
}
