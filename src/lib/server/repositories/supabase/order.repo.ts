import { getSupabase } from '$lib/server/supabase';
import type { Order, OrderItem, OrderStatus, PaymentMethod } from '$lib/types';
import type { AdminOrderUpdate, NewOrderInput, OrderRepository } from '../types';

const ITEM_COLS = 'id, order_id, product_id, name_snapshot, price_snapshot, quantity';
const ORDER_COLS = `id, public_ref, customer_name, customer_phone, customer_address,
	customer_lat, customer_lng, distance_km, customer_email, marketing_opt_in, payment_method,
	coupon_code, subtotal, discount, delivery_fee, total, status, created_at, updated_at,
	order_items(${ITEM_COLS})`;

function num(v: number | string | null | undefined): number {
	if (v === null || v === undefined) return 0;
	const n = typeof v === 'number' ? v : parseFloat(v);
	return Number.isFinite(n) ? n : 0;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function toOrder(r: any): Order {
	const items: OrderItem[] = (r.order_items ?? []).map((it: any) => ({
		id: it.id,
		order_id: it.order_id,
		product_id: it.product_id,
		name_snapshot: it.name_snapshot,
		price_snapshot: num(it.price_snapshot),
		quantity: it.quantity
	}));
	items.sort((a, b) => a.id - b.id);
	return {
		id: r.id,
		public_ref: r.public_ref,
		customer_name: r.customer_name,
		customer_phone: r.customer_phone,
		customer_address: r.customer_address,
		customer_lat: num(r.customer_lat),
		customer_lng: num(r.customer_lng),
		distance_km: num(r.distance_km),
		customer_email: r.customer_email,
		marketing_opt_in: !!r.marketing_opt_in,
		payment_method: r.payment_method as PaymentMethod,
		coupon_code: r.coupon_code,
		subtotal: num(r.subtotal),
		discount: num(r.discount),
		delivery_fee: num(r.delivery_fee),
		total: num(r.total),
		status: r.status as OrderStatus,
		created_at: r.created_at,
		updated_at: r.updated_at,
		items
	};
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export class SupabaseOrderRepository implements OrderRepository {
	async create(input: NewOrderInput): Promise<Order> {
		const { items, ...order } = input;
		const { data: orderId, error } = await getSupabase().rpc('place_order', {
			p_order: order,
			p_items: items
		});
		if (error) throw new Error(error.message);
		const created = await this.getById(Number(orderId));
		if (!created) throw new Error('Commande créée mais introuvable.');
		return created;
	}

	async adminUpdate(orderId: number, patch: AdminOrderUpdate): Promise<Order> {
		const { items, subtotal, discount, delivery_fee, total, ...customer } = patch;
		const { error } = await getSupabase().rpc('admin_update_order', {
			p_order_id: orderId,
			p_customer: customer,
			p_items: items,
			p_totals: { subtotal, discount, delivery_fee, total }
		});
		if (error) throw new Error(error.message);
		const updated = await this.getById(orderId);
		if (!updated) throw new Error('Commande introuvable après mise à jour.');
		return updated;
	}

	async getByRef(ref: string): Promise<Order | null> {
		const { data, error } = await getSupabase()
			.from('orders')
			.select(ORDER_COLS)
			.eq('public_ref', ref)
			.maybeSingle();
		if (error) throw new Error(`[orders] getByRef: ${error.message}`);
		return data ? toOrder(data) : null;
	}

	async getById(id: number): Promise<Order | null> {
		const { data, error } = await getSupabase()
			.from('orders')
			.select(ORDER_COLS)
			.eq('id', id)
			.maybeSingle();
		if (error) throw new Error(`[orders] getById: ${error.message}`);
		return data ? toOrder(data) : null;
	}

	async listAll(): Promise<Order[]> {
		const { data, error } = await getSupabase()
			.from('orders')
			.select(ORDER_COLS)
			.order('created_at', { ascending: false });
		if (error) throw new Error(`[orders] listAll: ${error.message}`);
		return (data ?? []).map(toOrder);
	}

	async setStatus(id: number, status: OrderStatus): Promise<void> {
		const { error } = await getSupabase()
			.from('orders')
			.update({ status, updated_at: new Date().toISOString() })
			.eq('id', id);
		if (error) throw new Error(`[orders] setStatus: ${error.message}`);
	}
}
