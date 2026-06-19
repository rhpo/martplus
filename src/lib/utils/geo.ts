import { DELIVERY } from '$lib/config';
import type { LatLng } from '$lib/types';

const EARTH_RADIUS_KM = 6371;

function toRad(deg: number): number {
	return (deg * Math.PI) / 180;
}

/** Great-circle (haversine) distance in km between two points. No routing service. */
export function haversineKm(a: LatLng, b: LatLng): number {
	const dLat = toRad(b.lat - a.lat);
	const dLng = toRad(b.lng - a.lng);
	const lat1 = toRad(a.lat);
	const lat2 = toRad(b.lat);

	const h =
		Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
	const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
	return EARTH_RADIUS_KM * c;
}

/**
 * Delivery fee in DZD.
 * - Free (0) when subtotal after discount qualifies for free delivery.
 * - Otherwise clamp(base + perKm * km, base, cap), rounded to whole DZD.
 */
export function computeDeliveryFee(subtotalAfterDiscount: number, km: number): number {
	if (subtotalAfterDiscount >= DELIVERY.freeThreshold) return 0;
	const raw = DELIVERY.base + DELIVERY.perKm * Math.max(0, km);
	return Math.min(DELIVERY.cap, Math.round(raw));
}

/** Validate a pinned coordinate is sane (roughly on Earth). */
export function isValidLatLng(p: Partial<LatLng>): p is LatLng {
	return (
		typeof p.lat === 'number' &&
		typeof p.lng === 'number' &&
		Number.isFinite(p.lat) &&
		Number.isFinite(p.lng) &&
		p.lat >= -90 &&
		p.lat <= 90 &&
		p.lng >= -180 &&
		p.lng <= 180
	);
}
