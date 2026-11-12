import { defineConfig } from 'drizzle-kit';

const user = process.env.DB_USER || 'banco_sangre';
const password = process.env.DB_PASSWORD || 'banco_sangre_dev';
const host = process.env.DB_HOST || 'localhost';
const port = process.env.DB_PORT || '5432';
const database = process.env.DB_NAME || 'banco_sangre';

export default defineConfig({
  out: './drizzle',
  schema: './src/lib/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url:
      process.env.DATABASE_URL ||
      `postgresql://${user}:${password}@${host}:${port}/${database}`,
  },
});
