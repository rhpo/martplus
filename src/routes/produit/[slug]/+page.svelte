<script lang="ts">
	import { formatPrice } from '$lib/utils/money';
	import { cart } from '$lib/stores/cart.svelte';
	import { wishlist } from '$lib/stores/wishlist.svelte';
	import { ui } from '$lib/stores/ui.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Stepper from '$lib/components/ui/Stepper.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import StarRating from '$lib/components/product/StarRating.svelte';
	import ProductGrid from '$lib/components/product/ProductGrid.svelte';
	import Heart from '$lib/components/icons/Heart.svelte';

	let { data } = $props();
	let qty = $state(1);
	let imgError = $state(false);

	const p = $derived(data.product);
	const onPromo = $derived(!!p.original_price && p.original_price > p.price);

	function add() {
		cart.add(p, qty);
		ui.showToast(`${p.name} ajouté au panier`);
		ui.openDrawer('cart');
	}
</script>

<svelte:head>
	<title>{p.name} · MART+</title>
	<meta name="description" content={p.description ?? p.name} />
</svelte:head>

<article class="product container">
	<nav class="crumbs" aria-label="Fil d'Ariane">
		<a href="/">Accueil</a> ›
		{#if data.category}<a href="/categorie/{data.category.slug}">{data.category.label}</a> ›{/if}
		<span>{p.name}</span>
	</nav>

	<div class="layout">
		<div class="media">
			<div class="badges">
				{#if p.badge}<Badge kind={p.badge} />{/if}
			</div>
			{#if p.imageUrl && !imgError}
				<img src={p.imageUrl} alt={p.name} onerror={() => (imgError = true)} />
			{:else}
				<div class="ph" aria-hidden="true">🛒</div>
			{/if}
		</div>

		<div class="detail">
			{#if p.brand}<span class="brand">{p.brand}</span>{/if}
			<h1>{p.name}</h1>
			<StarRating rating={p.rating} reviewCount={p.review_count} size={18} />
			<p class="price">
				{formatPrice(p.price)}
				{#if onPromo}<s>{formatPrice(p.original_price!)}</s>{/if}
			</p>
			<p class="desc">{p.description}</p>

			<div class="stock" class:out={p.stock <= 0}>
				{#if p.stock <= 0}Rupture de stock{:else if p.stock < 5}Plus que {p.stock} en stock !{:else}En stock{/if}
			</div>

			<div class="buy">
				<Stepper bind:value={qty} max={Math.max(1, p.stock)} />
				<Button onclick={add} disabled={p.stock <= 0}>
					{p.stock <= 0 ? 'Indisponible' : 'Ajouter au panier'}
				</Button>
				<button class="wish" class:on={wishlist.has(p.id)} onclick={() => wishlist.toggle(p)} aria-label="Favoris">
					<Heart size={22} filled={wishlist.has(p.id)} />
				</button>
			</div>
		</div>
	</div>

	{#if data.related.length > 0}
		<section class="related">
			<h2>Dans le même rayon</h2>
			<ProductGrid products={data.related} />
		</section>
	{/if}
</article>

<style>
	.product {
		padding-block: var(--space-6) var(--space-12);
	}
	.crumbs {
		font-size: var(--fs-sm);
		color: var(--text-muted);
		margin-bottom: var(--space-6);

		a:hover {
			color: var(--accent);
		}
		span {
			color: var(--text);
		}
	}
	.layout {
		display: grid;
		gap: var(--space-8);
		grid-template-columns: 1fr;

		.media {
			position: relative;
			background: var(--white);
			border-radius: var(--radius-lg);
			aspect-ratio: 1;
			overflow: hidden;

			img {
				width: 100%;
				height: 100%;
				object-fit: contain;
				padding: var(--space-8);
			}
			.ph {
				display: grid;
				place-items: center;
				height: 100%;
				font-size: 5rem;
				background: var(--surface-inset);
			}
			.badges {
				position: absolute;
				top: var(--space-4);
				left: var(--space-4);
				display: flex;
				gap: var(--space-2);
			}
		}

		.detail {
			display: flex;
			flex-direction: column;
			gap: var(--space-3);

			.brand {
				font-family: var(--font-ui);
				font-weight: 600;
				font-size: var(--fs-sm);
				letter-spacing: 0.5px;
				text-transform: uppercase;
				color: var(--text-muted);
			}
			h1 {
				font-size: var(--fs-h2);
			}
			.price {
				display: flex;
				align-items: baseline;
				gap: var(--space-2);
				font-family: var(--font-body);
				font-weight: 700;
				font-size: var(--fs-h3);
				color: var(--accent);

				s {
					font-weight: 400;
					font-size: var(--fs-md);
					color: var(--text-muted);
				}
			}
			.desc {
				color: var(--text-muted);
				line-height: 1.7;
			}
			.stock {
				align-self: flex-start;
				padding: var(--space-1) var(--space-3);
				border-radius: var(--radius-pill);
				font-family: var(--font-mono);
				font-size: var(--fs-xs);
				background: color-mix(in srgb, var(--gold) 25%, transparent);

				&.out {
					background: color-mix(in srgb, var(--accent) 18%, transparent);
					color: var(--accent);
				}
			}
			.buy {
				display: flex;
				align-items: center;
				gap: var(--space-3);
				margin-top: var(--space-2);

				.wish {
					display: grid;
					place-items: center;
					width: 48px;
					height: 48px;
					border-radius: var(--radius-pill);
					border: 1.5px solid var(--border);
					color: var(--text-muted);
					&:hover,
					&.on {
						color: var(--accent);
						border-color: var(--accent);
					}
				}
			}
		}
	}
	.related {
		margin-top: var(--space-16);
		h2 {
			font-size: var(--fs-h3);
			margin-bottom: var(--space-6);
		}
	}

	@media (min-width: 768px) {
		.layout {
			grid-template-columns: 1fr 1fr;
			align-items: start;
		}
	}
</style>
