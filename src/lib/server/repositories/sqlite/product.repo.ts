import { getDb } from '$lib/server/db';
import type { NewProduct, Product } from '$lib/types';
import type { ProductRepository } from '../types';

interface ProductRow {
	id: number;
	slug: string;
	name: string;
	brand: string | null;
	category_slug: string;
	description: string | null;
	price: number;
	original_price: number | null;
	rating: number;
	review_count: number;
	image: string | null;
	badge: string | null;
	stock: number;
	is_flash: number;
	flash_reserved_pct: number;
	created_at: string;
}

function toProduct(r: ProductRow): Product {
	return {
		id: r.id,
		slug: r.slug,
		name: r.name,
		brand: r.brand,
		category_slug: r.category_slug,
		description: r.description,
		price: r.price,
		original_price: r.original_price,
		rating: r.rating,
		review_count: r.review_count,
		image: r.image,
		badge: (r.badge as Product['badge']) ?? null,
		stock: r.stock,
		is_flash: r.is_flash === 1,
		flash_reserved_pct: r.flash_reserved_pct,
		created_at: r.created_at
	};
}

const COLS = `id, slug, name, brand, category_slug, description, price, original_price,
	rating, review_count, image, badge, stock, is_flash, flash_reserved_pct, created_at`;

export class SqliteProductRepository implements ProductRepository {
	listAll(): Product[] {
		const rows = getDb().prepare(`SELECT ${COLS} FROM products ORDER BY name`).all() as ProductRow[];
		return rows.map(toProduct);
	}

	listByCategory(slug: string): Product[] {
		// "nouveautes" is a virtual category → newest products.
		if (slug === 'nouveautes') {
			const rows = getDb()
				.prepare(`SELECT ${COLS} FROM products ORDER BY created_at DESC, id DESC LIMIT 60`)
				.all() as ProductRow[];
			return rows.map(toProduct);
		}
		const rows = getDb()
			.prepare(`SELECT ${COLS} FROM products WHERE category_slug = ? ORDER BY stock > 0 DESC, name`)
			.all(slug) as ProductRow[];
		return rows.map(toProduct);
	}

	search(q: string): Product[] {
		const like = `%${q.trim()}%`;
		const rows = getDb()
			.prepare(
				`SELECT ${COLS} FROM products
				 WHERE name LIKE ? OR brand LIKE ? OR description LIKE ?
				 ORDER BY stock > 0 DESC, name LIMIT 80`
			)
			.all(like, like, like) as ProductRow[];
		return rows.map(toProduct);
	}

	getBySlug(slug: string): Product | null {
		const r = getDb().prepare(`SELECT ${COLS} FROM products WHERE slug = ?`).get(slug) as
			| ProductRow
			| undefined;
		return r ? toProduct(r) : null;
	}

	getById(id: number): Product | null {
		const r = getDb().prepare(`SELECT ${COLS} FROM products WHERE id = ?`).get(id) as
			| ProductRow
			| undefined;
		return r ? toProduct(r) : null;
	}

	getManyByIds(ids: number[]): Product[] {
		if (ids.length === 0) return [];
		const placeholders = ids.map(() => '?').join(',');
		const rows = getDb()
			.prepare(`SELECT ${COLS} FROM products WHERE id IN (${placeholders})`)
			.all(...ids) as ProductRow[];
		return rows.map(toProduct);
	}

	listFlash(): Product[] {
		const rows = getDb()
			.prepare(`SELECT ${COLS} FROM products WHERE is_flash = 1 ORDER BY flash_reserved_pct DESC`)
			.all() as ProductRow[];
		return rows.map(toProduct);
	}

	listBestsellers(limit = 12): Product[] {
		const rows = getDb()
			.prepare(
				`SELECT ${COLS} FROM products
				 WHERE stock > 0
				 ORDER BY (badge = 'BESTSELLER') DESC, review_count DESC, rating DESC
				 LIMIT ?`
			)
			.all(limit) as ProductRow[];
		return rows.map(toProduct);
	}

	create(input: NewProduct): Product {
		const info = getDb()
			.prepare(
				`INSERT INTO products
				 (slug, name, brand, category_slug, description, price, original_price, rating,
				  review_count, image, badge, stock, is_flash, flash_reserved_pct)
				 VALUES (@slug, @name, @brand, @category_slug, @description, @price, @original_price,
				  @rating, @review_count, @image, @badge, @stock, @is_flash, @flash_reserved_pct)`
			)
			.run({
				...input,
				is_flash: input.is_flash ? 1 : 0,
				badge: input.badge ?? null,
				original_price: input.original_price ?? null,
				brand: input.brand ?? null,
				description: input.description ?? null,
				image: input.image ?? null
			});
		return this.getById(Number(info.lastInsertRowid))!;
	}

	update(id: number, patch: Partial<NewProduct>): Product {
		const allowed: (keyof NewProduct)[] = [
			'slug', 'name', 'brand', 'category_slug', 'description', 'price', 'original_price',
			'rating', 'review_count', 'image', 'badge', 'stock', 'is_flash',
			'flash_reserved_pct'
		];
		const sets: string[] = [];
		const params: Record<string, unknown> = { id };
		for (const key of allowed) {
			if (key in patch) {
				sets.push(`${key} = @${key}`);
				let v: unknown = patch[key];
				if (key === 'is_flash') v = v ? 1 : 0;
				params[key] = v ?? null;
			}
		}
		if (sets.length > 0) {
			getDb().prepare(`UPDATE products SET ${sets.join(', ')} WHERE id = @id`).run(params);
		}
		return this.getById(id)!;
	}

	delete(id: number): void {
		getDb().prepare('DELETE FROM products WHERE id = ?').run(id);
	}

	adjustStock(id: number, delta: number): void {
		const row = getDb().prepare('SELECT stock FROM products WHERE id = ?').get(id) as
			| { stock: number }
			| undefined;
		if (!row) throw new Error(`Produit introuvable (#${id})`);
		const next = row.stock + delta;
		if (next < 0) throw new Error(`Stock insuffisant pour le produit #${id}`);
		getDb().prepare('UPDATE products SET stock = ? WHERE id = ?').run(next, id);
	}
}
