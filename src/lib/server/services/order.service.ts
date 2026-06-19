import { randomBytes } from 'node:crypto';
import { STORE_LOCATION } from '$lib/config';
import type { Order, PaymentMethod } from '$lib/types';
import { computeDeliveryFee, haversineKm, isValidLatLng } from '$lib/utils/geo';
import { transaction } from '../db/client';
import { getRepositories } from '../repositories/factory';
import { sendOrderRecap, sendStatusUpdate } from '../contact/contact.service';
import type { OrderStatus } from '$lib/types';

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

export class OrderError extends Error { }

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

function generateRef(): string {
	const repo = getRepositories().orders;
	for (let i = 0; i < 8; i++) {
		const ref = 'MP-' + randomBytes(3).toString('hex').toUpperCase();
		if (!repo.getByRef(ref)) return ref;
	}
	return 'MP-' + Date.now().toString(16).toUpperCase().slice(-6);
}

function round(n: number): number {
	return Math.round(n);
}

/** Place an order - server-authoritative, single transaction. Returns the public ref. */
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

	const order = transaction((): Order => {
		// Re-fetch each product; reject missing or insufficient stock.
		const lineItems = input.items.map((line) => {
			const qty = Math.floor(Number(line.quantity));
			if (!Number.isFinite(qty) || qty <= 0) throw new OrderError('Quantité invalide.');
			const product = repos.products.getById(Number(line.productId));
			if (!product) throw new OrderError(`Produit introuvable (#${line.productId}).`);
			if (qty > product.stock) {
				throw new OrderError(`Stock insuffisant pour « ${product.name} ».`);
			}
			return { product, qty };
		});

		const subtotal = lineItems.reduce((sum, li) => sum + li.product.price * li.qty, 0);

		// Coupon (server-side recompute from DB).
		let discount = 0;
		let appliedCode: string | null = null;
		if (input.coupon_code) {
			const coupon = repos.coupons.getActive(input.coupon_code);
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

		const created = repos.orders.create({
			public_ref: generateRef(),
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
			items: lineItems.map((li) => ({
				product_id: li.product.id,
				name_snapshot: li.product.name,
				price_snapshot: li.product.price,
				quantity: li.qty
			}))
		});

		for (const li of lineItems) {
			repos.products.adjustStock(li.product.id, -li.qty);
		}

		return created;
	});

	// After commit - email must never break order creation.
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

/** Admin edits an ongoing order - applies stock deltas, recomputes totals. */
export async function adminUpdateOrder(input: AdminUpdateOrderInput): Promise<Order> {
	const repos = getRepositories();

	const order = transaction((): Order => {
		const current = repos.orders.getById(input.orderId);
		if (!current) throw new OrderError('Commande introuvable.');

		const oldQty = new Map<number, number>();
		for (const it of current.items) {
			oldQty.set(it.product_id, (oldQty.get(it.product_id) ?? 0) + it.quantity);
		}

		// Desired new item set (merge duplicate product ids, drop non-positive).
		const newQty = new Map<number, number>();
		for (const line of input.items) {
			const pid = Number(line.productId);
			const qty = Math.floor(Number(line.quantity));
			if (!Number.isFinite(qty) || qty <= 0) continue;
			newQty.set(pid, (newQty.get(pid) ?? 0) + qty);
		}
		if (newQty.size === 0) throw new OrderError('Une commande doit contenir au moins un article.');

		// Apply stock deltas (return stock when reduced, deduct when increased).
		const productIds = new Set([...oldQty.keys(), ...newQty.keys()]);
		for (const pid of productIds) {
			const delta = (newQty.get(pid) ?? 0) - (oldQty.get(pid) ?? 0);
			if (delta !== 0) repos.products.adjustStock(pid, -delta);
		}

		// Rebuild items: keep snapshots for existing, snapshot current price/name for new.
		const existingSnapshot = new Map(current.items.map((it) => [it.product_id, it]));
		const items = [...newQty.entries()].map(([pid, qty]) => {
			const prev = existingSnapshot.get(pid);
			if (prev) {
				return {
					product_id: pid,
					name_snapshot: prev.name_snapshot,
					price_snapshot: prev.price_snapshot,
					quantity: qty
				};
			}
			const product = repos.products.getById(pid);
			if (!product) throw new OrderError(`Produit introuvable (#${pid}).`);
			return {
				product_id: pid,
				name_snapshot: product.name,
				price_snapshot: product.price,
				quantity: qty
			};
		});

		repos.orders.replaceItems(input.orderId, items);

		// Recompute totals with the stored coupon + distance.
		const subtotal = items.reduce((sum, it) => sum + it.price_snapshot * it.quantity, 0);
		let discount = 0;
		if (current.coupon_code) {
			const coupon = repos.coupons.getActive(current.coupon_code);
			if (coupon) discount = round((subtotal * coupon.percent) / 100);
		}
		const deliveryFee = computeDeliveryFee(subtotal - discount, current.distance_km);
		const total = subtotal - discount + deliveryFee;

		repos.orders.updateTotalsAndCustomer(input.orderId, {
			customer_name: input.customer_name?.trim(),
			customer_phone: input.customer_phone?.trim(),
			customer_address: input.customer_address?.trim(),
			customer_email:
				input.customer_email === undefined ? undefined : input.customer_email?.trim() || null,
			subtotal,
			discount,
			delivery_fee: deliveryFee,
			total
		});

		return repos.orders.getById(input.orderId)!;
	});

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

	repos.orders.setStatus(orderId, status);
	const order = repos.orders.getById(orderId);
	if (!order) throw new OrderError('Commande introuvable.');

	await sendStatusUpdate(order);
	return order;
}

export function listOrders(): Order[] {
	return getRepositories().orders.listAll();
}

export function getOrderByRef(ref: string): Order | null {
	return getRepositories().orders.getByRef(ref);
}
