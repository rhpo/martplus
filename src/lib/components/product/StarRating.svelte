<script lang="ts">
	import Star from '$lib/components/icons/Star.svelte';

	let {
		rating,
		reviewCount = undefined,
		size = 14
	}: { rating: number; reviewCount?: number; size?: number } = $props();

	function fillFor(index: number): 'full' | 'half' | 'empty' {
		if (rating >= index + 1) return 'full';
		if (rating >= index + 0.5) return 'half';
		return 'empty';
	}
</script>

<span class="rating">
	<span class="stars" aria-label="Note {rating} sur 5">
		{#each [0, 1, 2, 3, 4] as i (i)}
			<Star {size} fill={fillFor(i)} />
		{/each}
	</span>
	{#if reviewCount !== undefined}
		<span class="count">({reviewCount})</span>
	{/if}
</span>

<style>
	.rating {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);

		.stars {
			display: inline-flex;
			color: var(--gold);
		}
		.count {
			font-family: var(--font-mono);
			font-size: var(--fs-xs);
			color: var(--text-muted);
		}
	}
</style>
