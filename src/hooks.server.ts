import type { Handle } from '@sveltejs/kit';
import { readSession } from '$lib/server/auth';
import type { Theme } from '$lib/types';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.isAdmin = readSession(event.cookies);

	const cookieTheme = event.cookies.get('martplus-theme');
	const theme: Theme = cookieTheme === 'dark' ? 'dark' : 'light';
	event.locals.theme = theme;

	return resolve(event, {
		transformPageChunk: ({ html }) => html.replace('data-theme="light"', `data-theme="${theme}"`)
	});
};
