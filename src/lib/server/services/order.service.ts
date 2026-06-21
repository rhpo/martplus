import { randomBytes } from 'node:crypto';
import { STORE_LOCATION } from '$lib/config';
import type { Order, OrderStatus, PaymentMethod } from '$lib/types';
import { computeDeliveryFee, haversineKm, isValidLatLng } from '$lib/utils/geo';
import { getRepositories } from '../repositories/factory';
import type { OrderItemInput } from '../repositories/types';
import { sendOrderRecap, sendStatusUpdate } from '../contact/contact.service';

export interface PlaceOrderInput {
	items: { productId: number; quantity: number }[];
	customer_name: string;
	customer_phone: string;
	customer_address: string;
	customer_email?: string | null;
	customer_lat: number;
	customer_lng: number;
	marketing_opt_in: boolean;
	payment_method: PaymentMethod;
	coupon_code?: string | null;
}

export class OrderError extends Error {}

const PAYMENT_METHODS: PaymentMethod[] = ['cod', 'cib', 'edahabia'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateCustomer(input: {
	customer_name: string;
	customer_phone: string;
	customer_address: string;
	customer_email?: string | null;
}): void {
	if (!input.customer_name?.trim()) throw new OrderError('Le nom complet est requis.');
	const phone = input.customer_phone?.replace(/[\s.\-+()]/g, '') ?? '';
	if (phone.length < 8 || !/^\d+$/.test(phone)) throw new OrderError('Numéro de téléphone invalide.');
	if (!input.customer_address?.trim()) throw new OrderError("L'adresse de livraison est requise.");
	if (input.customer_email && !EMAIL_RE.test(input.customer_email.trim())) {
		throw new OrderError('Adresse e-mail invalide.');
	}
}

async function generateRef(): Promise<string> {
	const repo = getRepositories().orders;
	for (let i = 0; i < 8; i++) {
		const ref = 'MP-' + randomBytes(3).toString('hex').toUpperCase();
		if (!(await repo.getByRef(ref))) return ref;
	}
	return 'MP-' + Date.now().toString(16).toUpperCase().slice(-6);
}

function round(n: number): number {
	return Math.round(n);
}

function isStockError(err: unknown): boolean {
	return err instanceof Error && /STOCK_INSUFFISANT/i.test(err.message);
}

/** Place an order — server-authoritative; the atomic write happens in a Postgres RPC. */
export async function placeOrder(input: PlaceOrderInput): Promise<Order> {
	validateCustomer(input);

	if (!isValidLatLng({ lat: input.customer_lat, lng: input.customer_lng })) {
		throw new OrderError('Veuillez placer le repère de livraison sur la carte.');
	}
	if (!PAYMENT_METHODS.includes(input.payment_method)) {
		throw new OrderError('Mode de paiement invalide.');
	}
	if (!input.items || input.items.length === 0) {
		throw new OrderError('Votre panier est vide.');
	}

	const repos = getRepositories();

	// Re-fetch products from the DB; reject missing or insufficient stock (advisory —
	// the RPC re-checks stock atomically to prevent oversell under concurrency).
	const wanted = input.items.map((l) => ({
		productId: Number(l.productId),
		quantity: Math.floor(Number(l.quantity))
	}));
	if (wanted.some((l) => !Number.isFinite(l.quantity) || l.quantity <= 0)) {
		throw new OrderError('Quantité invalide.');
	}

	const products = await repos.products.getManyByIds(wanted.map((l) => l.productId));
	const byId = new Map(products.map((p) => [p.id, p]));

	const lineItems: OrderItemInput[] = wanted.map((l) => {
		const product = byId.get(l.productId);
		if (!product) throw new OrderError(`Produit introuvable (#${l.productId}).`);
		if (l.quantity > product.stock) {
			throw new OrderError(`Stock insuffisant pour « ${product.name} ».`);
		}
		return {
			product_id: product.id,
			name_snapshot: product.name,
			price_snapshot: product.price,
			quantity: l.quantity
		};
	});

	const subtotal = lineItems.reduce((sum, li) => sum + li.price_snapshot * li.quantity, 0);

	let discount = 0;
	let appliedCode: string | null = null;
	if (input.coupon_code) {
		const coupon = await repos.coupons.getActive(input.coupon_code);
		if (coupon) {
			discount = round((subtotal * coupon.percent) / 100);
			appliedCode = coupon.code;
		}
	}

	const distanceKm = haversineKm(STORE_LOCATION, {
		lat: input.customer_lat,
		lng: input.customer_lng
	});
	const deliveryFee = computeDeliveryFee(subtotal - discount, distanceKm);
	const total = subtotal - discount + deliveryFee;

	let order: Order;
	try {
		order = await repos.orders.create({
			public_ref: await generateRef(),
			customer_name: input.customer_name.trim(),
			customer_phone: input.customer_phone.trim(),
			customer_address: input.customer_address.trim(),
			customer_lat: input.customer_lat,
			customer_lng: input.customer_lng,
			distance_km: Math.round(distanceKm * 100) / 100,
			customer_email: input.customer_email?.trim() || null,
			marketing_opt_in: input.marketing_opt_in,
			payment_method: input.payment_method,
			coupon_code: appliedCode,
			subtotal,
			discount,
			delivery_fee: deliveryFee,
			total,
			items: lineItems
		});
	} catch (err) {
		if (isStockError(err)) throw new OrderError('Stock insuffisant — un article vient de partir.');
		throw err;
	}

	// After commit — email must never break order creation.
	await sendOrderRecap(order, 'new');
	return order;
}

export interface AdminUpdateOrderInput {
	orderId: number;
	customer_name?: string;
	customer_phone?: string;
	customer_address?: string;
	customer_email?: string | null;
	items: { productId: number; quantity: number }[];
}

/** Admin edits an ongoing order — stock deltas + totals applied atomically in a Postgres RPC. */
export async function adminUpdateOrder(input: AdminUpdateOrderInput): Promise<Order> {
	const repos = getRepositories();

	const current = await repos.orders.getById(input.orderId);
	if (!current) throw new OrderError('Commande introuvable.');

	// Desired new item set (merge duplicate product ids, drop non-positive).
	const newQty = new Map<number, number>();
	for (const line of input.items) {
		const pid = Number(line.productId);
		const qty = Math.floor(Number(line.quantity));
		if (!Number.isFinite(qty) || qty <= 0) continue;
		newQty.set(pid, (newQty.get(pid) ?? 0) + qty);
	}
	if (newQty.size === 0) throw new OrderError('Une commande doit contenir au moins un article.');

	// Keep snapshots for existing items; snapshot current price/name for newly added ones.
	const existingSnapshot = new Map(current.items.map((it) => [it.product_id, it]));
	const items: OrderItemInput[] = [];
	for (const [pid, qty] of newQty) {
		const prev = existingSnapshot.get(pid);
		if (prev) {
			items.push({
				product_id: pid,
				name_snapshot: prev.name_snapshot,
				price_snapshot: prev.price_snapshot,
				quantity: qty
			});
		} else {
			const product = await repos.products.getById(pid);
			if (!product) throw new OrderError(`Produit introuvable (#${pid}).`);
			items.push({
				product_id: pid,
				name_snapshot: product.name,
				price_snapshot: product.price,
				quantity: qty
			});
		}
	}

	const subtotal = items.reduce((sum, it) => sum + it.price_snapshot * it.quantity, 0);
	let discount = 0;
	if (current.coupon_code) {
		const coupon = await repos.coupons.getActive(current.coupon_code);
		if (coupon) discount = round((subtotal * coupon.percent) / 100);
	}
	const deliveryFee = computeDeliveryFee(subtotal - discount, current.distance_km);
	const total = subtotal - discount + deliveryFee;

	let order: Order;
	try {
		order = await repos.orders.adminUpdate(input.orderId, {
			customer_name: input.customer_name?.trim(),
			customer_phone: input.customer_phone?.trim(),
			customer_address: input.customer_address?.trim(),
			customer_email:
				input.customer_email === undefined ? undefined : input.customer_email?.trim() || null,
			items,
			subtotal,
			discount,
			delivery_fee: deliveryFee,
			total
		});
	} catch (err) {
		if (isStockError(err)) throw new OrderError('Stock insuffisant pour la quantité demandée.');
		throw err;
	}

	await sendOrderRecap(order, 'updated');
	return order;
}

/** Change an order's status; emails the customer if an address is on file. */
export async function setOrderStatus(orderId: number, status: OrderStatus): Promise<Order> {
	const repos = getRepositories();
	const valid: OrderStatus[] = [
		'pending',
		'confirmed',
		'preparing',
		'out_for_delivery',
		'delivered',
		'cancelled'
	];
	if (!valid.includes(status)) throw new OrderError('Statut invalide.');

	await repos.orders.setStatus(orderId, status);
	const order = await repos.orders.getById(orderId);
	if (!order) throw new OrderError('Commande introuvable.');

	await sendStatusUpdate(order);
	return order;
}

export async function listOrders(): Promise<Order[]> {
	return getRepositories().orders.listAll();
}

export async function getOrderByRef(ref: string): Promise<Order | null> {
	return getRepositories().orders.getByRef(ref);
}
