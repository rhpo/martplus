<script lang="ts">
	import { onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { slide } from 'svelte/transition';

	const messages = [
		"Livraison offerte à domicile dès 15 000 DZD d'achat ! 🚚",
		'Profitez de -10% avec le code promo MARTPLUS10 ! 🏷️',
		'🔥 Flash Deals en cours : chocolats grands crus & comté affiné à prix cassé !'
	];

	let index = $state(0);
	let timer: ReturnType<typeof setInterval> | null = null;

	if (browser) {
		timer = setInterval(() => {
			index = (index + 1) % messages.length;
		}, 4000);
	}
	onDestroy(() => {
		if (timer) clearInterval(timer);
	});
</script>

<div class="bar" aria-live="polite">
	{#key index}
		<p transition:slide={{ duration: 320 }}>{messages[index]}</p>
	{/key}
</div>

<style>
	.bar {
		background: var(--accent);
		color: var(--accent-text);
		height: 38px;
		display: grid;
		place-items: center;
		overflow: hidden;
		position: relative;

		p {
			font-family: var(--font-ui);
			font-weight: 600;
			font-size: var(--fs-sm);
			text-align: center;
			padding-inline: var(--space-4);
		}
	}
</style>
