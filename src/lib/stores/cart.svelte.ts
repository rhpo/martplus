import { browser } from '$app/environment';
import type { CartItem, Product } from '$lib/types';

const STORAGE_KEY = 'martplus-cart';

function load(): CartItem[] {
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

let items = $state<CartItem[]>(load());

function persist(): void {
	if (!browser) return;
	localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function toCartItem(p: Product, quantity: number): CartItem {
	return {
		productId: p.id,
		slug: p.slug,
		name: p.name,
		brand: p.brand,
		price: p.price,
		image: p.image,
		imageUrl: p.imageUrl,
		quantity,
		stock: p.stock
	};
}

export const cart = {
	get items(): CartItem[] {
		return items;
	},
	get count(): number {
		return items.reduce((n, it) => n + it.quantity, 0);
	},
	get subtotal(): number {
		return items.reduce((sum, it) => sum + it.price * it.quantity, 0);
	},
	get isEmpty(): boolean {
		return items.length === 0;
	},
	add(product: Product, quantity = 1) {
		if (product.stock <= 0) return;
		const existing = items.find((it) => it.productId === product.id);
		if (existing) {
			existing.quantity = Math.min(product.stock, existing.quantity + quantity);
		} else {
			items.push(toCartItem(product, Math.min(product.stock, quantity)));
		}
		persist();
	},
	addCombo(products: Product[]) {
		for (const p of products) this.add(p, 1);
	},
	setQty(productId: number, quantity: number) {
		const item = items.find((it) => it.productId === productId);
		if (!item) return;
		const q = Math.max(0, Math.min(item.stock, Math.floor(quantity)));
		if (q <= 0) {
			this.remove(productId);
			return;
		}
		item.quantity = q;
		persist();
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
