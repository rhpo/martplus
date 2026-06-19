import { browser } from '$app/environment';
import type { Theme } from '$lib/types';
import { get, writable } from 'svelte/store';

const STORAGE_KEY = 'martplus-theme';

function initial(): Theme {
	if (!browser) return 'light';
	const fromDom = document.documentElement.dataset.theme;
	if (fromDom === 'light' || fromDom === 'dark') return fromDom;
	const stored = localStorage.getItem(STORAGE_KEY);
	if (stored === 'light' || stored === 'dark') return stored;
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export let currentTheme = writable<Theme>(initial());

function apply(theme: Theme): void {
	if (!browser) return;
	document.documentElement.dataset.theme = theme;
	localStorage.setItem(STORAGE_KEY, theme);
	// Mirror into a cookie so SSR can render the right theme with no flash.
	document.cookie = `${STORAGE_KEY}=${theme};path=/;max-age=31536000;samesite=lax`;
}

export const theme = {
	get current(): Theme {
		return get(currentTheme);
	},
	set(next: Theme) {
		currentTheme.set(next);
		apply(next);
	},
	toggle() {
		this.set(this.current === 'dark' ? 'light' : 'dark');
	}
};
