<script lang="ts">
  import type { Product } from "$lib/types";
  import { formatPrice } from "$lib/utils/money";
  import { cart } from "$lib/stores/cart.svelte";
  import { ui } from "$lib/stores/ui.svelte";
  import Button from "$lib/components/ui/Button.svelte";

  interface ResolvedDuo {
    id: string;
    title: string;
    tagline: string;
    emoji: string;
    products: Product[];
  }

  let { duos }: { duos: ResolvedDuo[] } = $props();

  function addDuo(duo: ResolvedDuo) {
    const available = duo.products.filter((p) => p.stock > 0);
    if (available.length === 0) return;
    cart.addCombo(available);

    ui.showToast(`${duo.title} ajouté au panier`);
    ui.openDrawer("cart");
  }

  function total(duo: ResolvedDuo): number {
    return duo.products.reduce((s, p) => s + p.price, 0);
  }
</script>

<section class="duos container">
  <header class="head">
    <span class="eyebrow">NOS SIGNATURES</span>
    <h2>Nos Duos du Terroir</h2>
    <p>
      Des accords de produits français pensés par Marty - en un clic dans votre
      panier.
    </p>
  </header>

  <ul class="bento">
    {#each duos as duo (duo.id)}
      <li class="duo">
        <div class="top">
          <span class="emoji" aria-hidden="true">{duo.emoji}</span>
          <h3>{duo.title}</h3>
          <p class="tagline">{duo.tagline}</p>
        </div>
        <ul class="items">
          {#each duo.products as p (p.id)}
            <li><span class="dot" aria-hidden="true"></span>{p.name}</li>
          {/each}
        </ul>
        <div class="foot">
          <span class="price">{formatPrice(total(duo))}</span>
          <Button
            size="sm"
            onclick={() => addDuo(duo)}
            disabled={duo.products.every((p) => p.stock <= 0)}
          >
            Ajouter le Duo
          </Button>
        </div>
      </li>
    {/each}
  </ul>
</section>

<style>
  .duos {
    padding-block: var(--space-16);

    .head {
      text-align: center;
      margin-bottom: var(--space-8);

      .eyebrow {
        font-family: var(--font-mono);
        font-size: var(--fs-xs);
        letter-spacing: 1px;
        color: var(--accent);
      }
      h2 {
        font-size: var(--fs-h2);
        margin-block: var(--space-2);
      }
      p {
        color: var(--text-muted);
      }
    }

    .bento {
      display: grid;
      gap: var(--space-4);
      grid-template-columns: 1fr;
    }

    .duo {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
      padding: var(--space-6);
      border-radius: var(--radius-lg);
      background: var(--surface-raised);
      border: 1px solid var(--border);
      transition:
        transform var(--dur) var(--ease),
        box-shadow var(--dur) var(--ease);

      &:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow-card);
      }

      .top {
        .emoji {
          font-size: 2rem;
        }
        h3 {
          font-family: var(--font-ui);
          font-weight: 700;
          font-size: var(--fs-lg);
          margin-top: var(--space-2);
        }
        .tagline {
          color: var(--text-muted);
          font-size: var(--fs-sm);
          margin-top: var(--space-1);
        }
      }
      .items {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
        font-size: var(--fs-sm);

        li {
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }
        .dot {
          width: 6px;
          height: 6px;
          border-radius: var(--radius-pill);
          background: var(--gold);
          flex-shrink: 0;
        }
      }
      .foot {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-3);
        margin-top: auto;

        .price {
          font-family: var(--font-body);
          font-weight: 700;
          font-size: var(--fs-lg);
          color: var(--accent);
        }
      }
    }
  }

  @media (min-width: 768px) {
    .duos .bento {
      grid-template-columns: repeat(3, 1fr);
    }
  }
</style>
