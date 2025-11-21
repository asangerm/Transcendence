import fp from "fastify-plugin";
import Database from "better-sqlite3";
import { FastifyInstance } from "fastify";
import fs from "fs";
import path from "path";

declare module "fastify" {
  interface FastifyInstance {
    db: Database.Database;
  }
}

async function dbPlugin(fastify: FastifyInstance) {
  // Lecture du chemin de la base depuis DB_PATH ou fallback
  const dbPath = process.env.DB_PATH || path.join(__dirname, "../data/db.sqlite");
  const db = new Database(dbPath);

  const existingTables = db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table'"
  ).all();

  const tableNames = existingTables.map((t: any) => t.name);
  const expectedTables = ['users', 'friends', 'games', 'matches', 'tournaments', 'participants', 'tournament_matches', 'duel_requests'];
 
  const allTablesExist = expectedTables.every(table => tableNames.includes(table));
 
  if (!allTablesExist) {
    fastify.log.info("Missing tables detected, recreating schema...");

	db.exec("PRAGMA foreign_keys = OFF;");
	// Supprimer toutes les tables existantes
	for (const table of tableNames) {
		if (table !== 'sqlite_sequence') { // Ne pas supprimer sqlite_sequence
			db.exec(`DROP TABLE IF EXISTS ${table}`);
		}
	}

    const schemaPath = path.join(process.cwd(), "dist", "schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf8");
    db.exec(schema);
    db.exec("PRAGMA foreign_keys = ON;");
    db.exec("INSERT INTO games (name, description) VALUES ('Pong', 'Deux raquettes, une balle, et un chaos spatial où frapper correctement devient un sport de haut niveau. (solo / pvp local/ pvp en ligne)')");
    db.exec("INSERT INTO games (name, description) VALUES ('Game2', 'Le fameux jeu où deux adversaires s’affrontent pour prouver qui sait mieux dessiner des croix et des ronds… et finissent toujours par égalité. (pvp en ligne)')");
    fastify.log.info("Database schema created successfully");
  } else {
    fastify.log.info("Database already exists, skipping schema creation");
  }

  fastify.decorate("db", db);
}

export default fp(dbPlugin, { name: "db" });
