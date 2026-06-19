import {
	DeleteObjectCommand,
	GetObjectCommand,
	PutObjectCommand,
	S3Client
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { Storage, UploadResult } from './types';

function isAbsoluteUrl(s: string): boolean {
	return /^https?:\/\//i.test(s);
}

export class S3Storage implements Storage {
	private client: S3Client;
	private bucket: string;
	private publicBase: string | undefined;

	constructor() {
		this.client = new S3Client({
			region: process.env.AWS_REGION ?? 'eu-west-3'
		});
		this.bucket = process.env.S3_BUCKET ?? '';
		this.publicBase = process.env.S3_PUBLIC_BASE_URL?.replace(/\/+$/, '');
	}

	async upload(key: string, bytes: Uint8Array | Buffer, contentType: string): Promise<UploadResult> {
		await this.client.send(
			new PutObjectCommand({
				Bucket: this.bucket,
				Key: key,
				Body: bytes,
				ContentType: contentType
			})
		);
		return { key, url: this.getUrl(key) };
	}

	async delete(key: string): Promise<void> {
		if (!key || isAbsoluteUrl(key)) return;
		await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
	}

	getUrl(key: string | null | undefined): string {
		if (!key) return '';
		if (isAbsoluteUrl(key)) return key;
		if (this.publicBase) return `${this.publicBase}/${key.replace(/^\/+/, '')}`;
		return `/${key.replace(/^\/+/, '')}`;
	}

	/** Presigned GET URL - for private buckets without a public base. */
	async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
		if (isAbsoluteUrl(key)) return key;
		return getSignedUrl(
			this.client,
			new GetObjectCommand({ Bucket: this.bucket, Key: key }),
			{ expiresIn }
		);
	}
}
