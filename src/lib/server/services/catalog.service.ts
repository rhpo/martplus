import type { Category, NewProduct, Product } from '$lib/types';
import { rankProducts } from '$lib/utils/search';
import { getRepositories } from '../repositories/factory';
import { getStorage } from '../storage/factory';

function withUrl(p: Product): Product {
	return { ...p, imageUrl: getStorage().getUrl(p.image) };
}

export async function listCategories(): Promise<Category[]> {
	return getRepositories().categories.listAll();
}

export async function getCategory(slug: string): Promise<Category | null> {
	return getRepositories().categories.getBySlug(slug);
}

export async function listAllProducts(): Promise<Product[]> {
	return (await getRepositories().products.listAll()).map(withUrl);
}

export async function listByCategory(slug: string): Promise<Product[]> {
	return (await getRepositories().products.listByCategory(slug)).map(withUrl);
}

export async function searchProducts(q: string): Promise<Product[]> {
	if (!q.trim()) return [];
	// Rank the whole catalogue with a fuzzy, typo-tolerant scorer (never empty).
	const all = await getRepositories().products.listAll();
	return rankProducts(all, q, 60).map(withUrl);
}

export async function getProduct(slug: string): Promise<Product | null> {
	const p = await getRepositories().products.getBySlug(slug);
	return p ? withUrl(p) : null;
}

export async function getProductById(id: number): Promise<Product | null> {
	const p = await getRepositories().products.getById(id);
	return p ? withUrl(p) : null;
}

export async function getProductsByIds(ids: number[]): Promise<Product[]> {
	return (await getRepositories().products.getManyByIds(ids)).map(withUrl);
}

export async function getProductsBySlugs(slugs: string[]): Promise<Product[]> {
	const repo = getRepositories().products;
	const found = await Promise.all(slugs.map((s) => repo.getBySlug(s)));
	return found.filter((p): p is Product => p !== null).map(withUrl);
}

export async function listFlashDeals(): Promise<Product[]> {
	return (await getRepositories().products.listFlash()).map(withUrl);
}

export async function listBestsellers(limit = 12): Promise<Product[]> {
	return (await getRepositories().products.listBestsellers(limit)).map(withUrl);
}

// ---------- admin ----------

export async function createProduct(input: NewProduct): Promise<Product> {
	return withUrl(await getRepositories().products.create(input));
}

export async function updateProduct(id: number, patch: Partial<NewProduct>): Promise<Product> {
	return withUrl(await getRepositories().products.update(id, patch));
}

export async function deleteProduct(id: number): Promise<void> {
	const repo = getRepositories().products;
	const existing = await repo.getById(id);
	await repo.delete(id);
	if (existing?.image) {
		try {
			await getStorage().delete(existing.image);
		} catch (err) {
			console.error('[catalog] failed to delete image for product', id, err);
		}
	}
}

export async function adjustStock(id: number, delta: number): Promise<void> {
	await getRepositories().products.adjustStock(id, delta);
}

const EXT_BY_TYPE: Record<string, string> = {
	'image/jpeg': 'jpg',
	'image/png': 'png',
	'image/webp': 'webp',
	'image/gif': 'gif',
	'image/avif': 'avif'
};

/** Upload a product image to Supabase Storage; returns the stored object key. */
export async function uploadProductImage(slug: string, file: File): Promise<string> {
	const bytes = Buffer.from(await file.arrayBuffer());
	const ext = EXT_BY_TYPE[file.type] ?? (file.name.split('.').pop() || 'jpg').toLowerCase();
	const key = `products/${slug}-${Date.now()}.${ext}`;
	const { key: storedKey } = await getStorage().upload(key, bytes, file.type || 'image/jpeg');
	return storedKey;
}
