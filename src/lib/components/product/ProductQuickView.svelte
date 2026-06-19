<script lang="ts">
  import { formatPrice } from "$lib/utils/money";
  import { cart } from "$lib/stores/cart.svelte";
  import { ui } from "$lib/stores/ui.svelte";
  import Modal from "$lib/components/ui/Modal.svelte";
  import Stepper from "$lib/components/ui/Stepper.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import StarRating from "./StarRating.svelte";

  let qty = $state(1);
  let imgError = $state(false);

  const product = $derived(ui.quickView);

  // reset quantity when the product changes
  $effect(() => {
    if (product) {
      qty = 1;
      imgError = false;
    }
  });

  const PAIRING: Record<string, string> = {
    fromages:
      "Sublime sur un plateau avec un filet de miel de Provence - l'accord signature de Marty. 🍯",
    chocolats: "Sublime avec un café corsé pour un moment gourmand. ☕",
    bonbons: "Parfait pour le goûter ou à partager entre amis. 🍬",
    chips:
      "Le compagnon idéal d'un apéro du terroir avec un cidre bien frais. 🥂",
    boissons:
      "Servez bien frais - encore meilleur avec un en-cas salé croustillant. 🧊",
    epicerie:
      "Un petit luxe du quotidien qui relève vos recettes les plus simples. ✨",
    maison: "La routine maison, version premium et sans compromis. 🧼",
  };

  function add() {
    if (!product) return;
    cart.add(product, qty);
    ui.showToast(`${product.name} ajouté au panier`);
    ui.closeQuickView();
    ui.openDrawer("cart");
  }
</script>

<Modal
  open={!!product}
  title={product?.name ?? ""}
  onclose={() => ui.closeQuickView()}
>
  {#if product}
    {@const onPromo =
      !!product.original_price && product.original_price > product.price}
    <div class="quickview">
      <div class="media">
        {#if product.imageUrl && !imgError}
          <img
            src={product.imageUrl}
            alt={product.name}
            onerror={() => (imgError = true)}
          />
        {:else}
          <div class="placeholder" aria-hidden="true">🛒</div>
        {/if}
      </div>
      <div class="detail">
        {#if product.brand}<span class="brand">{product.brand}</span>{/if}
        <StarRating
          rating={product.rating}
          reviewCount={product.review_count}
        />
        <p class="desc">{product.description}</p>

        <div class="stock" class:out={product.stock <= 0}>
          {#if product.stock <= 0}
            Rupture de stock
          {:else if product.stock < 5}
            Plus que {product.stock} en stock !
          {:else}
            En stock
          {/if}
        </div>

        <div class="banner">
          <span class="tag">Astuce du Chef</span>
          <p>{PAIRING[product.category_slug] ?? PAIRING.epicerie}</p>
        </div>

        <div class="buy">
          <span class="price">
            {formatPrice(product.price)}
            {#if onPromo}<s>{formatPrice(product.original_price!)}</s>{/if}
          </span>
          <Stepper bind:value={qty} max={Math.max(1, product.stock)} />
        </div>

        <Button full onclick={add} disabled={product.stock <= 0}>
          {product.stock <= 0 ? "Indisponible" : "Ajouter au panier"}
        </Button>
      </div>
    </div>
  {/if}
</Modal>

<style>
  .quickview {
    display: grid;
    gap: var(--space-6);

    .media {
      background: var(--white);
      border-radius: var(--radius-md);
      aspect-ratio: 1;
      overflow: hidden;

      img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        padding: var(--space-6);
      }
      .placeholder {
        display: grid;
        place-items: center;
        height: 100%;
        font-size: 4rem;
        background: var(--surface-inset);
      }
    }

    .detail {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);

      .brand {
        font-family: var(--font-ui);
        font-weight: 600;
        font-size: var(--fs-xs);
        letter-spacing: 0.5px;
        text-transform: uppercase;
        color: var(--text-muted);
      }
      .desc {
        color: var(--text-muted);
        line-height: 1.6;
      }
      .stock {
        align-self: flex-start;
        padding: var(--space-1) var(--space-3);
        border-radius: var(--radius-pill);
        font-family: var(--font-mono);
        font-size: var(--fs-xs);
        background: color-mix(in srgb, var(--gold) 25%, transparent);
        color: var(--text);

        &.out {
          background: color-mix(in srgb, var(--accent) 18%, transparent);
          color: var(--accent);
        }
      }
      .banner {
        padding: var(--space-3) var(--space-4);
        border-radius: var(--radius-md);
        background: var(--navy-900);
        color: var(--cream-50);

        .tag {
          font-family: var(--font-mono);
          font-size: var(--fs-xs);
          color: var(--gold);
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        p {
          margin-top: var(--space-1);
          font-size: var(--fs-sm);
          line-height: 1.5;
        }
      }
      .buy {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-4);

        .price {
          display: flex;
          align-items: baseline;
          gap: var(--space-2);
          font-family: var(--font-body);
          font-weight: 700;
          font-size: var(--fs-h3);
          color: var(--accent);

          s {
            font-weight: 400;
            font-size: var(--fs-sm);
            color: var(--text-muted);
          }
        }
      }
    }
  }

  @media (min-width: 640px) {
    .quickview {
      grid-template-columns: 1fr 1fr;
      align-items: start;
    }
  }
</style>
