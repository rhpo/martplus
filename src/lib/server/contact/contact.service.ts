import { env } from '$env/dynamic/private';
import type { Order } from '$lib/types';
import { getMailer } from './factory';
import { orderRecap } from './templates/order-recap';
import { statusUpdate } from './templates/status-update';

function canSend(order: Order): boolean {
	if (!order.customer_email) return false;
	if (!env.RESEND_API_KEY) {
		console.warn('[contact] RESEND_API_KEY missing - not sending email for', order.public_ref);
		return false;
	}
	return true;
}

/** Send the order recap (new or updated). Never throws into the request. */
export async function sendOrderRecap(order: Order, mode: 'new' | 'updated' = 'new'): Promise<void> {
	if (!canSend(order)) return;
	try {
		const { subject, html, text } = orderRecap(order, mode);
		await getMailer().send({ to: order.customer_email!, subject, html, text });
	} catch (err) {
		console.error('[contact] sendOrderRecap failed for', order.public_ref, err);
	}
}

/** Send a delivery/status update email. Never throws into the request. */
export async function sendStatusUpdate(order: Order): Promise<void> {
	if (!canSend(order)) return;
	try {
		const { subject, html, text } = statusUpdate(order);
		await getMailer().send({ to: order.customer_email!, subject, html, text });
	} catch (err) {
		console.error('[contact] sendStatusUpdate failed for', order.public_ref, err);
	}
}
