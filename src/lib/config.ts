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

/** Signature duos of French terroir products (Section 10). */
export const SIGNATURE_DUOS = [
	{
		id: 'plateau-apero',
		title: 'Le Plateau Apéro du Terroir',
		tagline: 'Comté Réserve + Chips au Fromage du Jura',
		emoji: '🧀',
		productSlugs: ['fromage-comte-reserve', 'chips-brets-jura']
	},
	{
		id: 'douceur-regions',
		title: 'Douceur Sucrée de Nos Régions',
		tagline: 'Chocolat Fleur de Sel + Caramels au Beurre Salé',
		emoji: '🍫',
		productSlugs: ['choc-fleur-de-sel', 'bonbon-caramel-bsale']
	},
	{
		id: 'heure-du-gouter',
		title: "L'Heure du Goûter",
		tagline: 'Sablés Pur Beurre + Miel de Provence',
		emoji: '🍯',
		productSlugs: ['biscuit-sable-breton', 'epic-miel-provence']
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
