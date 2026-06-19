<script lang="ts">
	let {
		value,
		max = 100,
		label = '',
		tone = 'accent'
	}: { value: number; max?: number; label?: string; tone?: 'accent' | 'gold' } = $props();

	const pct = $derived(Math.max(0, Math.min(100, (value / max) * 100)));
</script>

<div class="meter">
	{#if label}<span class="label">{label}</span>{/if}
	<div
		class="track"
		role="progressbar"
		aria-valuenow={Math.round(pct)}
		aria-valuemin="0"
		aria-valuemax="100"
	>
		<div class="fill {tone}" style:width="{pct}%"></div>
	</div>
</div>

<style>
	.meter {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		width: 100%;

		.label {
			font-family: var(--font-mono);
			font-size: var(--fs-xs);
			color: var(--text-muted);
		}
		.track {
			height: 8px;
			border-radius: var(--radius-pill);
			background: var(--surface-inset);
			overflow: hidden;
		}
		.fill {
			height: 100%;
			border-radius: var(--radius-pill);
			transition: width var(--dur-slow) var(--ease);

			&.accent {
				background: var(--accent);
			}
			&.gold {
				background: var(--gold);
			}
		}
	}
</style>
