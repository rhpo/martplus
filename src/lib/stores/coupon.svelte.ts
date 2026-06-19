import { browser } from '$app/environment';
import { PROMO_CODE } from '$lib/config';

const STORAGE_KEY = 'martplus-coupon';

function load(): string | null {
	if (!browser) return null;
	const v = localStorage.getItem(STORAGE_KEY);
	return v && v.length > 0 ? v : null;
}

let code = $state<string | null>(load());

export const coupon = {
	get code(): string | null {
		return code;
	},
	/** Known demo coupon → 10%. Server still recomputes authoritatively. */
	get percent(): number {
		return code === PROMO_CODE ? 10 : 0;
	},
	discountOn(subtotal: number): number {
		return Math.round((subtotal * this.percent) / 100);
	},
	set(next: string | null) {
		code = next && next.length > 0 ? next.toUpperCase() : null;
		if (browser) {
			if (code) localStorage.setItem(STORAGE_KEY, code);
			else localStorage.removeItem(STORAGE_KEY);
		}
	}
};
