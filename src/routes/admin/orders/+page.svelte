<script lang="ts">
	import { enhance } from '$app/forms';
	import { STATUS_LABELS } from '$lib/config';
	import { formatPrice } from '$lib/utils/money';
	import type { Order } from '$lib/types';
	import Stepper from '$lib/components/ui/Stepper.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	let { data, form } = $props();

	const STATUSES = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];

	let editingId = $state<number | null>(null);
	let draftItems = $state<{ productId: number; name: string; quantity: number }[]>([]);
	let draftName = $state('');
	let draftPhone = $state('');
	let draftAddress = $state('');
	let draftEmail = $state('');
	let addId = $state('');
	let addQty = $state(1);

	function startEdit(o: Order) {
		editingId = o.id;
		draftItems = o.items.map((it) => ({
			productId: it.product_id,
			name: it.name_snapshot,
			quantity: it.quantity
		}));
		draftName = o.customer_name;
		draftPhone = o.customer_phone;
		draftAddress = o.customer_address;
		draftEmail = o.customer_email ?? '';
		addId = '';
		addQty = 1;
	}

	function addItem() {
		const id = Number(addId);
		if (!Number.isFinite(id) || id <= 0) return;
		const existing = draftItems.find((d) => d.productId === id);
		if (existing) existing.quantity += addQty;
		else draftItems.push({ productId: id, name: `Produit #${id}`, quantity: addQty });
		addId = '';
		addQty = 1;
	}

	const itemsJson = $derived(
		JSON.stringify(
			draftItems
				.filter((d) => d.quantity > 0)
				.map((d) => ({ productId: d.productId, quantity: d.quantity }))
		)
	);

	function osmLink(o: Order): string {
		return `https://www.openstreetmap.org/?mlat=${o.customer_lat}&mlon=${o.customer_lng}#map=16/${o.customer_lat}/${o.customer_lng}`;
	}
</script>

<h1>Commandes</h1>

{#if form?.message}<p class="err" role="alert">{form.message}</p>{/if}

{#if data.orders.length === 0}
	<p class="muted">Aucune commande pour le moment.</p>
{:else}
	<div class="table-wrap">
		<table>
			<thead>
				<tr>
					<th>Réf</th><th>Client</th><th>Téléphone</th><th>Total</th><th>Statut</th><th>Date</th><th></th>
				</tr>
			</thead>
			<tbody>
				{#each data.orders as o (o.id)}
					<tr id="order-{o.id}">
						<td class="mono">{o.public_ref}</td>
						<td>{o.customer_name}</td>
						<td>{o.customer_phone}</td>
						<td class="num">{formatPrice(o.total)}</td>
						<td>
							<form method="POST" action="?/updateStatus" use:enhance>
								<input type="hidden" name="orderId" value={o.id} />
								<select
									name="status"
									value={o.status}
									onchange={(e) => e.currentTarget.form?.requestSubmit()}
								>
									{#each STATUSES as s (s)}
										<option value={s}>{STATUS_LABELS[s]}</option>
									{/each}
								</select>
							</form>
						</td>
						<td class="date">{new Date(o.created_at).toLocaleDateString('fr')}</td>
						<td>
							<button class="link" onclick={() => (editingId === o.id ? (editingId = null) : startEdit(o))}>
								{editingId === o.id ? 'Fermer' : 'Détails / Modifier'}
							</button>
						</td>
					</tr>
					{#if editingId === o.id}
						<tr class="detail-row">
							<td colspan="7">
								<div class="detail">
									<div class="addr">
										<strong>Livraison</strong>
										<p>{o.customer_address}</p>
										<p class="mono">
											📍 {o.distance_km.toFixed(2)} km ·
											<a href={osmLink(o)} target="_blank" rel="noopener">voir sur la carte</a>
										</p>
									</div>

									<form
										method="POST"
										action="?/editOrder"
										use:enhance={() => {
											return async ({ update }) => {
												await update();
												editingId = null;
											};
										}}
									>
										<input type="hidden" name="orderId" value={o.id} />
										<input type="hidden" name="items" value={itemsJson} />

										<div class="edit-grid">
											<label>Nom<input name="customer_name" bind:value={draftName} /></label>
											<label>Téléphone<input name="customer_phone" bind:value={draftPhone} /></label>
											<label>Email<input name="customer_email" bind:value={draftEmail} /></label>
											<label class="full">Adresse<input name="customer_address" bind:value={draftAddress} /></label>
										</div>

										<div class="items">
											<strong>Articles</strong>
											{#each draftItems as it (it.productId)}
												<div class="item" class:removed={it.quantity === 0}>
													<span>{it.name} <em class="mono">#{it.productId}</em></span>
													<Stepper bind:value={it.quantity} min={0} max={999} />
												</div>
											{/each}

											<div class="add">
												<input type="number" placeholder="ID produit" bind:value={addId} min="1" />
												<input type="number" bind:value={addQty} min="1" />
												<button type="button" class="link" onclick={addItem}>Ajouter l'article</button>
											</div>
										</div>

										<Button type="submit">Enregistrer les modifications</Button>
									</form>
								</div>
							</td>
						</tr>
					{/if}
				{/each}
			</tbody>
		</table>
	</div>
{/if}

<style>
	h1 {
		font-size: var(--fs-h2);
		margin-bottom: var(--space-6);
	}
	.err {
		padding: var(--space-3) var(--space-4);
		border-radius: var(--radius-md);
		background: color-mix(in srgb, var(--accent) 14%, transparent);
		color: var(--accent);
		margin-bottom: var(--space-4);
	}
	.muted {
		color: var(--text-muted);
	}
	.table-wrap {
		overflow-x: auto;
		border-radius: var(--radius-lg);
		border: 1px solid var(--border);
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: var(--fs-sm);
		background: var(--surface-raised);

		th,
		td {
			padding: var(--space-3) var(--space-4);
			text-align: left;
			border-bottom: 1px solid var(--border);
			white-space: nowrap;
		}
		th {
			font-family: var(--font-ui);
			font-weight: 600;
			color: var(--text-muted);
			font-size: var(--fs-xs);
			text-transform: uppercase;
		}
		.mono {
			font-family: var(--font-mono);
		}
		.num {
			font-weight: 700;
		}
		.date {
			color: var(--text-muted);
		}
		select {
			padding: var(--space-1) var(--space-2);
			border-radius: var(--radius-sm);
			border: 1px solid var(--border);
			background: var(--surface);
			color: var(--text);
		}
		.link {
			color: var(--accent);
			font-weight: 600;
			font-size: var(--fs-xs);
		}
	}
	.detail-row td {
		white-space: normal;
		background: var(--surface);
	}
	.detail {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		padding: var(--space-2) 0;

		.addr {
			font-size: var(--fs-sm);
			p {
				color: var(--text-muted);
				margin-top: var(--space-1);
			}
			a {
				color: var(--accent);
				text-decoration: underline;
			}
		}
		.edit-grid {
			display: grid;
			gap: var(--space-3);
			grid-template-columns: 1fr 1fr;

			label {
				display: flex;
				flex-direction: column;
				gap: var(--space-1);
				font-size: var(--fs-xs);
				font-weight: 600;

				&.full {
					grid-column: 1 / -1;
				}
				input {
					padding: var(--space-2) var(--space-3);
					border-radius: var(--radius-sm);
					border: 1px solid var(--border);
					background: var(--surface-raised);
					color: var(--text);
					font-weight: 400;
				}
			}
		}
		.items {
			display: flex;
			flex-direction: column;
			gap: var(--space-2);

			.item {
				display: flex;
				align-items: center;
				justify-content: space-between;
				gap: var(--space-3);
				padding: var(--space-2);
				border-radius: var(--radius-sm);
				background: var(--surface-raised);

				&.removed {
					opacity: 0.45;
					text-decoration: line-through;
				}
				em {
					color: var(--text-muted);
					font-style: normal;
				}
			}
			.add {
				display: flex;
				gap: var(--space-2);
				align-items: center;

				input {
					width: 110px;
					padding: var(--space-2) var(--space-3);
					border-radius: var(--radius-sm);
					border: 1px solid var(--border);
					background: var(--surface-raised);
					color: var(--text);
				}
				.link {
					color: var(--accent);
					font-weight: 600;
				}
			}
		}
	}

	@media (max-width: 600px) {
		.detail .edit-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
