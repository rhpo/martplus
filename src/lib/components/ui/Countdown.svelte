<script lang="ts">
	import { onDestroy } from 'svelte';
	import { browser } from '$app/environment';

	let { until, expiredLabel = 'Offre terminée' }: { until: string | number | Date; expiredLabel?: string } =
		$props();

	const target = $derived(new Date(until).getTime());
	let now = $state(Date.now());

	let timer: ReturnType<typeof setInterval> | null = null;
	if (browser) {
		timer = setInterval(() => (now = Date.now()), 1000);
	}
	onDestroy(() => {
		if (timer) clearInterval(timer);
	});

	const remaining = $derived(Math.max(0, target - now));
	const expired = $derived(remaining <= 0);
	const h = $derived(Math.floor(remaining / 3_600_000));
	const m = $derived(Math.floor((remaining % 3_600_000) / 60_000));
	const s = $derived(Math.floor((remaining % 60_000) / 1000));

	const pad = (n: number) => String(n).padStart(2, '0');
</script>

{#if expired}
	<span class="expired">{expiredLabel}</span>
{:else}
	<span class="countdown" aria-label="Temps restant">
		<span class="seg">{pad(h)}</span><span class="sep">:</span><span class="seg">{pad(m)}</span><span
			class="sep">:</span
		><span class="seg">{pad(s)}</span>
	</span>
{/if}

<style>
	.countdown {
		display: inline-flex;
		align-items: center;
		gap: 2px;
		font-family: var(--font-mono);
		font-weight: 500;

		.seg {
			background: var(--accent);
			color: var(--accent-text);
			padding: var(--space-1) var(--space-2);
			border-radius: var(--radius-sm);
			min-width: 2.2ch;
			text-align: center;
		}
		.sep {
			color: var(--accent);
			font-weight: 700;
		}
	}
	.expired {
		font-family: var(--font-mono);
		color: var(--text-muted);
	}
</style>
