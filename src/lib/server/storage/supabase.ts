import { getSupabase, STORAGE_BUCKET } from '$lib/server/supabase';
import type { Storage, UploadResult } from './types';

function isAbsoluteUrl(s: string): boolean {
	return /^https?:\/\//i.test(s);
}

export class SupabaseStorage implements Storage {
	private bucket = STORAGE_BUCKET();

	async upload(key: string, bytes: Uint8Array | Buffer, contentType: string): Promise<UploadResult> {
		const { error } = await getSupabase()
			.storage.from(this.bucket)
			.upload(key, bytes, { contentType, upsert: true });
		if (error) throw new Error(`[storage] upload: ${error.message}`);
		return { key, url: this.getUrl(key) };
	}

	async delete(key: string): Promise<void> {
		if (!key || isAbsoluteUrl(key)) return;
		const { error } = await getSupabase().storage.from(this.bucket).remove([key]);
		if (error) throw new Error(`[storage] delete: ${error.message}`);
	}

	getUrl(key: string | null | undefined): string {
		const k = key?.trim();
		// Guard against empty / literal "NULL" keys (bad seed data) → no broken URL.
		if (!k || k.toUpperCase() === 'NULL') return '';
		// Existing seed rows hold absolute URLs — pass them through unchanged.
		if (isAbsoluteUrl(k)) return k;
		return getSupabase().storage.from(this.bucket).getPublicUrl(k).data.publicUrl;
	}
}
