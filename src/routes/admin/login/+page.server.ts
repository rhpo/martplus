import { fail, redirect } from '@sveltejs/kit';
import { clearSession, setSession, verifyPassword } from '$lib/server/auth';
import type { Actions } from './$types';

export const actions: Actions = {
	login: async ({ request, cookies }) => {
		const form = await request.formData();
		const password = form.get('password')?.toString() ?? '';
		if (!verifyPassword(password)) {
			return fail(401, { message: 'Mot de passe incorrect.' });
		}
		setSession(cookies);
		throw redirect(303, '/admin');
	},
	logout: async ({ cookies }) => {
		clearSession(cookies);
		throw redirect(303, '/admin/login');
	}
};
