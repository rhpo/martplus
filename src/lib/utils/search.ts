import type { Product } from '$lib/types';

/**
 * Fuzzy, ranked product search — "Google-like":
 * combines weighted field/token matching with trigram (n-gram Jaccard)
 * similarity for typo tolerance, then ranks. It never returns an empty list:
 * when nothing matches well it falls back to the closest / most popular items.
 *
 * Trigram similarity is the same technique Postgres `pg_trgm` uses.
 */

function norm(s: string | null | undefined): string {
	return (s ?? '')
		.toLowerCase()
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.trim();
}

function trigrams(s: string): Set<string> {
	const padded = `  ${s} `;
	const set = new Set<string>();
	for (let i = 0; i < padded.length - 2; i++) set.add(padded.slice(i, i + 3));
	return set;
}

/** Jaccard similarity over character trigrams → 0..1. */
function trigramSimilarity(a: string, b: string): number {
	if (!a || !b) return 0;
	if (a === b) return 1;
	const A = trigrams(a);
	const B = trigrams(b);
	let inter = 0;
	for (const g of A) if (B.has(g)) inter++;
	const union = A.size + B.size - inter;
	return union === 0 ? 0 : inter / union;
}

function scoreProduct(p: Product, query: string, tokens: string[]): number {
	const name = norm(p.name);
	const brand = norm(p.brand);
	const cat = norm(p.category_slug);
	const desc = norm(p.description);

	let score = 0;

	// Whole-query phrase matches (strongest signal).
	if (name.includes(query)) score += 14;
	else if (`${brand} ${desc}`.includes(query)) score += 6;

	// Per-token matching with field weighting.
	for (const tk of tokens) {
		if (name.includes(tk)) score += name.startsWith(tk) ? 7 : 5;
		else if (brand.includes(tk)) score += 4;
		else if (cat.includes(tk)) score += 2;
		else if (desc.includes(tk)) score += 1;
		else {
			// Fuzzy: typo tolerance against the product name.
			const sim = trigramSimilarity(tk, name);
			if (sim > 0.25) score += sim * 4;
		}
	}

	// Whole-query fuzzy similarity catches typos spanning the phrase.
	score += trigramSimilarity(query, name) * 5;

	// Tiny popularity tie-break (keeps ordering stable, surfaces staples on ties).
	score += Math.min(p.review_count, 1000) / 20000;

	// Prefer in-stock items on otherwise-equal relevance.
	if (p.stock > 0) score += 0.05;

	return score;
}

/**
 * Rank products against a query. Returns the best `limit` items, most relevant
 * first. Never empty (for a non-empty catalogue) — falls back to popular items.
 */
export function rankProducts(products: Product[], query: string, limit = 60): Product[] {
	const q = norm(query);
	if (!q) return [];

	const tokens = q.split(/[^a-z0-9]+/).filter((t) => t.length >= 2);

	const scored = products
		.map((p) => ({ p, score: scoreProduct(p, q, tokens) }))
		.sort((a, b) => b.score - a.score);

	// "Relevant" = clearly above the popularity-noise floor.
	const relevant = scored.filter((x) => x.score >= 1);
	const chosen = relevant.length > 0 ? relevant : scored;

	return chosen.slice(0, limit).map((x) => x.p);
}
