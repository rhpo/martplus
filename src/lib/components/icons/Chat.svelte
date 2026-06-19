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
	<path d="M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5z" />
	<line x1="8.5" y1="11" x2="8.5" y2="11" />
	<line x1="12" y1="11" x2="12" y2="11" />
	<line x1="15.5" y1="11" x2="15.5" y2="11" />
</svg>
