<script lang="ts">
	import type { Product, WishlistItem } from '$lib/types';
	import { formatPrice } from '$lib/utils/money';
	import { wishlist } from '$lib/stores/wishlist.svelte';
	import { cart } from '$lib/stores/cart.svelte';
	import { ui } from '$lib/stores/ui.svelte';
	import Drawer from '$lib/components/ui/Drawer.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Heart from '$lib/components/icons/Heart.svelte';
	import Trash from '$lib/components/icons/Trash.svelte';

	function addToCart(item: WishlistItem) {
		// rebuild a minimal Product for the cart from the wishlist snapshot
		const product = {
			id: item.productId,
			slug: item.slug,
			name: item.name,
			brand: item.brand,
			price: item.price,
			image: item.image,
			imageUrl: item.imageUrl,
			stock: item.stock
		} as Product;
		cart.add(product, 1);
		ui.showToast(`${item.name} ajouté au panier`);
	}
</script>

<Drawer open={ui.drawer === 'wishlist'} title="Vos favoris" onclose={() => ui.closeDrawer()}>
	{#if wishlist.count === 0}
		<div class="empty">
			<span class="ico"><Heart size={40} /></span>
			<p>Aucun favori pour l'instant.</p>
			<Button variant="ghost" onclick={() => ui.closeDrawer()}>Parcourir le catalogue</Button>
		</div>
	{:else}
		<ul class="lines">
			{#each wishlist.items as item (item.productId)}
				<li>
					{#if item.imageUrl}
						<img src={item.imageUrl} alt={item.name} />
					{:else}
						<div class="ph" aria-hidden="true">🛒</div>
					{/if}
					<div class="info">
						<h4><a href="/produit/{item.slug}">{item.name}</a></h4>
						<span>{formatPrice(item.price)}</span>
						<Button size="sm" onclick={() => addToCart(item)} disabled={item.stock <= 0}>
							{item.stock <= 0 ? 'Indisponible' : 'Ajouter au panier'}
						</Button>
					</div>
					<button class="del" onclick={() => wishlist.remove(item.productId)} aria-label="Retirer">
						<Trash size={16} />
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</Drawer>

<style>
	.lines {
		display: flex;
		flex-direction: column;

		li {
			display: grid;
			grid-template-columns: 56px 1fr auto;
			gap: var(--space-3);
			padding: var(--space-3) 0;
			border-bottom: 1px solid var(--border);

			img,
			.ph {
				width: 56px;
				height: 56px;
				border-radius: var(--radius-sm);
				background: var(--white);
				object-fit: contain;
			}
			.ph {
				display: grid;
				place-items: center;
				background: var(--surface-inset);
				font-size: 1.4rem;
			}
			.info {
				display: flex;
				flex-direction: column;
				gap: var(--space-2);
				min-width: 0;

				h4 {
					font: 600 var(--fs-sm) / 1.3 var(--font-ui);
					display: -webkit-box;
					-webkit-line-clamp: 2;
					line-clamp: 2;
					-webkit-box-orient: vertical;
					overflow: hidden;
				}
				span {
					font: var(--fs-xs) var(--font-mono);
					color: var(--accent);
				}
			}
			.del {
				display: grid;
				place-items: center;
				width: 32px;
				height: 32px;
				align-self: start;
				border-radius: var(--radius-pill);
				color: var(--text-muted);
				&:hover {
					color: var(--accent);
					background: var(--surface-inset);
				}
			}
		}
	}
	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-4);
		padding: var(--space-12) 0;
		text-align: center;
		color: var(--text-muted);

		.ico {
			color: var(--border);
		}
	}
</style>
