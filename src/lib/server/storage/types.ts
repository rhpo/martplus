export interface UploadResult {
	key: string;
	url: string;
}

export interface Storage {
	/** Upload bytes under `key`; returns the key and a public URL. */
	upload(key: string, bytes: Uint8Array | Buffer, contentType: string): Promise<UploadResult>;
	delete(key: string): Promise<void>;
	/**
	 * Resolve a stored key to a renderable URL.
	 * - absolute URLs (http/https) pass through unchanged,
	 * - otherwise S3_PUBLIC_BASE_URL + '/' + key.
	 */
	getUrl(key: string | null | undefined): string;
}
