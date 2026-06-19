<script lang="ts">
	import { fly } from 'svelte/transition';
	import { ui } from '$lib/stores/ui.svelte';
	import Check from '$lib/components/icons/Check.svelte';
</script>

{#if ui.toast}
	<div class="toast" role="status" transition:fly={{ y: 24, duration: 260 }}>
		<span class="ico"><Check size={16} /></span>
		{ui.toast}
	</div>
{/if}

<style>
	.toast {
		position: fixed;
		left: 50%;
		bottom: var(--space-8);
		transform: translateX(-50%);
		z-index: var(--z-toast);
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-3) var(--space-6);
		border-radius: var(--radius-pill);
		background: var(--navy-900);
		color: var(--cream-50);
		font-family: var(--font-ui);
		font-weight: 600;
		font-size: var(--fs-sm);
		box-shadow: var(--shadow-pop);
		max-width: calc(100vw - var(--space-8));

		.ico {
			display: grid;
			place-items: center;
			width: 22px;
			height: 22px;
			border-radius: var(--radius-pill);
			background: var(--accent);
			color: var(--accent-text);
		}
	}
</style>
