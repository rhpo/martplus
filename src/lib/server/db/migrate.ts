import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { openDb } from './client';

function migrationsDir(): string {
	return resolve(process.cwd(), 'migrations');
}

/**
 * Apply every unapplied migration in migrations/ (sorted by filename),
 * each wrapped in a transaction, recording it in _migrations.
 */
export function runMigrations(): void {
	const conn = openDb();

	conn.exec(`CREATE TABLE IF NOT EXISTS _migrations (
		id TEXT PRIMARY KEY,
		applied_at TEXT NOT NULL DEFAULT (datetime('now'))
	)`);

	const applied = new Set(
		(conn.prepare('SELECT id FROM _migrations').all() as { id: string }[]).map((r) => r.id)
	);

	const files = readdirSync(migrationsDir())
		.filter((f) => f.endsWith('.sql'))
		.sort();

	for (const file of files) {
		if (applied.has(file)) continue;
		const sql = readFileSync(resolve(migrationsDir(), file), 'utf-8');
		const apply = conn.transaction(() => {
			conn.exec(sql);
			conn.prepare('INSERT INTO _migrations (id) VALUES (?)').run(file);
		});
		apply();
		console.log(`[migrate] applied ${file}`);
	}
}
