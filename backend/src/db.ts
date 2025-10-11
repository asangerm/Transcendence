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

  // Crée la DB si elle n'existe pas
  console.log("📦 Initialisation DB :", dbPath);

  const db = new Database(dbPath);

  const tableExists = db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='users'"
  ).get();

  if (!tableExists) {
    const schemaPath = path.join(process.cwd(), "dist", "schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf8");
    db.exec(schema);
    fastify.log.info("Database schema created successfully");
  } else {
    fastify.log.info("Database already exists, skipping schema creation");
  }

  fastify.decorate("db", db);
}

export default fp(dbPlugin, { name: "db" });
