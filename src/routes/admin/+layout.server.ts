import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals, url }) => {
	const isLogin = url.pathname === '/admin/login';
	if (!locals.isAdmin && !isLogin) {
		throw redirect(303, '/admin/login');
	}
	if (locals.isAdmin && isLogin) {
		throw redirect(303, '/admin');
	}
	return { isAdmin: locals.isAdmin };
};
