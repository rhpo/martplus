<script lang="ts">
	import type { Product } from '$lib/types';
	import ProductCard from './ProductCard.svelte';

	let { products, empty = 'Aucun produit pour le moment.' }: { products: Product[]; empty?: string } =
		$props();
</script>

{#if products.length === 0}
	<p class="empty">{empty}</p>
{:else}
	<ul class="grid">
		{#each products as product (product.id)}
			<li><ProductCard {product} /></li>
		{/each}
	</ul>
{/if}

<style>
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
		gap: var(--space-4);
	}
	.empty {
		padding: var(--space-12) 0;
		text-align: center;
		color: var(--text-muted);
		font-family: var(--font-ui);
	}

	@media (max-width: 480px) {
		.grid {
			grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
			gap: var(--space-3);
		}
	}
</style>
