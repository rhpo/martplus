import { error } from '@sveltejs/kit';
import { getCategory, listByCategory } from '$lib/server/services/catalog.service';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const category = await getCategory(params.slug);
	if (!category) throw error(404, 'Catégorie introuvable');

	return {
		category,
		products: await listByCategory(params.slug)
	};
};
