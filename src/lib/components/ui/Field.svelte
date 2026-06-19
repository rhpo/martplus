<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	let {
		label,
		value = $bindable(''),
		name,
		type = 'text',
		required = false,
		error = '',
		helper = '',
		placeholder = '',
		textarea = false,
		autocomplete = undefined
	}: {
		label: string;
		value?: string;
		name: string;
		type?: string;
		required?: boolean;
		error?: string;
		helper?: string;
		placeholder?: string;
		textarea?: boolean;
		autocomplete?: HTMLInputAttributes['autocomplete'];
	} = $props();

	const id = $derived(`field-${name}`);
</script>

<div class="field" class:has-error={!!error}>
	<label for={id}>
		{label}
		{#if required}<span class="req" aria-hidden="true">*</span>{/if}
	</label>
	{#if textarea}
		<textarea {id} {name} {required} {placeholder} bind:value rows="3"></textarea>
	{:else}
		<input {id} {name} {type} {required} {placeholder} {autocomplete} bind:value />
	{/if}
	{#if helper && !error}<p class="helper">{helper}</p>{/if}
	{#if error}<p class="error" role="alert">{error}</p>{/if}
</div>

<style>
	.field {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);

		label {
			font-family: var(--font-ui);
			font-weight: 600;
			font-size: var(--fs-sm);
			color: var(--text);

			.req {
				color: var(--accent);
			}
		}

		input,
		textarea {
			width: 100%;
			padding: var(--space-3) var(--space-4);
			border-radius: var(--radius-md);
			border: 1.5px solid var(--border);
			background: var(--surface-raised);
			color: var(--text);
			font-family: var(--font-body);
			font-size: var(--fs-md);
			transition:
				border-color var(--dur) var(--ease),
				box-shadow var(--dur) var(--ease);

			&::placeholder {
				color: var(--text-muted);
			}
			&:focus-visible {
				outline: none;
				border-color: var(--accent);
				box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 25%, transparent);
			}
		}
		textarea {
			resize: vertical;
			min-height: 80px;
		}

		.helper {
			font-size: var(--fs-xs);
			color: var(--text-muted);
			line-height: 1.5;
		}
		.error {
			font-size: var(--fs-xs);
			color: var(--accent);
			font-weight: 600;
		}

		&.has-error input,
		&.has-error textarea {
			border-color: var(--accent);
		}
	}
</style>
