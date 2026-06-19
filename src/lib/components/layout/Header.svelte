<script lang="ts">
  import { goto } from "$app/navigation";
  import { cart } from "$lib/stores/cart.svelte";
  import { wishlist } from "$lib/stores/wishlist.svelte";
  import { ui } from "$lib/stores/ui.svelte";
  import ThemeToggle from "./ThemeToggle.svelte";
  import Search from "$lib/components/icons/Search.svelte";
  import Heart from "$lib/components/icons/Heart.svelte";
  import Bag from "$lib/components/icons/Bag.svelte";
  import Chat from "$lib/components/icons/Chat.svelte";
  import Logo from "../Logo/Logo.svelte";

  let query = $state("");

  function submitSearch(e: SubmitEvent) {
    e.preventDefault();
    const q = query.trim();
    goto(q ? `/?q=${encodeURIComponent(q)}` : "/");
  }
</script>

<header class="header">
  <div class="container inner">
    <a class="logo" href="/" aria-label="MART+ accueil">
      <Logo color="white" width="200px" />
      <span class="tag">SUPÉRETTE</span>
    </a>

    <form class="search" role="search" onsubmit={submitSearch}>
      <span class="ico"><Search size={18} /></span>
      <input
        type="search"
        bind:value={query}
        placeholder="Rechercher un produit, une marque…"
        aria-label="Rechercher"
      />
    </form>

    <nav class="actions" aria-label="Actions">
      <button
        class="act marty"
        onclick={() => ui.openDrawer("marty")}
        aria-label="Ouvrir Marty, l'assistant IA"
      >
        <Chat size={22} />
        <span class="ai" aria-hidden="true">AI</span>
      </button>
      <button
        class="act"
        onclick={() => ui.openDrawer("wishlist")}
        aria-label="Ouvrir les favoris"
      >
        <Heart size={22} />
        {#if wishlist.count > 0}<span class="count gold">{wishlist.count}</span
          >{/if}
      </button>
      <button
        class="act"
        onclick={() => ui.openDrawer("cart")}
        aria-label="Ouvrir le panier"
      >
        <Bag size={22} />
        {#if cart.count > 0}<span class="count">{cart.count}</span>{/if}
      </button>
      <ThemeToggle />
    </nav>
  </div>
</header>

<style>
  .header {
    position: sticky;
    top: 0;
    z-index: var(--z-header);
    background: var(--header-bg);
    color: var(--header-text);
  }
  .inner {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    padding-block: var(--space-3);
  }

  .logo {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    flex-shrink: 0;

    .tag {
      font-family: var(--font-mono);
      font-size: var(--fs-xs);
      color: var(--gray-300);
      letter-spacing: 1px;
    }
  }

  .search {
    flex: 1;
    display: flex;
    align-items: center;
    gap: var(--space-2);
    max-width: 520px;
    margin-inline: auto;
    padding: var(--space-2) var(--space-4);
    border-radius: var(--radius-pill);
    background: var(--surface-raised);
    border: 2px solid transparent;
    transition: box-shadow var(--dur) var(--ease);

    .ico {
      color: var(--text-muted);
      display: inline-flex;
    }
    input {
      flex: 1;
      min-width: 0;
      background: none;
      border: none;
      color: var(--text);
      font-size: var(--fs-sm);
      &:focus {
        outline: none;
      }
      &::placeholder {
        color: var(--text-muted);
      }
    }
    &:focus-within {
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 45%, transparent);
    }
  }

  .actions {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    flex-shrink: 0;

    .act {
      position: relative;
      display: grid;
      place-items: center;
      width: 40px;
      height: 40px;
      border-radius: var(--radius-pill);
      color: var(--header-text);
      transition: background var(--dur) var(--ease);

      &:hover {
        background: rgba(255, 255, 255, 0.12);
      }

      .count {
        position: absolute;
        top: -2px;
        right: -2px;
        min-width: 18px;
        height: 18px;
        padding: 0 4px;
        display: grid;
        place-items: center;
        border-radius: var(--radius-pill);
        background: var(--accent);
        color: var(--accent-text);
        font-family: var(--font-mono);
        font-size: 0.65rem;
        font-weight: 500;

        &.gold {
          background: var(--gold);
          color: var(--navy-900);
        }
      }
      .ai {
        position: absolute;
        top: -4px;
        right: -6px;
        padding: 1px 4px;
        border-radius: var(--radius-pill);
        background: var(--gold);
        color: var(--navy-900);
        font-family: var(--font-mono);
        font-size: 0.6rem;
        font-weight: 700;
        animation: pulse-ai 1.8s var(--ease) infinite;
      }
    }
  }

  @keyframes pulse-ai {
    0%,
    100% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.12);
      opacity: 0.82;
    }
  }

  @media (max-width: 768px) {
    .logo .tag {
      display: none;
    }
    .search {
      order: 3;
      flex-basis: 100%;
      max-width: none;
      margin: 0;
    }
    .inner {
      flex-wrap: wrap;
    }
  }
</style>
