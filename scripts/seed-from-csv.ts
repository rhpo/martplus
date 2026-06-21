/**
 * Seed products into Supabase from static/examples/products.csv (spec format).
 * Falls back to a built-in set if the CSV is missing.
 *
 * Run with:  npm run seed
 * Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in the environment
 * (the npm script loads .env via node --env-file-if-exists).
 * Run supabase/schema.sql in your Supabase project first.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

const CSV_PATH = resolve(process.cwd(), 'static/examples/products.csv');

interface SeedRow {
	slug: string;
	name: string;
	brand: string;
	category_slug: string;
	description: string;
	price: number;
	original_price: number | null;
	rating: number;
	review_count: number;
	image: string;
	badge: string | null;
	stock: number;
	is_flash: number;
	flash_reserved_pct: number;
}

/** Minimal RFC-4180-ish CSV parser (handles quotes, escaped quotes, commas, newlines). */
function parseCsv(text: string): string[][] {
	const rows: string[][] = [];
	let field = '';
	let row: string[] = [];
	let inQuotes = false;

	for (let i = 0; i < text.length; i++) {
		const c = text[i];
		if (inQuotes) {
			if (c === '"') {
				if (text[i + 1] === '"') {
					field += '"';
					i++;
				} else {
					inQuotes = false;
				}
			} else {
				field += c;
			}
		} else if (c === '"') {
			inQuotes = true;
		} else if (c === ',') {
			row.push(field);
			field = '';
		} else if (c === '\n' || c === '\r') {
			if (c === '\r' && text[i + 1] === '\n') i++;
			row.push(field);
			rows.push(row);
			row = [];
			field = '';
		} else {
			field += c;
		}
	}
	if (field.length > 0 || row.length > 0) {
		row.push(field);
		rows.push(row);
	}
	return rows.filter((r) => r.length > 1 || (r.length === 1 && r[0].trim() !== ''));
}

function rowsFromCsv(): SeedRow[] {
	const text = readFileSync(CSV_PATH, 'utf-8');
	const parsed = parseCsv(text);
	const header = parsed.shift();
	if (!header) return [];
	const idx = (k: string) => header.indexOf(k);
	const I = {
		slug: idx('slug'),
		name: idx('name'),
		brand: idx('brand'),
		category_slug: idx('category_slug'),
		description: idx('description'),
		price: idx('price'),
		original_price: idx('original_price'),
		rating: idx('rating'),
		review_count: idx('review_count'),
		image: idx('image'),
		badge: idx('badge'),
		stock: idx('stock'),
		is_flash: idx('is_flash'),
		flash_reserved_pct: idx('flash_reserved_pct')
	};

	const numOrNull = (s: string): number | null => {
		const t = (s ?? '').trim();
		if (t === '' || t.toUpperCase() === 'NULL') return null;
		const v = parseFloat(t.replace(',', '.'));
		return Number.isFinite(v) ? v : null;
	};

	return parsed.map((r) => ({
		slug: r[I.slug]?.trim() ?? '',
		name: r[I.name]?.trim() ?? '',
		brand: r[I.brand]?.trim() ?? '',
		category_slug: r[I.category_slug]?.trim() || 'epicerie',
		description: r[I.description]?.trim() ?? '',
		price: numOrNull(r[I.price]) ?? 0,
		original_price: numOrNull(r[I.original_price]),
		rating: numOrNull(r[I.rating]) ?? 0,
		review_count: Math.round(numOrNull(r[I.review_count]) ?? 0),
		image: r[I.image]?.trim() ?? '',
		badge: (r[I.badge]?.trim() || null) as string | null,
		stock: Math.round(numOrNull(r[I.stock]) ?? 0),
		is_flash: numOrNull(r[I.is_flash]) ? 1 : 0,
		flash_reserved_pct: Math.round(numOrNull(r[I.flash_reserved_pct]) ?? 0)
	}));
}

// No built-in fallback products: those used placeholder image keys that don't exist
// in the Supabase bucket (broken images). The catalogue is seeded purely from the CSV,
// whose products carry real, working image URLs.
const FALLBACK: SeedRow[] = [];

async function seed(rows: SeedRow[]) {
	const url = process.env.SUPABASE_URL;
	const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
	if (!url || !key) {
		console.error(
			'[seed] SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required. Add them to .env and ensure supabase/schema.sql has been run.'
		);
		process.exit(1);
	}
	const sb = createClient(url, key, { auth: { persistSession: false } });

	const { data: cats, error: catErr } = await sb.from('categories').select('slug');
	if (catErr) {
		console.error('[seed] could not read categories (did you run supabase/schema.sql?):', catErr.message);
		process.exit(1);
	}
	const validCats = new Set((cats ?? []).map((c) => c.slug));

	const payload = rows
		.filter((it) => it.slug && it.name && it.price > 0)
		.map((it) => ({
			slug: it.slug,
			name: it.name,
			brand: it.brand || null,
			category_slug: validCats.has(it.category_slug) ? it.category_slug : 'epicerie',
			description: it.description || null,
			price: it.price,
			original_price: it.original_price ?? null,
			rating: it.rating,
			review_count: it.review_count,
			image: it.image && it.image.toUpperCase() !== 'NULL' ? it.image : null,
			badge: it.badge && it.badge !== '' ? it.badge : null,
			stock: it.stock,
			is_flash: it.is_flash === 1,
			flash_reserved_pct: it.flash_reserved_pct
		}));

	let upserted = 0;
	const CHUNK = 500;
	for (let i = 0; i < payload.length; i += CHUNK) {
		const batch = payload.slice(i, i + CHUNK);
		const { error } = await sb.from('products').upsert(batch, { onConflict: 'slug' });
		if (error) {
			console.error(`[seed] upsert batch failed at row ${i}:`, error.message);
			process.exit(1);
		}
		upserted += batch.length;
	}
	console.log(`[seed] upserted ${upserted} products into Supabase`);
}

const csvRows = existsSync(CSV_PATH) ? rowsFromCsv() : [];
// Always include the canonical signature products (referenced by Hero / Signature
// Duos / Marty), then layer the CSV catalogue on top.
const bySlug = new Map<string, SeedRow>();
for (const r of FALLBACK) bySlug.set(r.slug, r);
for (const r of csvRows) bySlug.set(r.slug, r);
seed([...bySlug.values()]);
