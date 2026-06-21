import { error } from '@sveltejs/kit';
import { getCategory, getProduct, listByCategory } from '$lib/server/services/catalog.service';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const product = await getProduct(params.slug);
	if (!product) throw error(404, 'Produit introuvable');

	const [related, category] = await Promise.all([
		listByCategory(product.category_slug),
		getCategory(product.category_slug)
	]);

	return {
		product,
		category,
		related: related.filter((p) => p.id !== product.id).slice(0, 4)
	};
};
