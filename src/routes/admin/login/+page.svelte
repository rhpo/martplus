<script lang="ts">
	import Field from '$lib/components/ui/Field.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	let { form } = $props();
	let password = $state('');
</script>

<div class="login">
	<div class="card">
		<span class="logo">MART<span>+</span></span>
		<h1>Espace administrateur</h1>
		<p class="sub">Connectez-vous pour gérer commandes et produits.</p>
		<form method="POST" action="?/login">
			<Field
				label="Mot de passe"
				name="password"
				type="password"
				bind:value={password}
				required
				error={form?.message ?? ''}
			/>
			<Button full size="lg" type="submit">Se connecter</Button>
		</form>
	</div>
</div>

<style>
	.login {
		display: grid;
		place-items: center;
		min-height: 70vh;
	}
	.card {
		width: min(400px, 100%);
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		padding: var(--space-8);
		border-radius: var(--radius-lg);
		background: var(--surface-raised);
		border: 1px solid var(--border);

		.logo {
			font-family: var(--font-serif);
			font-weight: 700;
			font-size: 1.8rem;
			span {
				color: var(--accent);
			}
		}
		h1 {
			font-size: var(--fs-h3);
		}
		.sub {
			color: var(--text-muted);
			font-size: var(--fs-sm);
			margin-bottom: var(--space-2);
		}
		form {
			display: flex;
			flex-direction: column;
			gap: var(--space-4);
		}
	}
</style>
