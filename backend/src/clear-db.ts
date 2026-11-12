import { sql } from 'drizzle-orm';
import { db, pool } from './lib/db/index.ts';

try {
  await db.execute(sql`TRUNCATE TABLE citas RESTART IDENTITY`);
  console.log('Todas las citas han sido eliminadas y el contador reiniciado.');
} catch (error) {
  console.error('Error al limpiar las citas:', error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
