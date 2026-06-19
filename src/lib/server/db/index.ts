import { openDb, type Db } from './client';
import { runMigrations } from './migrate';

let migrated = false;

/** Returns the singleton DB connection, running migrations on first use. */
export function getDb(): Db {
	const db = openDb();
	if (!migrated) {
		runMigrations();
		migrated = true;
	}
	return db;
}
