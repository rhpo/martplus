<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import type { Snippet } from 'svelte';
	import Close from '$lib/components/icons/Close.svelte';

	let {
		open = false,
		title,
		onclose,
		children
	}: {
		open?: boolean;
		title: string;
		onclose: () => void;
		children: Snippet;
	} = $props();

	let panel = $state<HTMLElement | null>(null);
	let trigger: Element | null = null;
	const titleId = `modal-${Math.random().toString(36).slice(2, 8)}`;

	function focusables(): HTMLElement[] {
		if (!panel) return [];
		return Array.from(
			panel.querySelectorAll<HTMLElement>(
				'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'
			)
		).filter((el) => el.offsetParent !== null);
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			e.preventDefault();
			onclose();
			return;
		}
		if (e.key === 'Tab') {
			const items = focusables();
			if (items.length === 0) return;
			const first = items[0];
			const last = items[items.length - 1];
			if (e.shiftKey && document.activeElement === first) {
				e.preventDefault();
				last.focus();
			} else if (!e.shiftKey && document.activeElement === last) {
				e.preventDefault();
				first.focus();
			}
		}
	}

	$effect(() => {
		if (open) {
			trigger = document.activeElement;
			document.body.classList.add('is-locked');
			queueMicrotask(() => focusables()[0]?.focus());
		} else {
			document.body.classList.remove('is-locked');
			if (trigger instanceof HTMLElement) trigger.focus();
		}
		return () => document.body.classList.remove('is-locked');
	});
</script>

{#if open}
	<div class="overlay" transition:fade={{ duration: 200 }} onclick={onclose} role="presentation">
		<div
			class="modal"
			bind:this={panel}
			role="dialog"
			aria-modal="true"
			aria-labelledby={titleId}
			tabindex="-1"
			onkeydown={onKeydown}
			onclick={(e) => e.stopPropagation()}
			transition:scale={{ start: 0.94, duration: 260, easing: cubicOut }}
		>
			<header>
				<h2 id={titleId}>{title}</h2>
				<button class="close" onclick={onclose} aria-label="Fermer">
					<Close size={22} />
				</button>
			</header>
			<div class="body">
				{@render children()}
			</div>
		</div>
	</div>
{/if}

<style>
	.overlay {
		position: fixed;
		inset: 0;
		z-index: var(--z-modal);
		display: grid;
		place-items: center;
		padding: var(--space-4);
		background: rgba(15, 23, 41, 0.6);
		backdrop-filter: blur(3px);
	}
	.modal {
		width: min(640px, 100%);
		max-height: 90vh;
		display: flex;
		flex-direction: column;
		background: var(--surface);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-pop);
		overflow: hidden;

		header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: var(--space-4) var(--space-6);
			border-bottom: 1px solid var(--border);

			h2 {
				font-family: var(--font-serif);
				font-size: var(--fs-h3);
			}
			.close {
				display: grid;
				place-items: center;
				width: 40px;
				height: 40px;
				border-radius: var(--radius-pill);
				color: var(--text);
				&:hover {
					background: var(--surface-inset);
				}
			}
		}
		.body {
			overflow-y: auto;
			padding: var(--space-6);
		}
	}

	@media (max-width: 480px) {
		.overlay {
			padding: 0;
			place-items: end stretch;
		}
		.modal {
			width: 100%;
			max-height: 92vh;
			border-radius: var(--radius-lg) var(--radius-lg) 0 0;
		}
	}
</style>
