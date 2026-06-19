import { getDb } from '$lib/server/db';
import type { Category } from '$lib/types';
import type { CategoryRepository } from '../types';

export class SqliteCategoryRepository implements CategoryRepository {
	listAll(): Category[] {
		return getDb()
			.prepare('SELECT id, slug, label, emoji, accent, sort_order FROM categories ORDER BY sort_order')
			.all() as Category[];
	}

	getBySlug(slug: string): Category | null {
		const r = getDb()
			.prepare('SELECT id, slug, label, emoji, accent, sort_order FROM categories WHERE slug = ?')
			.get(slug) as Category | undefined;
		return r ?? null;
	}
}
