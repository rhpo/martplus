import { PAYMENT_LABELS } from '$lib/config';
import type { Order } from '$lib/types';
import { formatPrice } from '$lib/utils/money';
import { emailShell, escapeHtml } from './base';

export function orderRecap(order: Order, mode: 'new' | 'updated' = 'new'): {
	subject: string;
	html: string;
	text: string;
} {
	const heading =
		mode === 'updated'
			? `Votre commande ${order.public_ref} a été mise à jour`
			: `Merci ! Commande ${order.public_ref} confirmée`;

	const subject =
		mode === 'updated'
			? `MART+ · Mise à jour de votre commande ${order.public_ref}`
			: `MART+ · Récapitulatif de votre commande ${order.public_ref}`;

	const rows = order.items
		.map(
			(it) => `<tr>
				<td style="padding:8px 0;border-bottom:1px solid #d5d9e0;">${escapeHtml(it.name_snapshot)} <span style="color:#8a93a6;">× ${it.quantity}</span></td>
				<td align="right" style="padding:8px 0;border-bottom:1px solid #d5d9e0;white-space:nowrap;">${formatPrice(it.price_snapshot * it.quantity)}</td>
			</tr>`
		)
		.join('');

	const line = (label: string, value: string, strong = false) =>
		`<tr><td style="padding:4px 0;${strong ? 'font-weight:700;font-size:16px;' : 'color:#3a4252;'}">${label}</td>
		 <td align="right" style="padding:4px 0;${strong ? 'font-weight:700;font-size:16px;' : ''}">${value}</td></tr>`;

	const intro =
		mode === 'updated'
			? `<p style="margin:0 0 20px;font-size:15px;line-height:1.6;">Bonjour ${escapeHtml(order.customer_name)}, votre commande a été modifiée par notre équipe. Voici le détail à jour.</p>`
			: `<p style="margin:0 0 20px;font-size:15px;line-height:1.6;">Bonjour ${escapeHtml(order.customer_name)}, nous avons bien reçu votre commande. Nous la préparons avec soin&nbsp;!</p>`;

	const deliveryLine =
		order.delivery_fee === 0
			? 'Livraison offerte 🎉'
			: `${formatPrice(order.delivery_fee)} · ${order.distance_km.toFixed(1)} km`;

	const bodyHtml = `
		${intro}
		<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
			${rows}
		</table>
		<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin-top:16px;">
			${line('Sous-total', formatPrice(order.subtotal))}
			${order.discount > 0 ? line(`Remise${order.coupon_code ? ' (' + escapeHtml(order.coupon_code) + ')' : ''}`, '− ' + formatPrice(order.discount)) : ''}
			${line('Livraison', deliveryLine)}
			${line('Total', formatPrice(order.total), true)}
		</table>
		<div style="margin-top:24px;padding:16px;background:#ffffff;border-radius:12px;border:1px solid #d5d9e0;">
			<p style="margin:0 0 6px;font-size:13px;color:#8a93a6;text-transform:uppercase;letter-spacing:0.5px;">Livraison</p>
			<p style="margin:0;font-size:14px;line-height:1.6;">${escapeHtml(order.customer_address)}<br />
			📞 ${escapeHtml(order.customer_phone)}<br />
			💳 ${escapeHtml(PAYMENT_LABELS[order.payment_method] ?? order.payment_method)}</p>
		</div>`;

	const text = [
		heading,
		'',
		...order.items.map((it) => `- ${it.name_snapshot} x${it.quantity} : ${formatPrice(it.price_snapshot * it.quantity)}`),
		'',
		`Sous-total : ${formatPrice(order.subtotal)}`,
		order.discount > 0 ? `Remise : -${formatPrice(order.discount)}` : '',
		`Livraison : ${deliveryLine}`,
		`Total : ${formatPrice(order.total)}`,
		'',
		`Adresse : ${order.customer_address}`,
		`Téléphone : ${order.customer_phone}`,
		`Paiement : ${PAYMENT_LABELS[order.payment_method] ?? order.payment_method}`
	]
		.filter(Boolean)
		.join('\n');

	return { subject, html: emailShell({ heading, bodyHtml }), text };
}
