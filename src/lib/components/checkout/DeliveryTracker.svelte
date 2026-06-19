<script lang="ts">
	import type { OrderStatus } from '$lib/types';

	let { status = 'pending' }: { status?: OrderStatus } = $props();

	const steps = [
		{ key: 'preparing', label: 'Sachet Emballé', emoji: '📦' },
		{ key: 'out_for_delivery', label: 'En Route', emoji: '🚲' },
		{ key: 'delivered', label: 'Livré !', emoji: '✅' }
	];

	const order: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered'];

	function reached(stepKey: string): boolean {
		return order.indexOf(status) >= order.indexOf(stepKey as OrderStatus);
	}
</script>

<ol class="tracker" class:cancelled={status === 'cancelled'}>
	{#each steps as step, i (step.key)}
		<li class="step" class:active={reached(step.key)}>
			<span class="bubble">{step.emoji}</span>
			<span class="label">{step.label}</span>
			{#if i < steps.length - 1}<span class="bar" class:filled={reached(steps[i + 1].key)}></span>{/if}
		</li>
	{/each}
</ol>
{#if status === 'cancelled'}
	<p class="cancel-note">Cette commande a été annulée.</p>
{/if}

<style>
	.tracker {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--space-2);

		.step {
			position: relative;
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: var(--space-2);
			flex: 1;
			text-align: center;

			.bubble {
				display: grid;
				place-items: center;
				width: 48px;
				height: 48px;
				border-radius: var(--radius-pill);
				background: var(--surface-inset);
				border: 2px solid var(--border);
				font-size: 1.3rem;
				transition:
					background var(--dur) var(--ease),
					border-color var(--dur) var(--ease),
					transform var(--dur) var(--ease);
			}
			.label {
				font-family: var(--font-ui);
				font-weight: 600;
				font-size: var(--fs-xs);
				color: var(--text-muted);
			}
			.bar {
				position: absolute;
				top: 24px;
				left: 50%;
				width: 100%;
				height: 3px;
				background: var(--border);
				z-index: -1;

				&.filled {
					background: var(--accent);
				}
			}

			&.active {
				.bubble {
					background: var(--accent);
					border-color: var(--accent);
					transform: scale(1.05);
				}
				.label {
					color: var(--text);
				}
			}
		}

		&.cancelled {
			opacity: 0.5;
		}
	}
	.cancel-note {
		margin-top: var(--space-3);
		text-align: center;
		color: var(--accent);
		font-weight: 600;
	}
</style>
