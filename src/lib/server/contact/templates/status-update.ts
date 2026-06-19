import { STATUS_LABELS } from '$lib/config';
import type { Order } from '$lib/types';
import { emailShell, escapeHtml } from './base';

const STATUS_MESSAGE: Record<string, string> = {
	pending: 'Votre commande a bien été enregistrée et attend confirmation.',
	confirmed: 'Votre commande est confirmée - nous nous en occupons !',
	preparing: 'Votre sachet est en cours de préparation 📦',
	out_for_delivery: 'Votre commande est en route vers vous 🚲',
	delivered: 'Votre commande a été livrée. Bon appétit ! ✅',
	cancelled: 'Votre commande a été annulée. Contactez-nous pour toute question.'
};

export function statusUpdate(order: Order): { subject: string; html: string; text: string } {
	const label = STATUS_LABELS[order.status] ?? order.status;
	const heading = `Commande ${order.public_ref} : ${label}`;
	const message = STATUS_MESSAGE[order.status] ?? `Nouveau statut : ${label}.`;
	const subject = `MART+ · ${escapeHtml(label)} - commande ${order.public_ref}`;

	const bodyHtml = `
		<p style="margin:0 0 20px;font-size:15px;line-height:1.6;">Bonjour ${escapeHtml(order.customer_name)},</p>
		<div style="padding:18px;background:#1a2744;border-radius:12px;text-align:center;">
			<span style="font-family:monospace;font-size:12px;color:#f2c078;text-transform:uppercase;letter-spacing:1px;">Statut</span>
			<div style="font-size:22px;font-weight:700;color:#ffffff;margin-top:6px;">${escapeHtml(label)}</div>
		</div>
		<p style="margin:20px 0 0;font-size:15px;line-height:1.6;">${escapeHtml(message)}</p>
		<p style="margin:16px 0 0;font-size:13px;color:#8a93a6;">Adresse de livraison : ${escapeHtml(order.customer_address)}</p>`;

	const text = `${heading}\n\nBonjour ${order.customer_name},\n${message}\n\nAdresse : ${order.customer_address}`;

	return { subject, html: emailShell({ heading, bodyHtml }), text };
}
