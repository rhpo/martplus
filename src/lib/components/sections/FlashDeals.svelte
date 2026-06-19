<script lang="ts">
	import type { Product } from '$lib/types';
	import { formatPrice } from '$lib/utils/money';
	import { cart } from '$lib/stores/cart.svelte';
	import { ui } from '$lib/stores/ui.svelte';
	import Countdown from '$lib/components/ui/Countdown.svelte';
	import Meter from '$lib/components/ui/Meter.svelte';

	let { products, endsAt }: { products: Product[]; endsAt: string | number } = $props();

	function discountPct(p: Product): number {
		if (!p.original_price || p.original_price <= p.price) return 0;
		return Math.round((1 - p.price / p.original_price) * 100);
	}

	function add(p: Product) {
		cart.add(p, 1);
		ui.showToast(`${p.name} ajouté au panier`);
	}
</script>

{#if products.length > 0}
	<section class="flash">
		<div class="container">
			<header class="head">
				<div>
					<span class="eyebrow">🔥 FLASH DEALS</span>
					<h2>Offres éclair du jour</h2>
				</div>
				<div class="timer">
					<span class="lbl">Se termine dans</span>
					<Countdown until={endsAt} />
				</div>
			</header>

			<ul class="row scroll-x">
				{#each products as p (p.id)}
					<li class="deal">
						<button
							class="img"
							onclick={() => ui.openQuickView(p)}
							aria-label="Voir {p.name}"
						>
							{#if discountPct(p) > 0}<span class="pct">-{discountPct(p)}%</span>{/if}
							{#if p.imageUrl}
								<img src={p.imageUrl} alt={p.name} loading="lazy" />
							{:else}
								<span class="placeholder">🛒</span>
							{/if}
						</button>
						<div class="body">
							<h3>{p.name}</h3>
							<Meter
								value={p.flash_reserved_pct}
								tone="gold"
								label="Déjà réservé à {p.flash_reserved_pct} %"
							/>
							<div class="foot">
								<span class="price">
									{formatPrice(p.price)}
									{#if p.original_price && p.original_price > p.price}
										<s>{formatPrice(p.original_price)}</s>
									{/if}
								</span>
								<button class="grab" onclick={() => add(p)} disabled={p.stock <= 0}>
									{p.stock <= 0 ? 'Épuisé' : 'Profiter'}
								</button>
							</div>
						</div>
					</li>
				{/each}
			</ul>
		</div>
	</section>
{/if}

<style>
	.flash {
		background: var(--navy-900);
		color: var(--on-dark);
		padding-block: var(--space-12);

		.head {
			display: flex;
			flex-wrap: wrap;
			align-items: center;
			justify-content: space-between;
			gap: var(--space-4);
			margin-bottom: var(--space-6);

			.eyebrow {
				font-family: var(--font-mono);
				font-size: var(--fs-xs);
				letter-spacing: 1px;
				color: var(--gold);
			}
			h2 {
				font-size: var(--fs-h2);
				color: var(--white);
			}
			.timer {
				display: flex;
				align-items: center;
				gap: var(--space-3);
				.lbl {
					font-family: var(--font-mono);
					font-size: var(--fs-xs);
					color: var(--gray-300);
				}
			}
		}

		.row {
			display: flex;
			gap: var(--space-4);
			padding-bottom: var(--space-2);
		}

		.deal {
			flex-shrink: 0;
			width: 240px;
			display: flex;
			flex-direction: column;
			background: #243155;
			border-radius: var(--radius-lg);
			overflow: hidden;

			.img {
				position: relative;
				aspect-ratio: 1;
				background: var(--white);
				width: 100%;
				cursor: pointer;
				display: grid;
				place-items: center;

				img {
					width: 100%;
					height: 100%;
					object-fit: contain;
					padding: var(--space-4);
				}
				.placeholder {
					font-size: 3rem;
				}
				.pct {
					position: absolute;
					top: var(--space-3);
					left: var(--space-3);
					padding: var(--space-1) var(--space-2);
					border-radius: var(--radius-pill);
					background: var(--accent);
					color: var(--accent-text);
					font-family: var(--font-ui);
					font-weight: 700;
					font-size: var(--fs-xs);
				}
			}
			.body {
				display: flex;
				flex-direction: column;
				gap: var(--space-3);
				padding: var(--space-4);

				h3 {
					font-family: var(--font-ui);
					font-weight: 600;
					font-size: var(--fs-sm);
					color: var(--cream-50);
					line-height: 1.3;
					display: -webkit-box;
					-webkit-line-clamp: 2;
					line-clamp: 2;
					-webkit-box-orient: vertical;
					overflow: hidden;
					min-height: 2.6em;
				}
				.foot {
					display: flex;
					align-items: center;
					justify-content: space-between;
					gap: var(--space-2);

					.price {
						display: flex;
						flex-direction: column;
						font-family: var(--font-body);
						font-weight: 700;
						color: var(--gold);
						s {
							font-weight: 400;
							font-size: var(--fs-xs);
							color: var(--gray-300);
						}
					}
					.grab {
						padding: var(--space-2) var(--space-3);
						border-radius: var(--radius-pill);
						background: var(--accent);
						color: var(--accent-text);
						font-family: var(--font-ui);
						font-weight: 600;
						font-size: var(--fs-xs);
						&:disabled {
							opacity: 0.5;
							cursor: not-allowed;
						}
					}
				}
			}
		}
	}
</style>
