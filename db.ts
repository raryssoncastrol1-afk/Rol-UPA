import { createClient } from "@libsql/client";
import path from "path";

// O sistema utiliza banco de dados SQLite local embutido ("uph_data.db").
// Não necessita de nenhum serviço externo, token ou cadastro na nuvem.
const dbUrl = process.env.DATABASE_URL || `file:${path.join(process.cwd(), "uph_data.db")}`;

export const db = createClient({
  url: dbUrl,
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
