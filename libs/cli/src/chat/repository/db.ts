import { mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
import * as schema from './schema';

export type ChatDb = ReturnType<typeof drizzle<typeof schema>>;

function resolveDbPath(targetDir: string): string {
  const explicit = process.env.MAGAM_CHAT_DB_PATH?.trim();
  if (explicit) return explicit;
  return join(targetDir, '.magam', 'chat.db');
}

export function createChatDb(targetDir: string): { db: ChatDb; sqlite: Database; dbPath: string } {
  const dbPath = resolveDbPath(targetDir);
  mkdirSync(dirname(dbPath), { recursive: true });

  const sqlite = new Database(dbPath, { create: true, strict: true });
  sqlite.exec('PRAGMA journal_mode = WAL;');
  sqlite.exec('PRAGMA foreign_keys = ON;');

  const db = drizzle(sqlite, { schema });

  try {
    migrate(db, {
      migrationsFolder: fileURLToPath(new URL('./drizzle', import.meta.url)),
    });
  } catch {
    // Fallback bootstrap for environments where migration assets are missing.
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS session_groups (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        color TEXT,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS chat_sessions (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        group_id TEXT,
        provider_id TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        archived_at INTEGER,
        FOREIGN KEY (group_id) REFERENCES session_groups(id)
      );

      CREATE TABLE IF NOT EXISTS chat_messages (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        provider_id TEXT,
        created_at INTEGER NOT NULL,
        metadata_json TEXT,
        FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_sessions_updated_at ON chat_sessions(updated_at DESC);
      CREATE INDEX IF NOT EXISTS idx_sessions_group_id ON chat_sessions(group_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_provider_id ON chat_sessions(provider_id);
      CREATE INDEX IF NOT EXISTS idx_messages_session_created_at ON chat_messages(session_id, created_at ASC, id ASC);
    `);
  }
  return { db, sqlite, dbPath };
}
