import type { Category, NewProduct, Product } from '$lib/types';
import { getRepositories } from '../repositories/factory';
import { getStorage } from '../storage/factory';

function withUrl(p: Product): Product {
	return { ...p, imageUrl: getStorage().getUrl(p.image) };
}

export function listCategories(): Category[] {
	return getRepositories().categories.listAll();
}

export function getCategory(slug: string): Category | null {
	return getRepositories().categories.getBySlug(slug);
}

export function listAllProducts(): Product[] {
	return getRepositories().products.listAll().map(withUrl);
}

export function listByCategory(slug: string): Product[] {
	return getRepositories().products.listByCategory(slug).map(withUrl);
}

export function searchProducts(q: string): Product[] {
	if (!q.trim()) return [];
	return getRepositories().products.search(q).map(withUrl);
}

export function getProduct(slug: string): Product | null {
	const p = getRepositories().products.getBySlug(slug);
	return p ? withUrl(p) : null;
}

export function getProductById(id: number): Product | null {
	const p = getRepositories().products.getById(id);
	return p ? withUrl(p) : null;
}

export function getProductsByIds(ids: number[]): Product[] {
	return getRepositories().products.getManyByIds(ids).map(withUrl);
}

export function getProductsBySlugs(slugs: string[]): Product[] {
	const repo = getRepositories().products;
	return slugs
		.map((s) => repo.getBySlug(s))
		.filter((p): p is Product => p !== null)
		.map(withUrl);
}

export function listFlashDeals(): Product[] {
	return getRepositories().products.listFlash().map(withUrl);
}

export function listBestsellers(limit = 12): Product[] {
	return getRepositories().products.listBestsellers(limit).map(withUrl);
}

// ---------- admin ----------

export function createProduct(input: NewProduct): Product {
	return withUrl(getRepositories().products.create(input));
}

export function updateProduct(id: number, patch: Partial<NewProduct>): Product {
	return withUrl(getRepositories().products.update(id, patch));
}

export async function deleteProduct(id: number): Promise<void> {
	const repo = getRepositories().products;
	const existing = repo.getById(id);
	repo.delete(id);
	if (existing?.image) {
		try {
			await getStorage().delete(existing.image);
		} catch (err) {
			console.error('[catalog] failed to delete image for product', id, err);
		}
	}
}

export function adjustStock(id: number, delta: number): void {
	getRepositories().products.adjustStock(id, delta);
}

const EXT_BY_TYPE: Record<string, string> = {
	'image/jpeg': 'jpg',
	'image/png': 'png',
	'image/webp': 'webp',
	'image/gif': 'gif',
	'image/avif': 'avif'
};

/** Upload a product image to S3; returns the stored object key. */
export async function uploadProductImage(slug: string, file: File): Promise<string> {
	const bytes = Buffer.from(await file.arrayBuffer());
	const ext = EXT_BY_TYPE[file.type] ?? (file.name.split('.').pop() || 'jpg').toLowerCase();
	const key = `products/${slug}-${Date.now()}.${ext}`;
	const { key: storedKey } = await getStorage().upload(key, bytes, file.type || 'image/jpeg');
	return storedKey;
}
