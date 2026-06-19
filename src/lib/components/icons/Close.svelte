<script lang="ts">
	let { size = 24, stroke = 1.8 }: { size?: number; stroke?: number } = $props();
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
	<line x1="6" y1="6" x2="18" y2="18" />
	<line x1="18" y1="6" x2="6" y2="18" />
</svg>
