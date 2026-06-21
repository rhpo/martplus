import { SIGNATURE_DUOS, flashDealsEndsAt } from '$lib/config';
import {
	getProduct,
	getProductsBySlugs,
	listBestsellers,
	listFlashDeals,
	searchProducts
} from '$lib/server/services/catalog.service';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const q = url.searchParams.get('q')?.trim() ?? '';

	if (q) {
		return {
			query: q,
			searchResults: await searchProducts(q),
			isSearch: true as const
		};
	}

	const duos = await Promise.all(
		SIGNATURE_DUOS.map(async (duo) => ({
			id: duo.id,
			title: duo.title,
			tagline: duo.tagline,
			emoji: duo.emoji,
			products: await getProductsBySlugs([...duo.productSlugs])
		}))
	);

	const [heroProduct, flashDeals, bestsellers] = await Promise.all([
		getProduct('toffifee-white-x15'),
		listFlashDeals(),
		listBestsellers(12)
	]);

	return {
		isSearch: false as const,
		heroProduct,
		flashDeals,
		flashEndsAt: flashDealsEndsAt().toISOString(),
		bestsellers,
		duos
	};
};
