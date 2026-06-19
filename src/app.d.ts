// See https://svelte.dev/docs/kit/types#app.d.ts
import type { Theme } from '$lib/types';

declare global {
	namespace App {
		interface Locals {
			isAdmin: boolean;
			theme: Theme;
		}
		// interface Error {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
