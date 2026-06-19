import { error } from '@sveltejs/kit';
import { getCategory, listByCategory } from '$lib/server/services/catalog.service';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const category = getCategory(params.slug);
	if (!category) throw error(404, 'Catégorie introuvable');

	return {
		category,
		products: listByCategory(params.slug)
	};
};
