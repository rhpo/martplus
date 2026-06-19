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
	<circle cx="5.5" cy="17.5" r="3.5" />
	<circle cx="18.5" cy="17.5" r="3.5" />
	<path d="M5.5 17.5 9 8h4l3 6h2.5" />
	<path d="M9 8l-1-3H6" />
</svg>
