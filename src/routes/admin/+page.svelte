<script lang="ts">
	import { STATUS_LABELS } from '$lib/config';
	import { formatPrice } from '$lib/utils/money';

	let { data } = $props();
</script>

<h1>Vue d'ensemble</h1>

<div class="stats">
	<div class="stat accent">
		<span class="num">{formatPrice(data.revenue)}</span>
		<span class="lbl">Chiffre d'affaires (hors annulées)</span>
	</div>
	<div class="stat">
		<span class="num">{data.orderCount}</span>
		<span class="lbl">Commandes</span>
	</div>
	<div class="stat">
		<span class="num">{data.productCount}</span>
		<span class="lbl">Produits</span>
	</div>
	<div class="stat warn">
		<span class="num">{data.lowStock.length}</span>
		<span class="lbl">Stock faible (&lt; 5)</span>
	</div>
</div>

<div class="grid">
	<section class="card">
		<h2>Commandes par statut</h2>
		<ul class="statuses">
			{#each Object.entries(data.statusCounts) as [key, count] (key)}
				<li><span>{STATUS_LABELS[key]}</span><strong>{count}</strong></li>
			{/each}
		</ul>
	</section>

	<section class="card">
		<h2>Commandes récentes</h2>
		{#if data.recentOrders.length === 0}
			<p class="muted">Aucune commande pour le moment.</p>
		{:else}
			<ul class="recent">
				{#each data.recentOrders as o (o.id)}
					<li>
						<a href="/admin/orders#order-{o.id}">{o.public_ref}</a>
						<span>{o.customer_name}</span>
						<span class="badge">{STATUS_LABELS[o.status]}</span>
						<strong>{formatPrice(o.total)}</strong>
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<section class="card span">
		<h2>Réassort recommandé</h2>
		{#if data.lowStock.length === 0}
			<p class="muted">Tous les stocks sont sains. 👌</p>
		{:else}
			<ul class="lowstock">
				{#each data.lowStock as p (p.id)}
					<li>
						<span>{p.name}</span>
						<strong class:zero={p.stock === 0}>{p.stock} en stock</strong>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</div>

<style>
	h1 {
		font-size: var(--fs-h2);
		margin-bottom: var(--space-6);
	}
	.stats {
		display: grid;
		gap: var(--space-4);
		grid-template-columns: repeat(2, 1fr);
		margin-bottom: var(--space-8);

		.stat {
			padding: var(--space-6);
			border-radius: var(--radius-lg);
			background: var(--surface-raised);
			border: 1px solid var(--border);
			display: flex;
			flex-direction: column;
			gap: var(--space-1);

			.num {
				font-family: var(--font-body);
				font-weight: 700;
				font-size: var(--fs-h3);
			}
			.lbl {
				font-size: var(--fs-xs);
				color: var(--text-muted);
			}
			&.accent .num {
				color: var(--accent);
			}
			&.warn .num {
				color: var(--caramel);
			}
		}
	}
	.grid {
		display: grid;
		gap: var(--space-4);
		grid-template-columns: 1fr;
	}
	.card {
		padding: var(--space-6);
		border-radius: var(--radius-lg);
		background: var(--surface-raised);
		border: 1px solid var(--border);

		h2 {
			font-size: var(--fs-h3);
			margin-bottom: var(--space-4);
		}
		.muted {
			color: var(--text-muted);
		}
	}
	.statuses {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		li {
			display: flex;
			justify-content: space-between;
			padding: var(--space-2) 0;
			border-bottom: 1px solid var(--border);
		}
	}
	.recent {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		li {
			display: grid;
			grid-template-columns: auto 1fr auto auto;
			gap: var(--space-3);
			align-items: center;
			font-size: var(--fs-sm);
			padding: var(--space-2) 0;
			border-bottom: 1px solid var(--border);

			a {
				font-family: var(--font-mono);
				color: var(--accent);
			}
			.badge {
				font-size: var(--fs-xs);
				color: var(--text-muted);
			}
		}
	}
	.lowstock {
		display: grid;
		grid-template-columns: 1fr;
		gap: var(--space-2);
		li {
			display: flex;
			justify-content: space-between;
			gap: var(--space-3);
			font-size: var(--fs-sm);
			padding: var(--space-2) 0;
			border-bottom: 1px solid var(--border);

			strong.zero {
				color: var(--accent);
			}
		}
	}

	@media (min-width: 768px) {
		.stats {
			grid-template-columns: repeat(4, 1fr);
		}
		.grid {
			grid-template-columns: 1fr 1fr;
		}
		.card.span {
			grid-column: 1 / -1;
		}
		.lowstock {
			grid-template-columns: 1fr 1fr;
			gap: var(--space-2) var(--space-8);
		}
	}
</style>
