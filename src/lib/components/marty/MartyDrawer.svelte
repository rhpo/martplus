<script lang="ts">
  import type { ChatMessage, Product } from "$lib/types";
  import { formatPrice } from "$lib/utils/money";
  import { cart } from "$lib/stores/cart.svelte";
  import { ui } from "$lib/stores/ui.svelte";
  import Drawer from "$lib/components/ui/Drawer.svelte";
  import ArrowRight from "$lib/components/icons/ArrowRight.svelte";

  const SUGGESTIONS = [
    "Idée apéro du terroir",
    "Que cuisiner avec des pâtes ?",
    "Une idée de dessert gourmand ?",
  ];

  let messages = $state<ChatMessage[]>([
    {
      role: "marty",
      text: "Salut ! Moi c'est Marty 👋 Votre complice gourmand chez MART+. Dites-moi une envie et je vous trouve les bons produits du terroir.",
    },
  ]);
  let input = $state("");
  let loading = $state(false);

  async function send(text: string) {
    const message = text.trim();
    if (!message || loading) return;
    messages.push({ role: "user", text: message });
    input = "";
    loading = true;
    try {
      const res = await fetch("/api/marty", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = (await res.json()) as { reply: string; products: Product[] };
      messages.push({
        role: "marty",
        text: data.reply,
        suggestions: data.products,
      });
    } catch {
      messages.push({
        role: "marty",
        text: "Oups, je n'ai pas pu réfléchir 😅 Réessaie dans un instant.",
      });
    } finally {
      loading = false;
    }
  }

  function addSuggestion(p: Product) {
    cart.add(p, 1);
    ui.showToast(`${p.name} ajouté au panier`);
  }
</script>

<Drawer
  open={ui.drawer === "marty"}
  title="Marty · Assistant IA"
  onclose={() => ui.closeDrawer()}
>
  <div class="chat">
    <div class="thread">
      {#each messages as msg, i (i)}
        <div class="msg {msg.role}">
          <p>{msg.text}</p>
          {#if msg.suggestions && msg.suggestions.length > 0}
            <ul class="suggestions">
              {#each msg.suggestions as p (p.id)}
                <li>
                  {#if p.imageUrl}<img
                      src={p.imageUrl}
                      alt={p.name}
                    />{:else}<div class="ph">🛒</div>{/if}
                  <div class="meta">
                    <span class="name">{p.name}</span>
                    <span class="price">{formatPrice(p.price)}</span>
                  </div>
                  <button
                    onclick={() => addSuggestion(p)}
                    disabled={p.stock <= 0}
                    aria-label="Ajouter {p.name}"
                  >
                    +
                  </button>
                </li>
              {/each}
            </ul>
          {/if}
        </div>
      {/each}
      {#if loading}<div class="msg marty">
          <p class="typing">Marty réfléchit…</p>
        </div>{/if}
    </div>

    <div class="pills">
      {#each SUGGESTIONS as s (s)}
        <button onclick={() => send(s)}>{s}</button>
      {/each}
    </div>
  </div>

  {#snippet footer()}
    <form
      class="compose"
      onsubmit={(e) => {
        e.preventDefault();
        send(input);
      }}
    >
      <input
        bind:value={input}
        placeholder="Pose ta question à Marty…"
        aria-label="Message"
      />
      <button
        type="submit"
        disabled={loading || !input.trim()}
        aria-label="Envoyer"
      >
        <ArrowRight size={20} />
      </button>
    </form>
  {/snippet}
</Drawer>

<style>
  .chat {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    min-height: 100%;
  }
  .thread {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);

    .msg {
      max-width: 90%;
      padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-md);
      font-size: var(--fs-sm);
      line-height: 1.5;

      &.marty {
        align-self: flex-start;
        background: var(--surface-inset);
        color: var(--text);
        border-bottom-left-radius: var(--space-1);
      }
      &.user {
        align-self: flex-end;
        background: var(--accent);
        color: var(--accent-text);
        border-bottom-right-radius: var(--space-1);
      }
      .typing {
        color: var(--text-muted);
        font-style: italic;
      }
    }

    .suggestions {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      margin-top: var(--space-3);

      li {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        background: var(--surface-raised);
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        padding: var(--space-2);

        img,
        .ph {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-sm);
          background: var(--white);
          object-fit: contain;
        }
        .ph {
          display: grid;
          place-items: center;
          background: var(--surface-inset);
        }
        .meta {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;

          .name {
            font-weight: 600;
            font-size: var(--fs-xs);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .price {
            font-family: var(--font-mono);
            font-size: var(--fs-xs);
            color: var(--accent);
          }
        }
        button {
          width: 30px;
          height: 30px;
          border-radius: var(--radius-pill);
          background: var(--navy-800);
          color: var(--white);
          font-weight: 700;
          &:hover:not(:disabled) {
            background: var(--accent);
          }
          &:disabled {
            opacity: 0.4;
          }
        }
      }
    }
  }
  .pills {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);

    button {
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-pill);
      border: 1px solid var(--border);
      background: var(--surface-raised);
      color: var(--text);
      font-size: var(--fs-xs);
      text-align: left;
      &:hover {
        border-color: var(--accent);
        color: var(--accent);
      }
    }
  }
  .compose {
    display: flex;
    gap: var(--space-2);

    input {
      flex: 1;
      min-width: 0;
      padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-pill);
      border: 1.5px solid var(--border);
      background: var(--surface-raised);
      color: var(--text);
      font-size: var(--fs-sm);
      &:focus-visible {
        outline: none;
        border-color: var(--accent);
      }
    }
    button {
      display: grid;
      place-items: center;
      width: 44px;
      height: 44px;
      border-radius: var(--radius-pill);
      background: var(--accent);
      color: var(--accent-text);
      flex-shrink: 0;
      &:disabled {
        opacity: 0.4;
      }
    }
  }
</style>
