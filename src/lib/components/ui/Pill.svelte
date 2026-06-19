<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		active = false,
		accent = 'navy',
		href = undefined,
		onclick = undefined,
		children
	}: {
		active?: boolean;
		accent?: 'navy' | 'red' | 'caramel' | 'navy-soft';
		href?: string;
		onclick?: (e: MouseEvent) => void;
		children: Snippet;
	} = $props();

	const accentVar = $derived(`var(--cat-${accent})`);
</script>

{#if href}
	<a class="pill" class:active style:--pill-accent={accentVar} {href} {onclick}>
		{@render children()}
	</a>
{:else}
	<button class="pill" class:active style:--pill-accent={accentVar} {onclick}>
		{@render children()}
	</button>
{/if}

<style>
	.pill {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-4);
		border-radius: var(--radius-pill);
		border: 1.5px solid var(--border);
		background: var(--surface-raised);
		color: var(--text);
		font-family: var(--font-ui);
		font-weight: 500;
		font-size: var(--fs-sm);
		white-space: nowrap;
		transition:
			background var(--dur) var(--ease),
			color var(--dur) var(--ease),
			border-color var(--dur) var(--ease);

		&:hover {
			border-color: var(--pill-accent);
		}
		&.active {
			background: var(--pill-accent);
			border-color: var(--pill-accent);
			color: var(--white);
		}
	}
</style>
