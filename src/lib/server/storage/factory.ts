import type { Storage } from './types';
import { SupabaseStorage } from './supabase';

let storage: Storage | null = null;

/** Storage backed by Supabase Storage (@supabase/supabase-js). */
export function getStorage(): Storage {
	if (storage) return storage;
	storage = new SupabaseStorage();
	return storage;
}
