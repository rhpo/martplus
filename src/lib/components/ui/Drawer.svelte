<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import type { Snippet } from 'svelte';
	import Close from '$lib/components/icons/Close.svelte';

	let {
		open = false,
		title,
		side = 'right',
		onclose,
		children,
		footer
	}: {
		open?: boolean;
		title: string;
		side?: 'right' | 'left';
		onclose: () => void;
		children: Snippet;
		footer?: Snippet;
	} = $props();

	let panel = $state<HTMLElement | null>(null);
	let trigger: Element | null = null;
	const titleId = `drawer-${Math.random().toString(36).slice(2, 8)}`;

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
	<div
		class="overlay"
		transition:fade={{ duration: 200 }}
		onclick={onclose}
		role="presentation"
	></div>
	<div
		class="drawer {side}"
		bind:this={panel}
		role="dialog"
		aria-modal="true"
		aria-labelledby={titleId}
		tabindex="-1"
		onkeydown={onKeydown}
		transition:fly={{ x: side === 'right' ? 380 : -380, duration: 300, easing: cubicOut }}
	>
		<header>
			<h2 id={titleId}>{title}</h2>
			<button class="close" onclick={onclose} aria-label="Fermer">
				<Close size={22} />
			</button>
		</header>
		<div class="body scroll-x">
			{@render children()}
		</div>
		{#if footer}
			<footer>{@render footer()}</footer>
		{/if}
	</div>
{/if}

<style>
	.overlay {
		position: fixed;
		inset: 0;
		background: rgba(15, 23, 41, 0.55);
		backdrop-filter: blur(2px);
		z-index: var(--z-overlay);
	}
	.drawer {
		position: fixed;
		top: 0;
		bottom: 0;
		z-index: var(--z-drawer);
		width: min(420px, 100vw);
		display: flex;
		flex-direction: column;
		background: var(--surface);
		box-shadow: var(--shadow-pop);

		&.right {
			right: 0;
		}
		&.left {
			left: 0;
		}

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
			flex: 1;
			overflow-y: auto;
			padding: var(--space-4) var(--space-6);
		}
		footer {
			border-top: 1px solid var(--border);
			padding: var(--space-4) var(--space-6);
			background: var(--surface-raised);
		}
	}

	@media (max-width: 480px) {
		.drawer {
			width: 100vw;
		}
	}
</style>
