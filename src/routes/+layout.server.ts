import { env } from '$env/dynamic/private';
import { listCategories } from '$lib/server/services/catalog.service';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	return {
		categories: await listCategories(),
		theme: locals.theme,
		whatsappNumber: env.WHATSAPP_NUMBER ?? 'NONUMBER'
	};
};
