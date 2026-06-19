<script lang="ts">
  import { PROMO_CODE } from "$lib/config";
  import type { Category } from "$lib/types";
  import Logo from "../Logo/Logo.svelte";

  let { categories = [] }: { categories?: Category[] } = $props();
  const year = new Date().getFullYear();
</script>

<footer class="footer">
  <div class="container grid">
    <div class="brand">
      <span class="logo">
        <Logo color="var(--cream-50)" width="65%" />
      </span>
      <p class="tagline">● Ta supérette de quartier, partout avec toi.</p>
      <p class="blurb">
        L'épicerie fine de terroir, sélectionnée avec exigence. Fromages
        affinés, chocolats grands crus, miel de Provence et confiseries de nos
        régions - livrés chez vous à Alger.
      </p>
    </div>

    <nav aria-label="Catégories">
      <h3>Rayons</h3>
      <ul>
        {#each categories as cat (cat.slug)}
          <li><a href="/categorie/{cat.slug}">{cat.label}</a></li>
        {/each}
      </ul>
    </nav>

    <div class="info">
      <h3>Infos</h3>
      <ul>
        <li>Livraison dès 300 DA · offerte dès 15 000 DA</li>
        <li>Code promo : <strong>{PROMO_CODE}</strong> (-10%)</li>
        <li>Paiement à la livraison · CIB · Edahabia</li>
      </ul>
    </div>
  </div>
  <div class="container bottom">
    <span>© {year} MART+ - Tous droits réservés.</span>
    <span class="mono">DZD · Alger · Épicerie fine de terroir</span>
  </div>
</footer>

<style>
  .footer {
    margin-top: var(--space-16);
    background: var(--navy-900);
    color: var(--cream-50);
    padding-block: var(--space-12) var(--space-6);

    .grid {
      display: grid;
      gap: var(--space-8);
      grid-template-columns: 1fr;
    }

    h3 {
      font-family: var(--font-ui);
      font-weight: 600;
      font-size: var(--fs-md);
      margin-bottom: var(--space-3);
      color: var(--gold);
    }
    ul {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      font-size: var(--fs-sm);
      color: var(--gray-300);

      a:hover {
        color: var(--cream-50);
      }
      strong {
        color: var(--gold);
        font-family: var(--font-mono);
      }
    }

    .brand {
      .logo {
        font-family: var(--font-serif);
        font-weight: 700;
        font-size: 1.8rem;
        text-align: center;
      }
      .tagline {
        font-size: var(--fs-sm);
        color: var(--gold);
        margin-top: var(--space-2);
      }
      .blurb {
        margin-top: var(--space-3);
        color: var(--gray-300);
        font-size: var(--fs-sm);
        line-height: 1.6;
        max-width: 42ch;
      }
    }

    .bottom {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: var(--space-2);
      margin-top: var(--space-12);
      padding-top: var(--space-6);
      border-top: 1px solid rgba(255, 255, 255, 0.12);
      font-size: var(--fs-xs);
      color: var(--gray-500);

      .mono {
        font-family: var(--font-mono);
      }
    }
  }

  @media (min-width: 768px) {
    .footer .grid {
      grid-template-columns: 2fr 1fr 1fr;
    }
  }
</style>
