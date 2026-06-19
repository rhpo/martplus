<script lang="ts">
	import { DELIVERY } from '$lib/config';
	import { formatPrice } from '$lib/utils/money';
	import Meter from '$lib/components/ui/Meter.svelte';
	import Bike from '$lib/components/icons/Bike.svelte';

	let { amount }: { amount: number } = $props();

	const threshold = DELIVERY.freeThreshold;
	const qualifies = $derived(amount >= threshold);
	const remaining = $derived(Math.max(0, threshold - amount));
</script>

<div class="meter-wrap">
	<p class="msg">
		<span class="ico"><Bike size={18} /></span>
		{#if qualifies}
			Livraison offerte débloquée 🎉
		{:else}
			Plus que <strong>{formatPrice(remaining)}</strong> pour la livraison offerte !
		{/if}
	</p>
	<Meter value={amount} max={threshold} tone={qualifies ? 'gold' : 'accent'} />
</div>

<style>
	.meter-wrap {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		padding: var(--space-3);
		border-radius: var(--radius-md);
		background: var(--surface-inset);

		.msg {
			display: flex;
			align-items: center;
			gap: var(--space-2);
			font-size: var(--fs-sm);

			.ico {
				color: var(--accent);
				display: inline-flex;
			}
			strong {
				color: var(--accent);
			}
		}
	}
</style>
