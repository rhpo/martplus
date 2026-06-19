<script lang="ts">
	import { PAYMENT_LABELS, STATUS_LABELS } from '$lib/config';
	import { formatPrice } from '$lib/utils/money';
	import DeliveryTracker from '$lib/components/checkout/DeliveryTracker.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	let { data } = $props();
	const o = $derived(data.order);
</script>

<svelte:head>
	<title>Commande {o.public_ref} · MART+</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<section class="confirm container">
	<div class="hero">
		<span class="check" aria-hidden="true">✅</span>
		<h1>Merci pour votre commande !</h1>
		<p class="ref">Référence : <strong>{o.public_ref}</strong></p>
		<p class="status">Statut : {STATUS_LABELS[o.status]}</p>
		{#if o.customer_email}
			<p class="mail">Un récapitulatif a été envoyé à <strong>{o.customer_email}</strong>. Vous recevrez aussi les mises à jour de livraison par e-mail.</p>
		{/if}
	</div>

	<div class="tracker-card">
		<DeliveryTracker status={o.status} />
	</div>

	<div class="grid">
		<div class="card">
			<h2>Votre commande</h2>
			<ul class="items">
				{#each o.items as it (it.id)}
					<li>
						<span>{it.name_snapshot} <em>× {it.quantity}</em></span>
						<span>{formatPrice(it.price_snapshot * it.quantity)}</span>
					</li>
				{/each}
			</ul>
			<div class="totals">
				<div class="row"><span>Sous-total</span><span>{formatPrice(o.subtotal)}</span></div>
				{#if o.discount > 0}
					<div class="row discount"><span>Remise{o.coupon_code ? ` (${o.coupon_code})` : ''}</span><span>−{formatPrice(o.discount)}</span></div>
				{/if}
				<div class="row">
					<span>Livraison{o.distance_km ? ` · ${o.distance_km.toFixed(1).replace('.', ',')} km` : ''}</span>
					<span>{o.delivery_fee === 0 ? 'Offerte 🎉' : formatPrice(o.delivery_fee)}</span>
				</div>
				<div class="row grand"><span>Total</span><span>{formatPrice(o.total)}</span></div>
			</div>
		</div>

		<div class="card">
			<h2>Livraison</h2>
			<dl>
				<dt>Nom</dt><dd>{o.customer_name}</dd>
				<dt>Téléphone</dt><dd>{o.customer_phone}</dd>
				<dt>Adresse</dt><dd>{o.customer_address}</dd>
				<dt>Paiement</dt><dd>{PAYMENT_LABELS[o.payment_method]}</dd>
			</dl>
		</div>
	</div>

	<div class="back">
		<Button href="/">Retour à la boutique</Button>
	</div>
</section>

<style>
	.confirm {
		padding-block: var(--space-8) var(--space-16);
		max-width: 860px;
	}
	.hero {
		text-align: center;
		margin-bottom: var(--space-8);

		.check {
			font-size: 3rem;
		}
		h1 {
			font-size: var(--fs-h2);
			margin-block: var(--space-2);
		}
		.ref strong {
			font-family: var(--font-mono);
			color: var(--accent);
		}
		.status {
			color: var(--text-muted);
			margin-top: var(--space-1);
		}
		.mail {
			max-width: 48ch;
			margin: var(--space-3) auto 0;
			font-size: var(--fs-sm);
			color: var(--text-muted);
		}
	}
	.tracker-card {
		padding: var(--space-6);
		border-radius: var(--radius-lg);
		background: var(--surface-raised);
		border: 1px solid var(--border);
		margin-bottom: var(--space-8);
	}
	.grid {
		display: grid;
		gap: var(--space-4);
		grid-template-columns: 1fr;
	}
	.card {
		padding: var(--space-6);
		border-radius: var(--radius-lg);
		background: var(--surface-raised);
		border: 1px solid var(--border);

		h2 {
			font-size: var(--fs-h3);
			margin-bottom: var(--space-4);
		}
		.items {
			display: flex;
			flex-direction: column;
			gap: var(--space-2);
			font-size: var(--fs-sm);
			margin-bottom: var(--space-4);

			li {
				display: flex;
				justify-content: space-between;
				gap: var(--space-3);
				em {
					color: var(--text-muted);
					font-style: normal;
				}
			}
		}
		.totals {
			display: flex;
			flex-direction: column;
			gap: var(--space-2);
			font-size: var(--fs-sm);

			.row {
				display: flex;
				justify-content: space-between;
			}
			.discount {
				color: var(--accent);
			}
			.grand {
				margin-top: var(--space-2);
				padding-top: var(--space-2);
				border-top: 1px solid var(--border);
				font-weight: 700;
				font-size: var(--fs-lg);
			}
		}
		dl {
			display: grid;
			grid-template-columns: auto 1fr;
			gap: var(--space-2) var(--space-4);
			font-size: var(--fs-sm);

			dt {
				color: var(--text-muted);
			}
			dd {
				text-align: right;
			}
		}
	}
	.back {
		margin-top: var(--space-8);
		text-align: center;
	}

	@media (min-width: 720px) {
		.grid {
			grid-template-columns: 1.3fr 1fr;
		}
	}
</style>
