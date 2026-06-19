<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		variant = 'primary',
		size = 'md',
		href = undefined,
		type = 'button',
		disabled = false,
		full = false,
		onclick = undefined,
		children,
		trailing
	}: {
		variant?: 'primary' | 'ghost' | 'nav';
		size?: 'sm' | 'md' | 'lg';
		href?: string;
		type?: 'button' | 'submit';
		disabled?: boolean;
		full?: boolean;
		onclick?: (e: MouseEvent) => void;
		children: Snippet;
		trailing?: Snippet;
	} = $props();
</script>

{#if href}
	<a class="btn {variant} {size}" class:full data-disabled={disabled} {href} {onclick}>
		{@render children()}
		{#if trailing}<span class="trailing">{@render trailing()}</span>{/if}
	</a>
{:else}
	<button class="btn {variant} {size}" class:full {type} {disabled} {onclick}>
		{@render children()}
		{#if trailing}<span class="trailing">{@render trailing()}</span>{/if}
	</button>
{/if}

<style>
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		font-family: var(--font-ui);
		font-weight: 600;
		border-radius: var(--radius-pill);
		border: 2px solid transparent;
		transition:
			transform var(--dur-fast) var(--ease),
			background var(--dur) var(--ease),
			color var(--dur) var(--ease),
			border-color var(--dur) var(--ease);
		white-space: nowrap;
		text-align: center;

		&.full {
			width: 100%;
		}
		&.sm {
			padding: var(--space-2) var(--space-3);
			font-size: var(--fs-sm);
		}
		&.md {
			padding: var(--space-3) var(--space-6);
			font-size: var(--fs-md);
		}
		&.lg {
			padding: var(--space-4) var(--space-8);
			font-size: var(--fs-lg);
		}

		&.primary {
			background: var(--accent);
			color: var(--accent-text);
			&:hover {
				transform: translateY(-1px) scale(1.02);
			}
			&:active {
				transform: translateY(0) scale(0.99);
			}
		}
		&.ghost {
			background: transparent;
			color: currentColor;
			border-color: currentColor;
			&:hover {
				background: var(--accent);
				color: var(--accent-text);
				border-color: var(--accent);
			}
		}
		&.nav {
			background: var(--surface-inset);
			color: var(--text);
			&:hover {
				background: var(--accent);
				color: var(--accent-text);
			}
		}

		&:disabled,
		&[data-disabled='true'] {
			opacity: 0.45;
			cursor: not-allowed;
			pointer-events: none;
		}

		.trailing {
			display: inline-flex;
			transition: transform var(--dur) var(--ease);
		}
		&:hover .trailing {
			transform: translateX(3px);
		}
	}
</style>
