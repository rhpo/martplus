<script lang="ts">
	let { size = 24, stroke = 2 }: { size?: number; stroke?: number } = $props();
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width={stroke}
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
>
	<polyline points="4 12 9.5 17.5 20 6.5" />
</svg>
