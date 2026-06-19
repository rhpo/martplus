<script lang="ts">
	import type { Category } from '$lib/types';

	let { categories, activeSlug = '' }: { categories: Category[]; activeSlug?: string } = $props();

	function accentOf(cat: Category): 'navy' | 'red' | 'caramel' | 'navy-soft' {
		const a = cat.accent;
		if (a === 'red' || a === 'caramel' || a === 'navy-soft') return a;
		return 'navy';
	}
</script>

<nav class="catbar" aria-label="Catégories">
	<ul class="scroll-x">
		{#each categories as cat (cat.slug)}
			<li>
				<a
					class="pill"
					class:active={cat.slug === activeSlug}
					style:--pill-accent="var(--cat-{accentOf(cat)})"
					href="/categorie/{cat.slug}"
				>
					<span class="emoji">{cat.emoji}</span>
					{cat.label}
					{#if cat.slug === 'nouveautes'}<span class="blink" aria-hidden="true"></span>{/if}
				</a>
			</li>
		{/each}
	</ul>
</nav>

<style>
	.catbar {
		ul {
			display: flex;
			gap: var(--space-3);
			padding-block: var(--space-2);
		}
		li {
			flex-shrink: 0;
		}

		.pill {
			display: inline-flex;
			align-items: center;
			gap: var(--space-2);
			padding: var(--space-2) var(--space-4);
			border-radius: var(--radius-pill);
			border: 1.5px solid var(--border);
			background: var(--surface-raised);
			color: var(--text);
			font-family: var(--font-ui);
			font-weight: 500;
			font-size: var(--fs-sm);
			white-space: nowrap;
			transition:
				background var(--dur) var(--ease),
				color var(--dur) var(--ease),
				border-color var(--dur) var(--ease);

			.emoji {
				font-size: 1.05em;
			}
			.blink {
				width: 8px;
				height: 8px;
				border-radius: var(--radius-pill);
				background: var(--accent);
				animation: cat-blink 1.2s steps(2, start) infinite;
			}

			&:hover {
				border-color: var(--pill-accent);
			}
			&.active {
				background: var(--pill-accent);
				border-color: var(--pill-accent);
				color: var(--white);
			}
		}
	}

	@keyframes cat-blink {
		0% {
			opacity: 1;
		}
		100% {
			opacity: 0.2;
		}
	}
</style>
