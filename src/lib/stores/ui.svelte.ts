import type { Product } from '$lib/types';

export type DrawerName = 'cart' | 'wishlist' | 'marty' | null;

let drawer = $state<DrawerName>(null);
let quickView = $state<Product | null>(null);
let toastMessage = $state<string | null>(null);
let toastTimer: ReturnType<typeof setTimeout> | null = null;

export const ui = {
	get drawer(): DrawerName {
		return drawer;
	},
	get quickView(): Product | null {
		return quickView;
	},
	get toast(): string | null {
		return toastMessage;
	},
	get hasOverlay(): boolean {
		return drawer !== null || quickView !== null;
	},
	openDrawer(name: Exclude<DrawerName, null>) {
		quickView = null;
		drawer = name;
	},
	closeDrawer() {
		drawer = null;
	},
	openQuickView(product: Product) {
		quickView = product;
	},
	closeQuickView() {
		quickView = null;
	},
	closeAll() {
		drawer = null;
		quickView = null;
	},
	showToast(message: string, duration = 2600) {
		toastMessage = message;
		if (toastTimer) clearTimeout(toastTimer);
		toastTimer = setTimeout(() => {
			toastMessage = null;
		}, duration);
	}
};
