import { createHmac, timingSafeEqual } from 'node:crypto';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import type { Cookies } from '@sveltejs/kit';

const COOKIE_NAME = 'mp_admin';
const MAX_AGE = 60 * 60 * 12; // 12h

function secret(): string {
	return env.SESSION_SECRET ?? 'dev-insecure-secret-change-me';
}

function sign(value: string): string {
	return createHmac('sha256', secret()).update(value).digest('hex');
}

function safeEqual(a: string, b: string): boolean {
	const ab = Buffer.from(a);
	const bb = Buffer.from(b);
	if (ab.length !== bb.length) return false;
	return timingSafeEqual(ab, bb);
}

/** Compare a submitted password to ADMIN_PASSWORD (constant-time). */
export function verifyPassword(password: string): boolean {
	const expected = env.ADMIN_PASSWORD ?? '';
	if (!expected) return false;
	return safeEqual(password, expected);
}

/** Build the signed session token (issued-at . signature). */
function makeToken(): string {
	const issued = Date.now().toString();
	return `${issued}.${sign(issued)}`;
}

/** Validate a session token (signature + freshness). */
export function isValidToken(token: string | undefined): boolean {
	if (!token) return false;
	const [issued, sig] = token.split('.');
	if (!issued || !sig) return false;
	if (!safeEqual(sig, sign(issued))) return false;
	const age = (Date.now() - Number(issued)) / 1000;
	return Number.isFinite(age) && age >= 0 && age <= MAX_AGE;
}

export function setSession(cookies: Cookies): void {
	cookies.set(COOKIE_NAME, makeToken(), {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: !dev,
		maxAge: MAX_AGE
	});
}

export function clearSession(cookies: Cookies): void {
	cookies.delete(COOKIE_NAME, { path: '/' });
}

export function readSession(cookies: Cookies): boolean {
	return isValidToken(cookies.get(COOKIE_NAME));
}
