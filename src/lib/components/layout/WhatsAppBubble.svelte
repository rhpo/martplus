<script lang="ts">
	import { scale } from 'svelte/transition';
	import { ui } from '$lib/stores/ui.svelte';
	import WhatsApp from '$lib/components/icons/WhatsApp.svelte';

	let { number }: { number: string } = $props();

	// Presentational only: a plain wa.me deep link. No WhatsApp API, no order data.
	const href = $derived(`https://wa.me/${number.replace(/\D/g, '')}`);
</script>

{#if !ui.hasOverlay}
	<a
		class="bubble"
		{href}
		target="_blank"
		rel="noopener"
		aria-label="Contacter MART+ sur WhatsApp"
		transition:scale={{ start: 0.6, duration: 280 }}
	>
		<WhatsApp size={30} />
	</a>
{/if}

<style>
	.bubble {
		position: fixed;
		right: var(--space-4);
		bottom: var(--space-4);
		z-index: var(--z-bubble);
		display: grid;
		place-items: center;
		width: 58px;
		height: 58px;
		border-radius: var(--radius-pill);
		background: var(--whatsapp);
		color: var(--white);
		box-shadow: var(--shadow-pop);
		animation: pulse 2.6s var(--ease) infinite;
		transition: transform var(--dur) var(--ease);

		&:hover {
			transform: scale(1.08);
		}
	}

	@keyframes pulse {
		0%,
		100% {
			box-shadow:
				var(--shadow-pop),
				0 0 0 0 color-mix(in srgb, var(--whatsapp) 55%, transparent);
		}
		50% {
			box-shadow:
				var(--shadow-pop),
				0 0 0 12px color-mix(in srgb, var(--whatsapp) 0%, transparent);
		}
	}

	@media (min-width: 768px) {
		.bubble {
			right: var(--space-8);
			bottom: var(--space-8);
		}
	}
</style>
