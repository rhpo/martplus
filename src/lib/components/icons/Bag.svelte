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
	<path d="M6 8h12l1 12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z" />
	<path d="M9 8V6a3 3 0 0 1 6 0v2" />
</svg>
