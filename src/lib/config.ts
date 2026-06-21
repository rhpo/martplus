import type { LatLng } from './types';

/** Currency: Algerian Dinar (DZD), displayed with a "DA" suffix. */
export const CURRENCY = {
	code: 'DZD',
	suffix: 'DA',
	thousandsSep: ' ',
	decimalSep: ','
} as const;

/** Distance-based delivery (all values in DZD). */
export const DELIVERY = {
	base: 300,
	perKm: 30,
	cap: 700,
	freeThreshold: 15000
} as const;

/** Fixed store location - central Algiers until the real shop coordinates are provided. */
export const STORE_LOCATION: LatLng = {
	lat: 36.7538,
	lng: 3.0588
};

/** Coupon shown in the UI as the demo promo code. */
export const PROMO_CODE = 'MARTPLUS10';

/** Flash deals countdown - ends at local end-of-day. */
export function flashDealsEndsAt(now = new Date()): Date {
	const end = new Date(now);
	end.setHours(23, 59, 59, 0);
	return end;
}

/** Signature duos — real catalogue products (with working images), paired by Marty. */
export const SIGNATURE_DUOS = [
	{
		id: 'plateau-apero',
		title: 'Le Plateau Apéro',
		tagline: 'Leerdammer + Pringles Salt & Vinegar',
		emoji: '🧀',
		productSlugs: ['leerdamer-500g', 'pringles-salt-vinegar-165g']
	},
	{
		id: 'douceur-sucree',
		title: 'Douceur Sucrée',
		tagline: 'LU Pockitos + Têtes Brûlées',
		emoji: '🍫',
		productSlugs: ['lu-pockitos-chocolat-au-lait', 'tetes-brulees-300g']
	},
	{
		id: 'pause-cafe',
		title: 'La Pause Café Gourmande',
		tagline: 'Biscuits Gullón + Café Carte Noire',
		emoji: '☕',
		productSlugs: ['gullon-doradas-al-horno', 'carte-noir-t10-lungo-classic-n-6']
	}
] as const;

/** Human-readable French order statuses. */
export const STATUS_LABELS: Record<string, string> = {
	pending: 'En attente',
	confirmed: 'Confirmée',
	preparing: 'En préparation',
	out_for_delivery: 'En route',
	delivered: 'Livrée',
	cancelled: 'Annulée'
};

export const PAYMENT_LABELS: Record<string, string> = {
	cod: 'Paiement à la livraison',
	cib: 'Carte CIB',
	edahabia: 'Edahabia'
};
