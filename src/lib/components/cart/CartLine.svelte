<script lang="ts">
	import type { CartItem } from '$lib/types';
	import { formatPrice } from '$lib/utils/money';
	import { cart } from '$lib/stores/cart.svelte';
	import Stepper from '$lib/components/ui/Stepper.svelte';
	import Trash from '$lib/components/icons/Trash.svelte';

	let { item }: { item: CartItem } = $props();
	let imgError = $state(false);
</script>

<li>
	{#if item.imageUrl && !imgError}
		<img src={item.imageUrl} alt={item.name} onerror={() => (imgError = true)} />
	{:else}
		<div class="ph" aria-hidden="true">🛒</div>
	{/if}
	<div class="info">
		<h4><a href="/produit/{item.slug}">{item.name}</a></h4>
		<span>{formatPrice(item.price)}</span>
		<div class="qty">
			<Stepper value={item.quantity} max={item.stock} onchange={(v) => cart.setQty(item.productId, v)} />
			<button class="del" onclick={() => cart.remove(item.productId)} aria-label="Retirer">
				<Trash size={16} />
			</button>
		</div>
	</div>
	<span class="total">{formatPrice(item.price * item.quantity)}</span>
</li>

<style>
	li {
		display: grid;
		grid-template-columns: 56px 1fr auto;
		gap: var(--space-3);
		padding: var(--space-3) 0;
		border-bottom: 1px solid var(--border);

		img,
		.ph {
			width: 56px;
			height: 56px;
			border-radius: var(--radius-sm);
			background: var(--white);
			object-fit: contain;
		}
		.ph {
			display: grid;
			place-items: center;
			background: var(--surface-inset);
			font-size: 1.4rem;
		}
		.info {
			display: flex;
			flex-direction: column;
			gap: var(--space-2);
			min-width: 0;

			h4 {
				font: 600 var(--fs-sm) / 1.3 var(--font-ui);
				color: var(--text);
				display: -webkit-box;
				-webkit-line-clamp: 2;
				line-clamp: 2;
				-webkit-box-orient: vertical;
				overflow: hidden;
			}
			span {
				color: var(--text-muted);
				font: var(--fs-xs) var(--font-mono);
			}
			.qty {
				display: flex;
				align-items: center;
				gap: var(--space-2);

				.del {
					display: grid;
					place-items: center;
					width: 32px;
					height: 32px;
					border-radius: var(--radius-pill);
					color: var(--text-muted);
					&:hover {
						color: var(--accent);
						background: var(--surface-inset);
					}
				}
			}
		}
		.total {
			font: 700 var(--fs-sm) var(--font-body);
			color: var(--text);
			white-space: nowrap;
		}
	}
</style>
