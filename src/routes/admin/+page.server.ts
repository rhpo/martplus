import { listAllProducts } from '$lib/server/services/catalog.service';
import { listOrders } from '$lib/server/services/order.service';
import type { OrderStatus } from '$lib/types';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [orders, products] = await Promise.all([listOrders(), listAllProducts()]);

	const statusCounts: Record<string, number> = {
		pending: 0,
		confirmed: 0,
		preparing: 0,
		out_for_delivery: 0,
		delivered: 0,
		cancelled: 0
	};
	let revenue = 0;
	for (const o of orders) {
		statusCounts[o.status] = (statusCounts[o.status] ?? 0) + 1;
		if (o.status !== ('cancelled' as OrderStatus)) revenue += o.total;
	}

	const lowStock = products
		.filter((p) => p.stock < 5)
		.sort((a, b) => a.stock - b.stock)
		.slice(0, 20);

	return {
		orderCount: orders.length,
		productCount: products.length,
		statusCounts,
		revenue,
		recentOrders: orders.slice(0, 6),
		lowStock
	};
};
