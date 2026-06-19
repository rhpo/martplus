import { fail, redirect } from '@sveltejs/kit';
import type { PaymentMethod } from '$lib/types';
import { OrderError, placeOrder } from '$lib/server/services/order.service';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await request.formData();

		let items: { productId: number; quantity: number }[] = [];
		try {
			const raw = form.get('items')?.toString() ?? '[]';
			const parsed = JSON.parse(raw);
			if (Array.isArray(parsed)) {
				items = parsed
					.map((it) => ({ productId: Number(it.productId), quantity: Number(it.quantity) }))
					.filter((it) => Number.isFinite(it.productId) && Number.isFinite(it.quantity));
			}
		} catch {
			items = [];
		}

		const lat = Number(form.get('lat'));
		const lng = Number(form.get('lng'));

		try {
			const order = await placeOrder({
				items,
				customer_name: form.get('customer_name')?.toString() ?? '',
				customer_phone: form.get('customer_phone')?.toString() ?? '',
				customer_address: form.get('customer_address')?.toString() ?? '',
				customer_email: form.get('customer_email')?.toString() || null,
				customer_lat: lat,
				customer_lng: lng,
				marketing_opt_in: form.get('marketing_opt_in')?.toString() === 'on',
				payment_method: (form.get('payment_method')?.toString() ?? 'cod') as PaymentMethod,
				coupon_code: form.get('coupon_code')?.toString() || null
			});

			throw redirect(303, `/commande/${order.public_ref}`);
		} catch (err) {
			if (err instanceof OrderError) {
				return fail(400, { message: err.message });
			}
			// re-throw redirects and unexpected errors
			throw err;
		}
	}
};
