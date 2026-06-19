import { SIGNATURE_DUOS, flashDealsEndsAt } from '$lib/config';
import {
	getProduct,
	getProductsBySlugs,
	listBestsellers,
	listFlashDeals,
	searchProducts
} from '$lib/server/services/catalog.service';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ url }) => {
	const q = url.searchParams.get('q')?.trim() ?? '';

	if (q) {
		return {
			query: q,
			searchResults: searchProducts(q),
			isSearch: true as const
		};
	}

	const duos = SIGNATURE_DUOS.map((duo) => ({
		id: duo.id,
		title: duo.title,
		tagline: duo.tagline,
		emoji: duo.emoji,
		products: getProductsBySlugs([...duo.productSlugs])
	}));

	return {
		isSearch: false as const,
		heroProduct: getProduct('fromage-comte-reserve'),
		flashDeals: listFlashDeals(),
		flashEndsAt: flashDealsEndsAt().toISOString(),
		bestsellers: listBestsellers(12),
		duos
	};
};
