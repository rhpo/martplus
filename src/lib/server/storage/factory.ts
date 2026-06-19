import type { Storage } from './types';
import { S3Storage } from './s3';

let storage: Storage | null = null;

/** Returns the Storage impl for STORAGE_DRIVER (s3 now). */
export function getStorage(): Storage {
	if (storage) return storage;

	const driver = process.env.STORAGE_DRIVER ?? 's3';
	switch (driver) {
		case 's3':
		default:
			storage = new S3Storage();
			return storage;
	}
}
