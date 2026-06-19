import { getDb } from '$lib/server/db';
import type { Order, OrderItem, OrderStatus, PaymentMethod } from '$lib/types';
import type { NewOrderInput, OrderRepository } from '../types';

interface OrderRow {
	id: number;
	public_ref: string;
	customer_name: string;
	customer_phone: string;
	customer_address: string;
	customer_lat: number;
	customer_lng: number;
	distance_km: number;
	customer_email: string | null;
	marketing_opt_in: number;
	payment_method: string;
	coupon_code: string | null;
	subtotal: number;
	discount: number;
	delivery_fee: number;
	total: number;
	status: string;
	created_at: string;
	updated_at: string | null;
}

function toOrder(r: OrderRow, items: OrderItem[]): Order {
	return {
		id: r.id,
		public_ref: r.public_ref,
		customer_name: r.customer_name,
		customer_phone: r.customer_phone,
		customer_address: r.customer_address,
		customer_lat: r.customer_lat,
		customer_lng: r.customer_lng,
		distance_km: r.distance_km,
		customer_email: r.customer_email,
		marketing_opt_in: r.marketing_opt_in === 1,
		payment_method: r.payment_method as PaymentMethod,
		coupon_code: r.coupon_code,
		subtotal: r.subtotal,
		discount: r.discount,
		delivery_fee: r.delivery_fee,
		total: r.total,
		status: r.status as OrderStatus,
		created_at: r.created_at,
		updated_at: r.updated_at,
		items
	};
}

const ORDER_COLS = `id, public_ref, customer_name, customer_phone, customer_address,
	customer_lat, customer_lng, distance_km, customer_email, marketing_opt_in, payment_method,
	coupon_code, subtotal, discount, delivery_fee, total, status, created_at, updated_at`;

export class SqliteOrderRepository implements OrderRepository {
	private itemsFor(orderId: number): OrderItem[] {
		return getDb()
			.prepare(
				'SELECT id, order_id, product_id, name_snapshot, price_snapshot, quantity FROM order_items WHERE order_id = ? ORDER BY id'
			)
			.all(orderId) as OrderItem[];
	}

	create(input: NewOrderInput): Order {
		const db = getDb();
		const info = db
			.prepare(
				`INSERT INTO orders
				 (public_ref, customer_name, customer_phone, customer_address, customer_lat, customer_lng,
				  distance_km, customer_email, marketing_opt_in, payment_method, coupon_code,
				  subtotal, discount, delivery_fee, total, status)
				 VALUES (@public_ref, @customer_name, @customer_phone, @customer_address, @customer_lat,
				  @customer_lng, @distance_km, @customer_email, @marketing_opt_in, @payment_method,
				  @coupon_code, @subtotal, @discount, @delivery_fee, @total, 'pending')`
			)
			.run({
				...input,
				customer_email: input.customer_email ?? null,
				coupon_code: input.coupon_code ?? null,
				marketing_opt_in: input.marketing_opt_in ? 1 : 0
			});

		const orderId = Number(info.lastInsertRowid);
		const itemStmt = db.prepare(
			'INSERT INTO order_items (order_id, product_id, name_snapshot, price_snapshot, quantity) VALUES (?, ?, ?, ?, ?)'
		);
		for (const it of input.items) {
			itemStmt.run(orderId, it.product_id, it.name_snapshot, it.price_snapshot, it.quantity);
		}
		return this.getById(orderId)!;
	}

	getByRef(ref: string): Order | null {
		const r = getDb().prepare(`SELECT ${ORDER_COLS} FROM orders WHERE public_ref = ?`).get(ref) as
			| OrderRow
			| undefined;
		return r ? toOrder(r, this.itemsFor(r.id)) : null;
	}

	getById(id: number): Order | null {
		const r = getDb().prepare(`SELECT ${ORDER_COLS} FROM orders WHERE id = ?`).get(id) as
			| OrderRow
			| undefined;
		return r ? toOrder(r, this.itemsFor(r.id)) : null;
	}

	listAll(): Order[] {
		const rows = getDb()
			.prepare(`SELECT ${ORDER_COLS} FROM orders ORDER BY created_at DESC, id DESC`)
			.all() as OrderRow[];
		return rows.map((r) => toOrder(r, this.itemsFor(r.id)));
	}

	setStatus(id: number, status: OrderStatus): void {
		getDb()
			.prepare("UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?")
			.run(status, id);
	}

	replaceItems(
		orderId: number,
		items: { product_id: number; name_snapshot: string; price_snapshot: number; quantity: number }[]
	): void {
		const db = getDb();
		db.prepare('DELETE FROM order_items WHERE order_id = ?').run(orderId);
		const stmt = db.prepare(
			'INSERT INTO order_items (order_id, product_id, name_snapshot, price_snapshot, quantity) VALUES (?, ?, ?, ?, ?)'
		);
		for (const it of items) {
			stmt.run(orderId, it.product_id, it.name_snapshot, it.price_snapshot, it.quantity);
		}
	}

	updateTotalsAndCustomer(
		orderId: number,
		patch: {
			customer_name?: string;
			customer_phone?: string;
			customer_address?: string;
			customer_email?: string | null;
			subtotal: number;
			discount: number;
			delivery_fee: number;
			total: number;
		}
	): void {
		const sets = ['subtotal = @subtotal', 'discount = @discount', 'delivery_fee = @delivery_fee', 'total = @total', "updated_at = datetime('now')"];
		const params: Record<string, unknown> = {
			id: orderId,
			subtotal: patch.subtotal,
			discount: patch.discount,
			delivery_fee: patch.delivery_fee,
			total: patch.total
		};
		for (const k of ['customer_name', 'customer_phone', 'customer_address', 'customer_email'] as const) {
			if (k in patch && patch[k] !== undefined) {
				sets.push(`${k} = @${k}`);
				params[k] = patch[k] ?? null;
			}
		}
		getDb().prepare(`UPDATE orders SET ${sets.join(', ')} WHERE id = @id`).run(params);
	}
}
