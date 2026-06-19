<script lang="ts">
	import CategoryBar from '$lib/components/sections/CategoryBar.svelte';
	import ProductGrid from '$lib/components/product/ProductGrid.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>{data.category.label} · MART+</title>
</svelte:head>

<section class="cat container">
	<div class="catbar-wrap">
		<CategoryBar categories={data.categories} activeSlug={data.category.slug} />
	</div>
	<header class="head">
		<span class="emoji" aria-hidden="true">{data.category.emoji}</span>
		<h1>{data.category.label}</h1>
		<p>{data.products.length} produit(s)</p>
	</header>
	<ProductGrid products={data.products} />
</section>

<style>
	.cat {
		padding-block: var(--space-6) var(--space-12);

		.catbar-wrap {
			margin-bottom: var(--space-8);
		}
		.head {
			margin-bottom: var(--space-6);

			.emoji {
				font-size: 2.4rem;
			}
			h1 {
				font-size: var(--fs-h2);
				margin-top: var(--space-2);
			}
			p {
				color: var(--text-muted);
				margin-top: var(--space-1);
			}
		}
	}
</style>
