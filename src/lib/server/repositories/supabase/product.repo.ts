import { getSupabase } from '$lib/server/supabase';
import type { NewProduct, Product } from '$lib/types';
import type { ProductRepository } from '../types';

const COLS =
	'id, slug, name, brand, category_slug, description, price, original_price, rating, review_count, image, badge, stock, is_flash, flash_reserved_pct, created_at';

interface ProductRow {
	id: number;
	slug: string;
	name: string;
	brand: string | null;
	category_slug: string;
	description: string | null;
	price: number | string;
	original_price: number | string | null;
	rating: number | string;
	review_count: number;
	image: string | null;
	badge: string | null;
	stock: number;
	is_flash: boolean;
	flash_reserved_pct: number;
	created_at: string;
}

function num(v: number | string | null | undefined): number {
	if (v === null || v === undefined) return 0;
	const n = typeof v === 'number' ? v : parseFloat(v);
	return Number.isFinite(n) ? n : 0;
}

function toProduct(r: ProductRow): Product {
	return {
		id: r.id,
		slug: r.slug,
		name: r.name,
		brand: r.brand,
		category_slug: r.category_slug,
		description: r.description,
		price: num(r.price),
		original_price: r.original_price === null ? null : num(r.original_price),
		rating: num(r.rating),
		review_count: r.review_count ?? 0,
		image: r.image,
		badge: (r.badge as Product['badge']) ?? null,
		stock: r.stock ?? 0,
		is_flash: !!r.is_flash,
		flash_reserved_pct: r.flash_reserved_pct ?? 0,
		created_at: r.created_at
	};
}

function fail(context: string, error: { message: string } | null): never {
	throw new Error(`[products] ${context}: ${error?.message ?? 'erreur inconnue'}`);
}

/** Escape a value used inside a PostgREST or()/ilike filter. */
function sanitize(q: string): string {
	return q.replace(/[,()*%]/g, ' ').trim();
}

export class SupabaseProductRepository implements ProductRepository {
	async listAll(): Promise<Product[]> {
		const { data, error } = await getSupabase().from('products').select(COLS).order('name');
		if (error) fail('listAll', error);
		return (data as ProductRow[]).map(toProduct);
	}

	async listByCategory(slug: string): Promise<Product[]> {
		const sb = getSupabase();
		if (slug === 'nouveautes') {
			const { data, error } = await sb
				.from('products')
				.select(COLS)
				.order('created_at', { ascending: false })
				.limit(60);
			if (error) fail('listByCategory(nouveautes)', error);
			return (data as ProductRow[]).map(toProduct);
		}
		const { data, error } = await sb
			.from('products')
			.select(COLS)
			.eq('category_slug', slug)
			.order('stock', { ascending: false })
			.order('name');
		if (error) fail('listByCategory', error);
		return (data as ProductRow[]).map(toProduct);
	}

	async search(q: string): Promise<Product[]> {
		const term = sanitize(q);
		if (!term) return [];
		const { data, error } = await getSupabase()
			.from('products')
			.select(COLS)
			.or(`name.ilike.%${term}%,brand.ilike.%${term}%,description.ilike.%${term}%`)
			.order('stock', { ascending: false })
			.limit(80);
		if (error) fail('search', error);
		return (data as ProductRow[]).map(toProduct);
	}

	async getBySlug(slug: string): Promise<Product | null> {
		const { data, error } = await getSupabase()
			.from('products')
			.select(COLS)
			.eq('slug', slug)
			.maybeSingle();
		if (error) fail('getBySlug', error);
		return data ? toProduct(data as ProductRow) : null;
	}

	async getById(id: number): Promise<Product | null> {
		const { data, error } = await getSupabase()
			.from('products')
			.select(COLS)
			.eq('id', id)
			.maybeSingle();
		if (error) fail('getById', error);
		return data ? toProduct(data as ProductRow) : null;
	}

	async getManyByIds(ids: number[]): Promise<Product[]> {
		if (ids.length === 0) return [];
		const { data, error } = await getSupabase().from('products').select(COLS).in('id', ids);
		if (error) fail('getManyByIds', error);
		return (data as ProductRow[]).map(toProduct);
	}

	async listFlash(): Promise<Product[]> {
		const { data, error } = await getSupabase()
			.from('products')
			.select(COLS)
			.eq('is_flash', true)
			.order('flash_reserved_pct', { ascending: false });
		if (error) fail('listFlash', error);
		return (data as ProductRow[]).map(toProduct);
	}

	async listBestsellers(limit = 12): Promise<Product[]> {
		const { data, error } = await getSupabase()
			.from('products')
			.select(COLS)
			.gt('stock', 0)
			.order('review_count', { ascending: false })
			.order('rating', { ascending: false })
			.limit(limit);
		if (error) fail('listBestsellers', error);
		return (data as ProductRow[]).map(toProduct);
	}

	async create(input: NewProduct): Promise<Product> {
		const { data, error } = await getSupabase()
			.from('products')
			.insert({
				...input,
				brand: input.brand ?? null,
				description: input.description ?? null,
				original_price: input.original_price ?? null,
				image: input.image ?? null,
				badge: input.badge ?? null
			})
			.select(COLS)
			.single();
		if (error) fail('create', error);
		return toProduct(data as ProductRow);
	}

	async update(id: number, patch: Partial<NewProduct>): Promise<Product> {
		const { data, error } = await getSupabase()
			.from('products')
			.update(patch)
			.eq('id', id)
			.select(COLS)
			.single();
		if (error) fail('update', error);
		return toProduct(data as ProductRow);
	}

	async delete(id: number): Promise<void> {
		const { error } = await getSupabase().from('products').delete().eq('id', id);
		if (error) fail('delete', error);
	}

	async adjustStock(id: number, delta: number): Promise<void> {
		const { error } = await getSupabase().rpc('adjust_stock', {
			p_product_id: id,
			p_delta: delta
		});
		if (error) throw new Error(`Stock insuffisant ou produit introuvable (#${id})`);
	}
}
