<script lang="ts">
	import CheckoutFlow from '$lib/components/checkout/CheckoutFlow.svelte';

	let { form } = $props();
</script>

<svelte:head>
	<title>Commander · MART+</title>
</svelte:head>

<section class="checkout container">
	<h1>Finaliser ma commande</h1>
	<CheckoutFlow formError={form?.message ?? ''} />
</section>

<style>
	.checkout {
		max-width: 720px;
		padding-block: var(--space-8) var(--space-16);

		h1 {
			font-size: var(--fs-h2);
			margin-bottom: var(--space-8);
		}
	}
</style>
