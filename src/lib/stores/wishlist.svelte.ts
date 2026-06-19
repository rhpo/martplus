import { browser } from '$app/environment';
import type { Product, WishlistItem } from '$lib/types';

const STORAGE_KEY = 'martplus-wishlist';

function load(): WishlistItem[] {
	if (!browser) return [];
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}

let items = $state<WishlistItem[]>(load());

function persist(): void {
	if (!browser) return;
	localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export const wishlist = {
	get items(): WishlistItem[] {
		return items;
	},
	get count(): number {
		return items.length;
	},
	has(productId: number): boolean {
		return items.some((it) => it.productId === productId);
	},
	toggle(product: Product) {
		if (this.has(product.id)) {
			this.remove(product.id);
		} else {
			items.push({
				productId: product.id,
				slug: product.slug,
				name: product.name,
				brand: product.brand,
				price: product.price,
				image: product.image,
				imageUrl: product.imageUrl,
				stock: product.stock
			});
			persist();
		}
	},
	remove(productId: number) {
		items = items.filter((it) => it.productId !== productId);
		persist();
	},
	clear() {
		items = [];
		persist();
	}
};
