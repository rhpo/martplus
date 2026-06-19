<script lang="ts">
	let { kind }: { kind: 'BESTSELLER' | 'PROMO' | 'NOUVEAU' } = $props();

	const LABELS: Record<string, string> = {
		BESTSELLER: 'Bestseller',
		PROMO: 'Promo',
		NOUVEAU: 'Nouveau'
	};
</script>

<span class="badge {kind.toLowerCase()}">{LABELS[kind]}</span>

<style>
	.badge {
		display: inline-block;
		padding: var(--space-1) var(--space-3);
		border-radius: var(--radius-pill);
		font-family: var(--font-ui);
		font-weight: 700;
		font-size: var(--fs-xs);
		letter-spacing: 0.5px;
		text-transform: uppercase;
		color: var(--white);

		&.bestseller {
			background: var(--navy-600);
		}
		&.promo {
			background: var(--accent);
		}
		&.nouveau {
			background: var(--caramel);
		}
	}
</style>
