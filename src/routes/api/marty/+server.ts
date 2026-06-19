import { json } from '@sveltejs/kit';
import { martyReply } from '$lib/server/services/marty.service';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	let message = '';
	try {
		const body = await request.json();
		message = typeof body?.message === 'string' ? body.message : '';
	} catch {
		message = '';
	}
	return json(await martyReply(message));
};
