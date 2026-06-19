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
	<path d="M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4" />
	<polyline points="8 8 12 4 16 8" />
	<line x1="12" y1="4" x2="12" y2="15" />
</svg>
