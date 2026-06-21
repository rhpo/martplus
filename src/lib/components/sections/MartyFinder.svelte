<script lang="ts">
  import { fly, fade } from "svelte/transition";
  import type { Product } from "$lib/types";
  import ProductGrid from "$lib/components/product/ProductGrid.svelte";
  import Chat from "$lib/components/icons/Chat.svelte";
  import ArrowRight from "$lib/components/icons/ArrowRight.svelte";

  const EXAMPLES = [
    "Un apéro chic pour 6 ami·es 🧀",
    "Une idée de dessert gourmand 🍫",
    "Mon petit-déj de la semaine ☕",
    "Un cadeau gourmand à offrir 🎁",
  ];

  let query = $state("");
  let loading = $state(false);
  let reply = $state("");
  let products = $state<Product[]>([]);
  let asked = $state(false);
  let ta = $state<HTMLTextAreaElement | null>(null);

  function grow() {
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 180) + "px";
  }

  async function ask(text = query) {
    const message = text.trim();
    if (!message || loading) return;
    query = message;
    loading = true;
    asked = true;
    reply = "";
    try {
      const res = await fetch("/api/marty", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = (await res.json()) as { reply: string; products: Product[] };
      reply = data.reply;
      products = data.products ?? [];
    } catch {
      reply = "Oups, je n'ai pas pu répondre 😅 Réessayez dans un instant.";
      products = [];
    } finally {
      loading = false;
    }
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      ask();
    }
  }
</script>

<section class="finder">
  <div class="container">
    <div class="panel">
      <div class="glow" aria-hidden="true"></div>

      <div class="intro">
        <!-- <div class="avatar" aria-hidden="true">
					<span class="ring"></span>
					<Chat size={26} />
					<span class="spark">✨</span>
				</div> -->
        <div class="hello">
          <span class="eyebrow">MARTY · VOTRE COMPLICE GOURMAND</span>
          <h2>Dites-moi une envie, je trouve le <em>reste</em>.</h2>
          <p>
            Un repas, un apéro, un cadeau… décrivez, et je compose votre panier
            idéal.
          </p>
        </div>
      </div>

      <form
        class="composer"
        class:busy={loading}
        onsubmit={(e) => {
          e.preventDefault();
          ask();
        }}
      >
        <textarea
          bind:this={ta}
          bind:value={query}
          oninput={grow}
          onkeydown={onKeydown}
          rows="1"
          placeholder="Ex : je reçois des amis ce soir, plutôt fromages, chips et une boisson fraîche…"
          aria-label="Décrivez votre envie à Marty"
        ></textarea>
        <button
          type="submit"
          class="send"
          disabled={loading || !query.trim()}
          aria-label="Envoyer"
        >
          <ArrowRight size={22} />
        </button>
      </form>

      <div class="chips">
        <span class="try">Essayez&nbsp;:</span>
        {#each EXAMPLES as ex (ex)}
          <button type="button" onclick={() => ask(ex)} disabled={loading}
            >{ex}</button
          >
        {/each}
      </div>

      {#if asked}
        <div class="answer" transition:fly={{ y: 14, duration: 260 }}>
          <div class="from">
            <span class="dot" aria-hidden="true"></span> Marty
          </div>
          {#if loading}
            <div class="typing" aria-label="Marty réfléchit">
              <span></span><span></span><span></span>
            </div>
          {:else}
            <p class="reply">{reply}</p>
          {/if}
        </div>

        {#if !loading}
          <div class="results" transition:fade={{ duration: 200 }}>
            <ProductGrid
              {products}
              empty="Je n'ai rien trouvé pour cette envie — reformulez ?"
            />
          </div>
        {/if}
      {/if}
    </div>
  </div>
</section>

<style>
  .finder {
    padding-block: var(--space-12);

    .panel {
      position: relative;
      overflow: hidden;
      background: linear-gradient(
        160deg,
        var(--navy-800),
        var(--navy-900) 60%,
        var(--black)
      );
      color: var(--on-dark);
      border-radius: var(--radius-lg);
      padding: var(--space-12) var(--space-8);
      background-image: linear-gradient(
          160deg,
          var(--navy-800),
          var(--navy-900) 60%,
          var(--black)
        ),
        radial-gradient(var(--dot-grid) 1.4px, transparent 0);
      background-size:
        cover,
        22px 22px;
      box-shadow: var(--shadow-pop);
    }

    /* coral→gold glow drifting behind the content */
    .glow {
      position: absolute;
      top: -30%;
      right: -10%;
      width: 60%;
      height: 120%;
      background: radial-gradient(
        circle,
        color-mix(in srgb, var(--accent) 35%, transparent),
        transparent 60%
      );
      filter: blur(40px);
      pointer-events: none;
      animation: drift 9s var(--ease) infinite alternate;
    }

    .intro {
      position: relative;
      display: flex;
      align-items: center;
      gap: var(--space-4);
      max-width: 62ch;

      .avatar {
        position: relative;
        display: grid;
        place-items: center;
        width: 60px;
        height: 60px;
        flex-shrink: 0;
        border-radius: var(--radius-pill);
        background: var(--navy-900);
        color: var(--gold);
        box-shadow: inset 0 0 0 1px
          color-mix(in srgb, var(--gold) 40%, transparent);

        .ring {
          position: absolute;
          inset: -4px;
          border-radius: var(--radius-pill);
          background: conic-gradient(var(--gold), var(--accent), var(--gold));
          z-index: -1;
          animation: spin 5s linear infinite;
        }
        .spark {
          position: absolute;
          top: -6px;
          right: -6px;
          font-size: 0.85rem;
          animation: twinkle 2s var(--ease) infinite;
        }
      }

      .eyebrow {
        font-family: var(--font-mono);
        font-size: var(--fs-xs);
        letter-spacing: 1.5px;
        color: var(--gold);
      }
      h2 {
        font-size: var(--fs-h2);
        color: var(--white);
        margin-top: var(--space-1);
        line-height: 1.1;

        em {
          font-style: italic;
          color: var(--gold);
        }
      }
      p {
        color: var(--gray-300);
        margin-top: var(--space-2);
        line-height: 1.6;
      }
    }

    .composer {
      position: relative;
      display: flex;
      align-items: flex-end;
      gap: var(--space-2);
      margin-top: var(--space-8);
      padding: var(--space-2) var(--space-2) var(--space-2) var(--space-4);
      border-radius: var(--radius-lg);
      background: var(--surface-raised);
      border: 1.5px solid transparent;
      transition:
        border-color var(--dur) var(--ease),
        box-shadow var(--dur) var(--ease);

      &:focus-within {
        border-color: var(--accent);
        box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 30%, transparent);
      }
      &.busy {
        opacity: 0.85;
      }

      textarea {
        flex: 1;
        min-width: 0;
        resize: none;
        border: none;
        background: none;
        color: var(--text);
        font: var(--fs-lg) / 1.5 var(--font-body);
        padding: var(--space-3) 0;
        max-height: 180px;

        &::placeholder {
          color: var(--text-muted);
        }
        &:focus {
          outline: none;
        }
      }
      .send {
        display: grid;
        place-items: center;
        width: 50px;
        height: 50px;
        flex-shrink: 0;
        border-radius: var(--radius-pill);
        background: var(--accent);
        color: var(--accent-text);
        transition:
          transform var(--dur-fast) var(--ease),
          opacity var(--dur) var(--ease);

        &:hover:not(:disabled) {
          transform: scale(1.08);
        }
        &:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
      }
    }

    .chips {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--space-2);
      margin-top: var(--space-4);

      .try {
        font-family: var(--font-mono);
        font-size: var(--fs-xs);
        color: var(--gray-300);
      }
      button {
        padding: var(--space-2) var(--space-4);
        border-radius: var(--radius-pill);
        border: 1px solid rgba(255, 255, 255, 0.2);
        background: rgba(255, 255, 255, 0.05);
        color: var(--cream-50);
        font-size: var(--fs-sm);
        transition:
          background var(--dur) var(--ease),
          border-color var(--dur) var(--ease),
          transform var(--dur-fast) var(--ease);

        &:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.12);
          border-color: var(--gold);
          transform: translateY(-1px);
        }
        &:disabled {
          opacity: 0.5;
        }
      }
    }

    .answer {
      position: relative;
      margin-top: var(--space-8);

      .from {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        font-family: var(--font-mono);
        font-size: var(--fs-xs);
        color: var(--gold);
        margin-bottom: var(--space-2);

        .dot {
          width: 8px;
          height: 8px;
          border-radius: var(--radius-pill);
          background: var(--green-500);
        }
      }
      .reply {
        background: var(--surface-raised);
        color: var(--text);
        border-radius: var(--radius-md);
        border-top-left-radius: var(--space-1);
        padding: var(--space-4) var(--space-6);
        line-height: 1.6;
        max-width: 70ch;
      }
      .typing {
        display: inline-flex;
        gap: 5px;
        background: var(--surface-raised);
        padding: var(--space-4) var(--space-6);
        border-radius: var(--radius-md);
        border-top-left-radius: var(--space-1);

        span {
          width: 8px;
          height: 8px;
          border-radius: var(--radius-pill);
          background: var(--text-muted);
          animation: bounce 1.2s var(--ease) infinite;
        }
        span:nth-child(2) {
          animation-delay: 0.15s;
        }
        span:nth-child(3) {
          animation-delay: 0.3s;
        }
      }
    }

    .results {
      margin-top: var(--space-6);
    }
  }

  @keyframes drift {
    0% {
      transform: translate(0, 0) scale(1);
    }
    100% {
      transform: translate(-12%, 8%) scale(1.15);
    }
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  @keyframes twinkle {
    0%,
    100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.4;
      transform: scale(0.8);
    }
  }
  @keyframes bounce {
    0%,
    100% {
      transform: translateY(0);
      opacity: 0.5;
    }
    50% {
      transform: translateY(-5px);
      opacity: 1;
    }
  }

  @media (max-width: 600px) {
    .finder .panel {
      padding: var(--space-8) var(--space-4);
    }
    .finder .intro {
      flex-direction: column;
      text-align: center;
    }
  }
</style>
