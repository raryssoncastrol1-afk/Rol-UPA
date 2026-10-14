import { createClient } from "@libsql/client";
import path from "path";

// Se TURSO_DATABASE_URL e TURSO_AUTH_TOKEN existirem, conecta ao Turso na nuvem.
// Caso contrário, usa arquivo SQLite local "file:uph_data.db" no próprio diretório.
const dbUrl = process.env.TURSO_DATABASE_URL || `file:${path.join(process.cwd(), "uph_data.db")}`;
const authToken = process.env.TURSO_AUTH_TOKEN;

export const db = createClient({
  url: dbUrl,
  authToken: authToken,
});

export async function initDatabase() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS members (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS elections (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS treasury (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  console.log(`[Database] SQLite/LibSQL conectado com sucesso em: ${dbUrl}`);
}
