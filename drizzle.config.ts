import { defineConfig } from 'drizzle-kit';

const dbPath = process.env.MAGAM_CHAT_DB_PATH || './examples/.magam/chat.db';

export default defineConfig({
  dialect: 'sqlite',
  schema: './libs/cli/src/chat/repository/schema.ts',
  out: './libs/cli/src/chat/repository/drizzle',
  dbCredentials: {
    url: dbPath,
  },
  strict: true,
  verbose: true,
});
