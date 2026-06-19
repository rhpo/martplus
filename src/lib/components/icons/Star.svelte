<script lang="ts">
	let {
		size = 16,
		fill = 'full'
	}: { size?: number; fill?: 'full' | 'half' | 'empty' } = $props();

	const id = `star-${Math.random().toString(36).slice(2, 8)}`;
</script>

<svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
	{#if fill === 'half'}
		<defs>
			<linearGradient {id}>
				<stop offset="50%" stop-color="currentColor" />
				<stop offset="50%" stop-color="transparent" />
			</linearGradient>
		</defs>
	{/if}
	<path
		d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.9 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z"
		fill={fill === 'full' ? 'currentColor' : fill === 'half' ? `url(#${id})` : 'none'}
		stroke="currentColor"
		stroke-width="1.4"
		stroke-linejoin="round"
	/>
</svg>
