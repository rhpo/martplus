<script lang="ts">
  import type { Product } from "$lib/types";
  import { ui } from "$lib/stores/ui.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import ArrowRight from "$lib/components/icons/ArrowRight.svelte";

  let { heroProduct = null }: { heroProduct?: Product | null } = $props();
  let imgError = $state(false);
</script>

<section class="hero">
  <div class="container grid">
    <div class="copy">
      <span class="eyebrow">SOYEZ LES BIENVENUS!</span>
      <h1>
        Une épicerie fine de terroir, sélectionnée avec <em>exigence</em>
      </h1>
      <p>
        Du <strong>chocolat grand cru</strong> au <strong>comté affiné</strong>,
        du
        <strong>miel de Provence</strong> aux
        <strong>caramels au beurre salé</strong> - MART+ réunit le meilleur de nos
        régions, livré chez vous à Alger.
      </p>
      <div class="ctas">
        <Button href="#rayons" size="lg">
          Faire mes courses
          {#snippet trailing()}<ArrowRight size={20} />{/snippet}
        </Button>
        <button class="ghost" onclick={() => ui.openDrawer("marty")}>
          Demandez conseil à Marty
        </button>
      </div>
      <p class="tagline">
        <span class="dot" aria-hidden="true"></span> MART+ : Ta supérette, partout
        avec toi.
      </p>
    </div>

    <div class="showcase" aria-hidden="true">
      <figure class="polaroid">
        <span class="deal-pill">DUO DU TERROIR</span>
        <div class="photo">
          {#if heroProduct?.imageUrl && !imgError}
            <img
              src={heroProduct.imageUrl}
              alt=""
              onerror={() => (imgError = true)}
            />
          {:else}
            <div class="placeholder">🧀🍯</div>
          {/if}
        </div>
        <span class="marty-deal">Mart'y deal</span>
        <figcaption>
          <span class="label">DUO SIGNATURE</span>
          <span class="name">Comté Réserve &amp; Miel de Provence</span>
          <span class="price"><s>2 490 DA</s></span>
        </figcaption>
      </figure>
    </div>
  </div>
</section>

<style>
  .hero {
    background: var(--navy-900);
    color: var(--on-dark);
    background-image: radial-gradient(var(--dot-grid) 1.5px, transparent 0);
    background-size: 24px 24px;
    padding-block: var(--space-16);
  }
  .grid {
    display: grid;
    gap: var(--space-12);
    align-items: center;
    grid-template-columns: 1fr;
  }

  .copy {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);

    .eyebrow {
      align-self: flex-start;
      padding: var(--space-1) var(--space-4);
      border: 1px solid rgba(255, 255, 255, 0.25);
      border-radius: var(--radius-pill);
      font-family: var(--font-mono);
      font-size: var(--fs-xs);
      letter-spacing: 1px;
      color: var(--gold);
    }
    h1 {
      font-size: var(--fs-h1);
      color: var(--white);

      em {
        font-style: italic;
        color: var(--gold);
      }
    }
    p {
      color: var(--gray-300);
      font-size: var(--fs-lg);
      line-height: 1.6;
      max-width: 52ch;

      strong {
        color: var(--cream-50);
        font-weight: 600;
      }
    }
    .ctas {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-3);
      margin-top: var(--space-2);

      .ghost {
        display: inline-flex;
        align-items: center;
        padding: var(--space-4) var(--space-6);
        border-radius: var(--radius-pill);
        border: 2px solid rgba(255, 255, 255, 0.3);
        color: var(--cream-50);
        font-family: var(--font-ui);
        font-weight: 600;
        transition:
          background var(--dur) var(--ease),
          border-color var(--dur) var(--ease);

        &:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: var(--gold);
        }
      }
    }
    .tagline {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-family: var(--font-mono);
      font-size: var(--fs-sm);
      color: var(--gray-300);

      .dot {
        width: 9px;
        height: 9px;
        border-radius: var(--radius-pill);
        background: var(--green-500);
        box-shadow: 0 0 0 0 var(--green-500);
        animation: blink 1.6s var(--ease) infinite;
      }
    }
  }

  .showcase {
    display: grid;
    place-items: center;

    .polaroid {
      position: relative;
      width: min(360px, 100%);
      background: var(--white);
      border-radius: var(--radius-md);
      padding: var(--space-4);
      box-shadow: var(--shadow-pop);
      transform: rotate(-3deg);
      transition: transform var(--dur-slow) var(--ease);

      &:hover {
        transform: rotate(-1deg);
      }

      .deal-pill {
        position: absolute;
        top: var(--space-3);
        left: var(--space-3);
        z-index: 1;
        padding: var(--space-1) var(--space-3);
        border-radius: var(--radius-pill);
        background: var(--navy-900);
        color: var(--gold);
        font-family: var(--font-mono);
        font-size: 0.6rem;
        letter-spacing: 1px;
      }
      .photo {
        aspect-ratio: 1;
        background: var(--cream-50);
        border-radius: var(--radius-sm);
        overflow: hidden;
        display: grid;
        place-items: center;

        img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          padding: var(--space-4);
        }
        .placeholder {
          font-size: 3.5rem;
        }
      }
      figcaption {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
        padding: var(--space-3) var(--space-1) var(--space-1);
        color: var(--navy-900);

        .label {
          font-family: var(--font-mono);
          font-size: var(--fs-xs);
          color: var(--gray-500);
        }
        .name {
          font-family: var(--font-ui);
          font-weight: 700;
          font-size: var(--fs-lg);
        }
        .price s {
          color: var(--gray-500);
        }
      }
      .marty-deal {
        position: absolute;
        bottom: var(--space-4);
        right: var(--space-4);
        padding: var(--space-2) var(--space-3);
        border-radius: var(--radius-pill);
        background: var(--accent);
        color: var(--accent-text);
        font-family: var(--font-ui);
        font-weight: 700;
        font-size: var(--fs-xs);
        transform: rotate(6deg);
      }
    }
  }

  @keyframes blink {
    0%,
    100% {
      box-shadow: 0 0 0 0 color-mix(in srgb, var(--green-500) 70%, transparent);
    }
    50% {
      box-shadow: 0 0 0 6px color-mix(in srgb, var(--green-500) 0%, transparent);
    }
  }

  @media (min-width: 1024px) {
    .grid {
      grid-template-columns: 1.1fr 0.9fr;
    }
  }
</style>
