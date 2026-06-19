<script lang="ts">
	import Plus from '$lib/components/icons/Plus.svelte';
	import Minus from '$lib/components/icons/Minus.svelte';

	let {
		value = $bindable(1),
		min = 1,
		max = 99,
		onchange = undefined
	}: {
		value?: number;
		min?: number;
		max?: number;
		onchange?: (v: number) => void;
	} = $props();

	function set(v: number) {
		const clamped = Math.max(min, Math.min(max, v));
		value = clamped;
		onchange?.(clamped);
	}
</script>

<div class="stepper">
	<button onclick={() => set(value - 1)} disabled={value <= min} aria-label="Diminuer">
		<Minus size={16} />
	</button>
	<span class="value" aria-live="polite">{value}</span>
	<button onclick={() => set(value + 1)} disabled={value >= max} aria-label="Augmenter">
		<Plus size={16} />
	</button>
</div>

<style>
	.stepper {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		background: var(--surface-inset);
		border: 1px solid var(--border);
		border-radius: var(--radius-pill);
		padding: var(--space-1);

		button {
			display: grid;
			place-items: center;
			width: 32px;
			height: 32px;
			border-radius: var(--radius-pill);
			color: var(--text);
			transition:
				background var(--dur) var(--ease),
				color var(--dur) var(--ease);

			&:hover:not(:disabled) {
				background: var(--accent);
				color: var(--accent-text);
			}
			&:disabled {
				opacity: 0.4;
				cursor: not-allowed;
			}
		}
		.value {
			min-width: 28px;
			text-align: center;
			font-family: var(--font-mono);
			font-weight: 500;
			font-size: var(--fs-sm);
		}
	}
</style>
