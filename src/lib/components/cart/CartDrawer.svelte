<script lang="ts">
	import { goto } from '$app/navigation';
	import { formatPrice } from '$lib/utils/money';
	import { cart } from '$lib/stores/cart.svelte';
	import { coupon } from '$lib/stores/coupon.svelte';
	import { ui } from '$lib/stores/ui.svelte';
	import Drawer from '$lib/components/ui/Drawer.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import CartLine from './CartLine.svelte';
	import FreeShippingMeter from './FreeShippingMeter.svelte';
	import CouponField from './CouponField.svelte';
	import Bag from '$lib/components/icons/Bag.svelte';

	const discount = $derived(coupon.discountOn(cart.subtotal));
	const afterDiscount = $derived(cart.subtotal - discount);

	function checkout() {
		ui.closeDrawer();
		goto('/checkout');
	}
</script>

<Drawer open={ui.drawer === 'cart'} title="Votre panier" onclose={() => ui.closeDrawer()}>
	{#if cart.isEmpty}
		<div class="empty">
			<span class="ico"><Bag size={40} /></span>
			<p>Votre panier est vide.</p>
			<Button variant="ghost" onclick={() => ui.closeDrawer()}>Continuer mes courses</Button>
		</div>
	{:else}
		<div class="content">
			<FreeShippingMeter amount={afterDiscount} />
			<ul class="lines">
				{#each cart.items as item (item.productId)}
					<CartLine {item} />
				{/each}
			</ul>
			<CouponField />
		</div>
	{/if}

	{#snippet footer()}
		{#if !cart.isEmpty}
			<div class="totals">
				<div class="row"><span>Sous-total</span><span>{formatPrice(cart.subtotal)}</span></div>
				{#if discount > 0}
					<div class="row discount"><span>Remise ({coupon.code})</span><span>−{formatPrice(discount)}</span></div>
				{/if}
				<div class="row muted">
					<span>Livraison</span><span>calculée à l'étape suivante</span>
				</div>
				<div class="row grand"><span>Total estimé</span><span>{formatPrice(afterDiscount)}</span></div>
			</div>
			<Button full size="lg" onclick={checkout}>Passer la commande</Button>
		{/if}
	{/snippet}
</Drawer>

<style>
	.content {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}
	.lines {
		display: flex;
		flex-direction: column;
	}
	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-4);
		padding: var(--space-12) 0;
		text-align: center;
		color: var(--text-muted);

		.ico {
			color: var(--border);
		}
	}
	.totals {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		margin-bottom: var(--space-4);
		font-size: var(--fs-sm);

		.row {
			display: flex;
			justify-content: space-between;
		}
		.muted {
			color: var(--text-muted);
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
</style>
