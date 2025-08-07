import fp from "fastify-plugin";
import Database from "better-sqlite3";
import { FastifyInstance } from "fastify";
import fs from "fs";

declare module "fastify" {
  interface FastifyInstance {
    db: Database.Database;
  }
}

async function dbPlugin(fastify: FastifyInstance) {
  const dbPath = process.env.DB_PATH || "./data/db.sqlite";
  const db = new Database(dbPath);

  const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get();

  if (!tableExists) {
    const schema = fs.readFileSync("./src/schema.sql", "utf8");
    db.exec(schema);
    fastify.log.info("Database schema created successfully");
  } else {
    fastify.log.info("Database already exists, skipping schema creation");
  }

  fastify.decorate("db", db);
}

export default fp(dbPlugin, { name: "db" });
