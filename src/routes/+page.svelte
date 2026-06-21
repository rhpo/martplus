<script lang="ts">
  import Hero from "$lib/components/sections/Hero.svelte";
  import CategoryBar from "$lib/components/sections/CategoryBar.svelte";
  import SignatureDuos from "$lib/components/sections/SignatureDuos.svelte";
  import MartyFinder from "$lib/components/sections/MartyFinder.svelte";
  import FlashDeals from "$lib/components/sections/FlashDeals.svelte";
  import ProductGrid from "$lib/components/product/ProductGrid.svelte";

  let { data } = $props();
</script>

<svelte:head>
  <title>MART+ · Épicerie fine de terroir · Livraison à Alger</title>
  <meta
    name="description"
    content="MART+ - l'épicerie fine de terroir, sélectionnée avec exigence. Fromages, chocolats grands crus, miel de Provence, confiseries et cidres fermiers, livrés à Alger. Prix en DZD."
  />
</svelte:head>

{#if data.isSearch}
  <section class="container search-page">
    <h1>Résultats pour « {data.query} »</h1>
    <p class="count">{data.searchResults.length} produit(s) trouvé(s)</p>
    <ProductGrid
      products={data.searchResults}
      empty="Aucun produit ne correspond à votre recherche."
    />
  </section>
{:else}
  <Hero heroProduct={data.heroProduct} />

  <div class="container catbar-wrap">
    <CategoryBar categories={data.categories} />
  </div>

  <MartyFinder />

  <SignatureDuos duos={data.duos} />

  <FlashDeals products={data.flashDeals} endsAt={data.flashEndsAt} />

  <section class="container bestsellers" id="rayons">
    <header class="head">
      <span class="eyebrow">NOS RAYONS</span>
      <h2>Les coups de cœur MART+</h2>
    </header>
    <ProductGrid products={data.bestsellers} />
  </section>
{/if}

<style>
  .catbar-wrap {
    padding-block: var(--space-6);
  }
  .bestsellers {
    padding-block: var(--space-12);

    .head {
      margin-bottom: var(--space-6);
      .eyebrow {
        font-family: var(--font-mono);
        font-size: var(--fs-xs);
        letter-spacing: 1px;
        color: var(--accent);
      }
      h2 {
        font-size: var(--fs-h2);
        margin-top: var(--space-2);
      }
    }
  }
  .search-page {
    padding-block: var(--space-8) var(--space-12);

    h1 {
      font-size: var(--fs-h2);
    }
    .count {
      color: var(--text-muted);
      margin-block: var(--space-2) var(--space-6);
    }
  }
</style>
