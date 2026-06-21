<script lang="ts">
	import { scale, fly } from 'svelte/transition';
	import { ui } from '$lib/stores/ui.svelte';
	import WhatsApp from '$lib/components/icons/WhatsApp.svelte';
	import Close from '$lib/components/icons/Close.svelte';
	import ArrowRight from '$lib/components/icons/ArrowRight.svelte';

	let { number }: { number: string } = $props();

	// Presentational only: a plain wa.me deep link. No WhatsApp API, no order data.
	const digits = $derived(number.replace(/\D/g, ''));

	let open = $state(false);
	let message = $state('');

	function send() {
		const text = message.trim();
		// Opens the same wa.me link, with the typed message prefilled via ?text=.
		const url = text
			? `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
			: `https://wa.me/${digits}`;
		window.open(url, '_blank', 'noopener');
		message = '';
		open = false;
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			send();
		} else if (e.key === 'Escape') {
			open = false;
		}
	}
</script>

{#if !ui.hasOverlay}
	<div class="wa">
		{#if open}
			<div
				class="panel"
				role="dialog"
				aria-label="Discuter avec MART+ sur WhatsApp"
				transition:fly={{ y: 16, duration: 220 }}
			>
				<header>
					<span class="who">
						<span class="avatar"><WhatsApp size={20} /></span>
						<span class="meta">
							<strong>MART+</strong>
							<small>Répond généralement en quelques minutes</small>
						</span>
					</span>
					<button class="x" onclick={() => (open = false)} aria-label="Fermer">
						<Close size={18} />
					</button>
				</header>

				<div class="body">
					<p class="greeting">Bonjour 👋 Une question ? Écrivez-nous, on vous répond sur WhatsApp.</p>
				</div>

				<form
					class="compose"
					onsubmit={(e) => {
						e.preventDefault();
						send();
					}}
				>
					<textarea
						bind:value={message}
						onkeydown={onKeydown}
						rows="1"
						placeholder="Votre message…"
						aria-label="Votre message"
					></textarea>
					<button type="submit" aria-label="Envoyer sur WhatsApp" disabled={!message.trim()}>
						<ArrowRight size={20} />
					</button>
				</form>
			</div>
		{/if}

		<button
			class="bubble"
			class:active={open}
			onclick={() => (open = !open)}
			aria-label={open ? 'Fermer le chat WhatsApp' : 'Contacter MART+ sur WhatsApp'}
			aria-expanded={open}
			transition:scale={{ start: 0.6, duration: 280 }}
		>
			{#if open}<Close size={26} />{:else}<WhatsApp size={30} />{/if}
		</button>
	</div>
{/if}

<style>
	.wa {
		position: fixed;
		right: var(--space-4);
		bottom: var(--space-4);
		z-index: var(--z-bubble);
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: var(--space-3);
	}

	.bubble {
		display: grid;
		place-items: center;
		width: 58px;
		height: 58px;
		border-radius: var(--radius-pill);
		background: var(--whatsapp);
		color: var(--white);
		box-shadow: var(--shadow-pop);
		transition: transform var(--dur) var(--ease);
		align-self: flex-end;

		&:hover {
			transform: scale(1.08);
		}
		&:not(.active) {
			animation: pulse 2.6s var(--ease) infinite;
		}
	}

	.panel {
		width: min(320px, calc(100vw - var(--space-8)));
		background: var(--surface-raised);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-pop);
		overflow: hidden;

		header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: var(--space-2);
			padding: var(--space-3) var(--space-4);
			background: var(--whatsapp);
			color: var(--white);

			.who {
				display: flex;
				align-items: center;
				gap: var(--space-2);
			}
			.avatar {
				display: grid;
				place-items: center;
				width: 34px;
				height: 34px;
				border-radius: var(--radius-pill);
				background: rgba(255, 255, 255, 0.2);
			}
			.meta {
				display: flex;
				flex-direction: column;
				line-height: 1.2;

				strong {
					font-family: var(--font-ui);
					font-weight: 700;
					font-size: var(--fs-sm);
				}
				small {
					font-size: 0.7rem;
					opacity: 0.85;
				}
			}
			.x {
				display: grid;
				place-items: center;
				width: 30px;
				height: 30px;
				border-radius: var(--radius-pill);
				color: var(--white);
				&:hover {
					background: rgba(255, 255, 255, 0.18);
				}
			}
		}

		.body {
			padding: var(--space-4);
			background: var(--surface-inset);

			.greeting {
				background: var(--surface-raised);
				border: 1px solid var(--border);
				border-radius: var(--radius-md);
				border-bottom-left-radius: var(--space-1);
				padding: var(--space-3);
				font-size: var(--fs-sm);
				line-height: 1.5;
				color: var(--text);
			}
		}

		.compose {
			display: flex;
			align-items: flex-end;
			gap: var(--space-2);
			padding: var(--space-3);
			border-top: 1px solid var(--border);

			textarea {
				flex: 1;
				min-width: 0;
				resize: none;
				max-height: 96px;
				padding: var(--space-2) var(--space-3);
				border-radius: var(--radius-lg);
				border: 1.5px solid var(--border);
				background: var(--surface);
				color: var(--text);
				font: var(--fs-sm) / 1.4 var(--font-body);
				&:focus-visible {
					outline: none;
					border-color: var(--whatsapp);
				}
			}
			button {
				display: grid;
				place-items: center;
				width: 40px;
				height: 40px;
				flex-shrink: 0;
				border-radius: var(--radius-pill);
				background: var(--whatsapp);
				color: var(--white);
				&:disabled {
					opacity: 0.45;
					cursor: not-allowed;
				}
			}
		}
	}

	@keyframes pulse {
		0%,
		100% {
			box-shadow:
				var(--shadow-pop),
				0 0 0 0 color-mix(in srgb, var(--whatsapp) 55%, transparent);
		}
		50% {
			box-shadow:
				var(--shadow-pop),
				0 0 0 12px color-mix(in srgb, var(--whatsapp) 0%, transparent);
		}
	}

	@media (min-width: 768px) {
		.wa {
			right: var(--space-8);
			bottom: var(--space-8);
		}
	}
</style>
