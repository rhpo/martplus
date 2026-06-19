<script lang="ts">
	import type { Product } from '$lib/types';
	import { formatPrice } from '$lib/utils/money';
	import { cart } from '$lib/stores/cart.svelte';
	import { wishlist } from '$lib/stores/wishlist.svelte';
	import { ui } from '$lib/stores/ui.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import StarRating from './StarRating.svelte';
	import Heart from '$lib/components/icons/Heart.svelte';
	import Plus from '$lib/components/icons/Plus.svelte';

	let { product }: { product: Product } = $props();

	let imgError = $state(false);
	const outOfStock = $derived(product.stock <= 0);
	const onPromo = $derived(!!product.original_price && product.original_price > product.price);

	function add(e: MouseEvent) {
		e.stopPropagation();
		cart.add(product, 1);
		ui.showToast(`${product.name} ajouté au panier`);
	}

	function toggleWish(e: MouseEvent) {
		e.stopPropagation();
		wishlist.toggle(product);
	}
</script>

<article class="card">
	<div
		class="media"
		role="button"
		tabindex="0"
		onclick={() => ui.openQuickView(product)}
		onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && ui.openQuickView(product)}
	>
		<div class="badges">
			{#if product.badge}<Badge kind={product.badge} />{/if}
		</div>
		<button class="wish" class:on={wishlist.has(product.id)} onclick={toggleWish} aria-label="Ajouter aux favoris">
			<Heart size={18} filled={wishlist.has(product.id)} />
		</button>
		{#if product.imageUrl && !imgError}
			<img src={product.imageUrl} alt={product.name} loading="lazy" onerror={() => (imgError = true)} />
		{:else}
			<div class="placeholder" aria-hidden="true">🛒</div>
		{/if}
		{#if outOfStock}<div class="mask">Rupture de Stock</div>{/if}
	</div>

	<div class="info">
		{#if product.brand}<span class="brand">{product.brand}</span>{/if}
		<h3 class="name" title={product.name}>
			<a href="/produit/{product.slug}">{product.name}</a>
		</h3>
		<StarRating rating={product.rating} reviewCount={product.review_count} />
		<div class="foot">
			<span class="price">
				{formatPrice(product.price)}
				{#if onPromo}<s>{formatPrice(product.original_price!)}</s>{/if}
			</span>
			<button class="add" onclick={add} disabled={outOfStock} aria-label="Ajouter au panier">
				<Plus size={16} /> Ajouter
			</button>
		</div>
	</div>
</article>

<style>
	.card {
		display: flex;
		flex-direction: column;
		background: var(--surface-raised);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		overflow: hidden;
		transition:
			transform var(--dur) var(--ease),
			box-shadow var(--dur) var(--ease);

		&:hover {
			transform: translateY(-4px);
			box-shadow: var(--shadow-card);
		}

		.media {
			position: relative;
			aspect-ratio: 1;
			background: var(--white);
			cursor: pointer;
			overflow: hidden;

			img {
				width: 100%;
				height: 100%;
				object-fit: contain;
				padding: var(--space-4);
				transition: transform var(--dur-slow) var(--ease);
			}
			.placeholder {
				display: grid;
				place-items: center;
				width: 100%;
				height: 100%;
				font-size: 3rem;
				background: var(--surface-inset);
			}
			&:hover img {
				transform: scale(1.06);
			}

			.badges {
				position: absolute;
				top: var(--space-3);
				left: var(--space-3);
				display: flex;
				flex-wrap: wrap;
				gap: var(--space-2);
				z-index: 1;
			}
			.wish {
				position: absolute;
				top: var(--space-3);
				right: var(--space-3);
				z-index: 1;
				display: grid;
				place-items: center;
				width: 36px;
				height: 36px;
				border-radius: var(--radius-pill);
				background: var(--surface-raised);
				color: var(--text-muted);
				box-shadow: var(--shadow-card);
				transition: color var(--dur) var(--ease);

				&:hover,
				&.on {
					color: var(--accent);
				}
			}
			.mask {
				position: absolute;
				inset: 0;
				display: grid;
				place-items: center;
				background: rgba(15, 23, 41, 0.55);
				color: var(--cream-50);
				font-family: var(--font-ui);
				font-weight: 700;
				text-transform: uppercase;
				letter-spacing: 0.5px;
				font-size: var(--fs-sm);
			}
		}

		.info {
			display: flex;
			flex-direction: column;
			gap: var(--space-2);
			padding: var(--space-4);

			.brand {
				font-family: var(--font-ui);
				font-weight: 600;
				font-size: var(--fs-xs);
				letter-spacing: 0.5px;
				text-transform: uppercase;
				color: var(--text-muted);
			}
			.name {
				font-family: var(--font-ui);
				font-weight: 600;
				font-size: var(--fs-md);
				line-height: 1.25;
				display: -webkit-box;
				-webkit-line-clamp: 2;
				line-clamp: 2;
				-webkit-box-orient: vertical;
				overflow: hidden;
				min-height: 2.5em;
			}
			.foot {
				display: flex;
				align-items: center;
				justify-content: space-between;
				gap: var(--space-2);
				margin-top: auto;

				.price {
					display: flex;
					flex-direction: column;
					font-family: var(--font-body);
					font-weight: 700;
					font-size: var(--fs-lg);
					color: var(--accent);

					s {
						font-weight: 400;
						font-size: var(--fs-xs);
						color: var(--text-muted);
					}
				}
				.add {
					display: inline-flex;
					align-items: center;
					gap: var(--space-1);
					padding: var(--space-2) var(--space-3);
					border-radius: var(--radius-pill);
					background: var(--navy-800);
					color: var(--white);
					font-family: var(--font-ui);
					font-weight: 600;
					font-size: var(--fs-xs);
					text-transform: uppercase;
					letter-spacing: 0.5px;
					transition: background var(--dur) var(--ease);

					&:hover:not(:disabled) {
						background: var(--accent);
					}
					&:disabled {
						opacity: 0.4;
						cursor: not-allowed;
					}
				}
			}
		}
	}
</style>
