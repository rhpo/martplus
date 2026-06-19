<script lang="ts">
	import { theme } from '$lib/stores/theme.svelte';
	import Sun from '$lib/components/icons/Sun.svelte';
	import Moon from '$lib/components/icons/Moon.svelte';
</script>

<button
	class="toggle"
	onclick={() => theme.toggle()}
	aria-label={theme.current === 'dark' ? 'Passer au thème clair' : 'Passer au thème sombre'}
	title="Changer de thème"
>
	{#if theme.current === 'dark'}
		<Sun size={20} />
	{:else}
		<Moon size={20} />
	{/if}
</button>

<style>
	.toggle {
		display: grid;
		place-items: center;
		width: 40px;
		height: 40px;
		border-radius: var(--radius-pill);
		color: var(--header-text);
		transition: background var(--dur) var(--ease);

		&:hover {
			background: rgba(255, 255, 255, 0.12);
		}
	}
</style>
