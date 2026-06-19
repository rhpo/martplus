import Database from 'better-sqlite3';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

export type Db = Database.Database;

let db: Db | null = null;

function databasePath(): string {
	const p = process.env.DATABASE_PATH ?? './data/mart.db';
	return resolve(process.cwd(), p);
}

/** Open (once) and configure the SQLite connection. */
export function openDb(): Db {
	if (db) return db;

	const path = databasePath();
	const dir = dirname(path);
	if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

	db = new Database(path);
	db.pragma('journal_mode = WAL');
	db.pragma('foreign_keys = ON');
	return db;
}

/** Raw helpers. */
export function get<T = unknown>(sql: string, params: unknown[] = []): T | undefined {
	return openDb().prepare(sql).get(...params) as T | undefined;
}

export function all<T = unknown>(sql: string, params: unknown[] = []): T[] {
	return openDb().prepare(sql).all(...params) as T[];
}

export function run(sql: string, params: unknown[] = []): Database.RunResult {
	return openDb().prepare(sql).run(...params);
}

/** Run `fn` inside a transaction; commits on success, rolls back on throw. */
export function transaction<T>(fn: () => T): T {
	const conn = openDb();
	const tx = conn.transaction(fn as () => T);
	return tx();
}
