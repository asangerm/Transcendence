import { FastifyInstance } from "fastify";
import dotenv from 'dotenv';

// Auth
dotenv.config();
import registerRoute from "./authRoutes/register";
import loginRoute from "./authRoutes/login";
import logoutRoute from "./authRoutes/logout";
import meRoute from "./authRoutes/me";
import googleRoute from "./authRoutes/google";
import forgotPasswordRoutes from "./authRoutes/forgot-password";

// Users
import listUsers from "./userRoutes/list";
import getUserById from "./userRoutes/getById";
import getUserByName from "./userRoutes/getByName";
import updateInfos from "./userRoutes/updateInfos";
import updatePassword from "./userRoutes/updatePassword";
import userStats from "./userRoutes/stats";
import getUserMatchHistory from "./userRoutes/matchHistory";
import anonymizeUser from "./userRoutes/anonymize";
import deleteUser from "./userRoutes/delete";
import exportData from "./userRoutes/exportData";
import modifyAvatar from "./userRoutes/avatar";
import searchUser from "./userRoutes/searchUser";

// RGPD
import gameRoutes from "./gameRoutes";
import roomRoutes from "./roomRoutes";
import matchmakingRoutes from "./matchmakingRoutes";
import { registerRealtime } from "../realtime/ws";
// Friends
import getFriends from "./friendsRoutes/getFriends";
import addFriend from "./friendsRoutes/addFriend";
import removeFriend from "./friendsRoutes/removeFriend";

// Tournaments
import createTournament from "./tournamentRoutes/create";
import getOngoingTournament from "./tournamentRoutes/get";
import deleteTournament from "./tournamentRoutes/delete";



export default async function routes(app: FastifyInstance) {
  // Auth
  app.register(registerRoute, { prefix: "/auth" });
  app.register(loginRoute, { prefix: "/auth" });
  app.register(logoutRoute, { prefix: "/auth" });
  app.register(meRoute, { prefix: "/auth" });
  app.register(googleRoute, { prefix: "/auth" });
  app.register(forgotPasswordRoutes, { prefix: "/auth" });

  // Users
  app.register(listUsers, { prefix: "/users" });
  app.register(getUserById, { prefix: "/users" });
  app.register(getUserByName, { prefix: "/users" });
  app.register(updateInfos, { prefix: "/users" });
  app.register(updatePassword, { prefix: "/users" });
  app.register(userStats, { prefix: "/users" });
  app.register(getUserMatchHistory, { prefix: "/users" });
  app.register(anonymizeUser, { prefix: "/users" });
  app.register(deleteUser, { prefix: "/users" });
  app.register(exportData, { prefix: "/users" });
  app.register(modifyAvatar, { prefix: "/users" });
  app.register(searchUser, { prefix: "/users" });

  //RGPD
  // Games (HTTP)
  app.register(gameRoutes, { prefix: "/api" });
  // Rooms (HTTP)
  app.register(roomRoutes, { prefix: "/api" });
  // Matchmaking (HTTP)
  app.register(matchmakingRoutes, { prefix: "/api" });
  // Realtime (WS) - includes both game and room WebSocket functionality
  await registerRealtime(app);
  
  // Friends
  app.register(getFriends, { prefix: "/friends" });
  app.register(addFriend, { prefix: "/friends" });
  app.register(removeFriend, { prefix: "/friends" });

  // Tournaments
  app.register(createTournament, { prefix: "/tournament" });
  app.register(getOngoingTournament, { prefix: "/tournament" });
  app.register(deleteTournament, { prefix: "/tournament" });

}
