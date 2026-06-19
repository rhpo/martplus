<script lang="ts">
	import { PROMO_CODE } from '$lib/config';
	import { coupon } from '$lib/stores/coupon.svelte';
	import Check from '$lib/components/icons/Check.svelte';

	let code = $state(coupon.code ?? '');
	let error = $state('');

	function apply(e: SubmitEvent) {
		e.preventDefault();
		const c = code.trim().toUpperCase();
		if (c === PROMO_CODE) {
			coupon.set(c);
			error = '';
		} else {
			coupon.set(null);
			error = 'Code promo invalide.';
		}
	}

	function clear() {
		coupon.set(null);
		code = '';
		error = '';
	}
</script>

<form class="coupon" onsubmit={apply}>
	{#if coupon.code}
		<div class="active">
			<span class="ok"><Check size={14} /></span>
			Code <strong>{coupon.code}</strong> appliqué (−{coupon.percent}%)
			<button type="button" class="remove" onclick={clear}>Retirer</button>
		</div>
	{:else}
		<div class="row" class:has-error={!!error}>
			<input
				type="text"
				bind:value={code}
				placeholder="Code promo (ex : {PROMO_CODE})"
				aria-label="Code promo"
			/>
			<button type="submit">Appliquer</button>
		</div>
		{#if error}<p class="err" role="alert">{error}</p>{/if}
	{/if}
</form>

<style>
	.coupon {
		.row {
			display: flex;
			gap: var(--space-2);

			input {
				flex: 1;
				min-width: 0;
				padding: var(--space-3) var(--space-4);
				border: 1.5px solid var(--border);
				border-radius: var(--radius-md);
				background: var(--surface-raised);
				color: var(--text);
				font-size: var(--fs-sm);

				&:focus-visible {
					outline: none;
					border-color: var(--accent);
				}
			}
			button {
				padding: var(--space-2) var(--space-4);
				border-radius: var(--radius-md);
				background: var(--navy-800);
				color: var(--white);
				font-family: var(--font-ui);
				font-weight: 600;
				font-size: var(--fs-sm);
				&:hover {
					background: var(--accent);
				}
			}
			&.has-error input {
				border-color: var(--accent);
			}
		}
		.err {
			margin-top: var(--space-1);
			color: var(--accent);
			font-size: var(--fs-xs);
		}
		.active {
			display: flex;
			align-items: center;
			gap: var(--space-2);
			font-size: var(--fs-sm);
			padding: var(--space-2) var(--space-3);
			border-radius: var(--radius-md);
			background: color-mix(in srgb, var(--gold) 22%, transparent);

			.ok {
				display: grid;
				place-items: center;
				width: 20px;
				height: 20px;
				border-radius: var(--radius-pill);
				background: var(--accent);
				color: var(--accent-text);
			}
			.remove {
				margin-left: auto;
				color: var(--accent);
				font-weight: 600;
				font-size: var(--fs-xs);
				text-decoration: underline;
			}
		}
	}
</style>
