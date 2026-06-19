import { error } from '@sveltejs/kit';
import { getCategory, getProduct, listByCategory } from '$lib/server/services/catalog.service';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const product = getProduct(params.slug);
	if (!product) throw error(404, 'Produit introuvable');

	const related = listByCategory(product.category_slug)
		.filter((p) => p.id !== product.id)
		.slice(0, 4);

	return {
		product,
		category: getCategory(product.category_slug),
		related
	};
};
