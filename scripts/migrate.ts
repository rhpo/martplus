import { runMigrations } from '../src/lib/server/db/migrate';

runMigrations();
console.log('[migrate] done');
