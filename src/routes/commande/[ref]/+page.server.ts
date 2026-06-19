import { error } from '@sveltejs/kit';
import { getOrderByRef } from '$lib/server/services/order.service';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const order = getOrderByRef(params.ref);
	if (!order) throw error(404, 'Commande introuvable');
	return { order };
};
