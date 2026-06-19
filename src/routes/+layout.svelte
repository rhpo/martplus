<script lang="ts">
	import '../styles/app.css';
	import { page } from '$app/state';
	import AnnouncementBar from '$lib/components/layout/AnnouncementBar.svelte';
	import Header from '$lib/components/layout/Header.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import WhatsAppBubble from '$lib/components/layout/WhatsAppBubble.svelte';
	import CartDrawer from '$lib/components/cart/CartDrawer.svelte';
	import WishlistDrawer from '$lib/components/wishlist/WishlistDrawer.svelte';
	import MartyDrawer from '$lib/components/marty/MartyDrawer.svelte';
	import ProductQuickView from '$lib/components/product/ProductQuickView.svelte';
	import Toast from '$lib/components/ui/Toast.svelte';

	let { data, children } = $props();
	const isAdmin = $derived(page.url.pathname.startsWith('/admin'));
</script>

{#if isAdmin}
	{@render children()}
{:else}
	<AnnouncementBar />
	<Header />
	<main>
		{@render children()}
	</main>
	<Footer categories={data.categories} />

	<CartDrawer />
	<WishlistDrawer />
	<MartyDrawer />
	<ProductQuickView />
	<Toast />
	<WhatsAppBubble number={data.whatsappNumber} />
{/if}
