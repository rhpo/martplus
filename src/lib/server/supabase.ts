import { env } from '$env/dynamic/private';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

/**
 * Server-side Supabase client (service-role key → bypasses RLS for trusted
 * server operations). Never import this from client code; it lives under
 * `$lib/server` so SvelteKit refuses to bundle it into the browser.
 */
export function getSupabase(): SupabaseClient {
	if (client) return client;

	const url = env.SUPABASE_URL;
	const key = env.SUPABASE_SERVICE_ROLE_KEY;
	if (!url || !key) {
		throw new Error(
			'Supabase non configuré : définissez SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans .env'
		);
	}

	client = createClient(url, key, {
		auth: { persistSession: false, autoRefreshToken: false }
	});
	return client;
}

export const STORAGE_BUCKET = (): string => env.SUPABASE_STORAGE_BUCKET ?? 'product-images';
