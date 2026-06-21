import { getSupabase } from '$lib/server/supabase';
import type { Category } from '$lib/types';
import type { CategoryRepository } from '../types';

const COLS = 'id, slug, label, emoji, accent, sort_order';

export class SupabaseCategoryRepository implements CategoryRepository {
	async listAll(): Promise<Category[]> {
		const { data, error } = await getSupabase()
			.from('categories')
			.select(COLS)
			.order('sort_order');
		if (error) throw new Error(`[categories] listAll: ${error.message}`);
		return (data ?? []) as Category[];
	}

	async getBySlug(slug: string): Promise<Category | null> {
		const { data, error } = await getSupabase()
			.from('categories')
			.select(COLS)
			.eq('slug', slug)
			.maybeSingle();
		if (error) throw new Error(`[categories] getBySlug: ${error.message}`);
		return (data as Category) ?? null;
	}
}
