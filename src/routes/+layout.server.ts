import { env } from '$env/dynamic/private';
import { listCategories } from '$lib/server/services/catalog.service';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals }) => {
	return {
		categories: listCategories(),
		theme: locals.theme,
		whatsappNumber: env.WHATSAPP_NUMBER ?? '213600000000'
	};
};
