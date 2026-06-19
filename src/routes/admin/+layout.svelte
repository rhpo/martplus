<script lang="ts">
	import '../../styles/app.css';
	import { page } from '$app/state';
	import { enhance } from '$app/forms';

	let { data, children } = $props();
	const path = $derived(page.url.pathname);
</script>

<svelte:head>
	<title>Admin · MART+</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="admin">
	{#if data.isAdmin}
		<header class="bar">
			<a class="logo" href="/admin">MART<span>+</span> <em>admin</em></a>
			<nav>
				<a class:active={path === '/admin'} href="/admin">Vue d'ensemble</a>
				<a class:active={path.startsWith('/admin/orders')} href="/admin/orders">Commandes</a>
				<a class:active={path.startsWith('/admin/products')} href="/admin/products">Produits</a>
			</nav>
			<form method="POST" action="/admin/login?/logout" use:enhance>
				<button type="submit" class="logout">Déconnexion</button>
			</form>
		</header>
	{/if}
	<main class="content">
		{@render children()}
	</main>
</div>

<style>
	.admin {
		min-height: 100vh;
		background: var(--surface);
		color: var(--text);
	}
	.bar {
		display: flex;
		align-items: center;
		gap: var(--space-6);
		flex-wrap: wrap;
		padding: var(--space-3) var(--space-6);
		background: var(--header-bg);
		color: var(--header-text);

		.logo {
			font-family: var(--font-serif);
			font-weight: 700;
			font-size: 1.3rem;
			span {
				color: var(--accent);
			}
			em {
				font-family: var(--font-mono);
				font-size: var(--fs-xs);
				font-style: normal;
				color: var(--gold);
			}
		}
		nav {
			display: flex;
			gap: var(--space-2);
			flex: 1;

			a {
				padding: var(--space-2) var(--space-4);
				border-radius: var(--radius-pill);
				font-family: var(--font-ui);
				font-weight: 600;
				font-size: var(--fs-sm);
				color: var(--gray-300);

				&:hover {
					background: rgba(255, 255, 255, 0.1);
					color: var(--white);
				}
				&.active {
					background: var(--accent);
					color: var(--accent-text);
				}
			}
		}
		.logout {
			padding: var(--space-2) var(--space-4);
			border-radius: var(--radius-pill);
			border: 1px solid rgba(255, 255, 255, 0.3);
			color: var(--header-text);
			font-size: var(--fs-sm);
			&:hover {
				background: rgba(255, 255, 255, 0.1);
			}
		}
	}
	.content {
		padding: var(--space-8) var(--space-6);
		max-width: 1240px;
		margin-inline: auto;
	}
</style>
