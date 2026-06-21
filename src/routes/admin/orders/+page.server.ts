import { fail } from '@sveltejs/kit';
import type { OrderStatus } from '$lib/types';
import {
	OrderError,
	adminUpdateOrder,
	listOrders,
	setOrderStatus
} from '$lib/server/services/order.service';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return { orders: await listOrders() };
};

export const actions: Actions = {
	updateStatus: async ({ request }) => {
		const form = await request.formData();
		const orderId = Number(form.get('orderId'));
		const status = form.get('status')?.toString() as OrderStatus;
		try {
			await setOrderStatus(orderId, status);
			return { success: true };
		} catch (err) {
			if (err instanceof OrderError) return fail(400, { message: err.message });
			throw err;
		}
	},

	editOrder: async ({ request }) => {
		const form = await request.formData();
		const orderId = Number(form.get('orderId'));

		let items: { productId: number; quantity: number }[] = [];
		try {
			const parsed = JSON.parse(form.get('items')?.toString() ?? '[]');
			if (Array.isArray(parsed)) {
				items = parsed
					.map((it) => ({ productId: Number(it.productId), quantity: Number(it.quantity) }))
					.filter((it) => Number.isFinite(it.productId) && it.quantity > 0);
			}
		} catch {
			items = [];
		}

		try {
			await adminUpdateOrder({
				orderId,
				customer_name: form.get('customer_name')?.toString() || undefined,
				customer_phone: form.get('customer_phone')?.toString() || undefined,
				customer_address: form.get('customer_address')?.toString() || undefined,
				customer_email:
					form.get('customer_email') === null
						? undefined
						: form.get('customer_email')?.toString() || null,
				items
			});
			return { success: true };
		} catch (err) {
			if (err instanceof OrderError) return fail(400, { message: err.message });
			throw err;
		}
	}
};
