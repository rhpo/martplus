<script lang="ts">
  import { enhance } from "$app/forms";
  import { formatPrice } from "$lib/utils/money";
  import type { Product } from "$lib/types";

  let { data, form } = $props();

  let filter = $state("");
  let showCreate = $state(false);
  let editingId = $state<number | null>(null);

  const filtered = $derived(
    (filter.trim()
      ? data.products.filter((p) =>
          (p.name + " " + (p.brand ?? "") + " " + p.slug)
            .toLowerCase()
            .includes(filter.trim().toLowerCase()),
        )
      : data.products
    ).slice(0, 60),
  );

  const BADGES = ["", "BESTSELLER", "PROMO", "NOUVEAU"];
</script>

<div class="head">
  <h1>Produits <span class="count">({data.products.length})</span></h1>
  <button class="primary" onclick={() => (showCreate = !showCreate)}>
    {showCreate ? "Annuler" : "+ Nouveau produit"}
  </button>
</div>

{#if form?.message}
  <p class="flash" class:ok={form.success} role="status">{form.message}</p>
{/if}

{#snippet productForm(action: string, p: Product | null)}
  <form
    method="POST"
    action="?/{action}"
    enctype="multipart/form-data"
    use:enhance={() =>
      async ({ update }) => {
        await update();
        if (action === "update") editingId = null;
        if (action === "create") showCreate = false;
      }}
  >
    {#if p}<input type="hidden" name="id" value={p.id} />{/if}
    <input type="hidden" name="current_image" value={p?.image ?? ""} />
    <div class="form-grid">
      <label>Nom<input name="name" value={p?.name ?? ""} required /></label>
      <label
        >Slug<input
          name="slug"
          value={p?.slug ?? ""}
          placeholder="auto"
        /></label
      >
      <label>Marque<input name="brand" value={p?.brand ?? ""} /></label>
      <label
        >Catégorie
        <select name="category_slug">
          {#each data.categories as c (c.slug)}
            <option value={c.slug} selected={p?.category_slug === c.slug}
              >{c.label}</option
            >
          {/each}
        </select>
      </label>
      <label
        >Prix (DZD)<input
          name="price"
          type="number"
          step="1"
          value={p?.price ?? ""}
          required
        /></label
      >
      <label
        >Prix barré<input
          name="original_price"
          type="number"
          step="1"
          value={p?.original_price ?? ""}
        /></label
      >
      <label
        >Note<input
          name="rating"
          type="number"
          step="0.1"
          max="5"
          value={p?.rating ?? 4.7}
        /></label
      >
      <label
        >Avis<input
          name="review_count"
          type="number"
          value={p?.review_count ?? 0}
        /></label
      >
      <label
        >Stock<input name="stock" type="number" value={p?.stock ?? 0} /></label
      >
      <label
        >Badge
        <select name="badge">
          {#each BADGES as b (b)}
            <option value={b} selected={(p?.badge ?? "") === b}
              >{b || "-"}</option
            >
          {/each}
        </select>
      </label>
      <label
        >Flash réservé %<input
          name="flash_reserved_pct"
          type="number"
          value={p?.flash_reserved_pct ?? 0}
        /></label
      >
      <label class="full"
        >Description<textarea name="description" rows="2"
          >{p?.description ?? ""}</textarea
        ></label
      >
      <label class="check"
        ><input type="checkbox" name="is_flash" checked={p?.is_flash} /> Flash Deal</label
      >
      <label class="full"
        >Image (upload S3)<input
          name="image"
          type="file"
          accept="image/*"
        /></label
      >
    </div>
    <button type="submit" class="primary"
      >{p ? "Enregistrer" : "Créer le produit"}</button
    >
  </form>
{/snippet}

{#if showCreate}
  <section class="panel">
    <h2>Nouveau produit</h2>
    {@render productForm("create", null)}
  </section>
{/if}

<div class="filter">
  <input
    bind:value={filter}
    placeholder="Filtrer par nom, marque, slug…"
    aria-label="Filtrer"
  />
  <span>{filtered.length} affiché(s)</span>
</div>

<div class="table-wrap">
  <table>
    <thead>
      <tr
        ><th>ID</th><th>Produit</th><th>Cat.</th><th>Prix</th><th>Stock</th><th
        ></th></tr
      >
    </thead>
    <tbody>
      {#each filtered as p (p.id)}
        <tr>
          <td class="mono">{p.id}</td>
          <td>
            <div class="prod">
              {#if p.imageUrl}<img src={p.imageUrl} alt="" />{:else}<span
                  class="ph">🛒</span
                >{/if}
              <span>{p.name}</span>
            </div>
          </td>
          <td class="mono">{p.category_slug}</td>
          <td class="num">{formatPrice(p.price)}</td>
          <td>
            <div class="stock">
              <form method="POST" action="?/adjustStock" use:enhance>
                <input type="hidden" name="id" value={p.id} />
                <input type="hidden" name="delta" value="-1" />
                <button type="submit" disabled={p.stock <= 0} aria-label="-1"
                  >−</button
                >
              </form>
              <span class:zero={p.stock === 0}>{p.stock}</span>
              <form method="POST" action="?/adjustStock" use:enhance>
                <input type="hidden" name="id" value={p.id} />
                <input type="hidden" name="delta" value="1" />
                <button type="submit" aria-label="+1">+</button>
              </form>
            </div>
          </td>
          <td class="actions">
            <button
              class="link"
              onclick={() =>
                editingId === p.id ? (editingId = null) : (editingId = p.id)}
            >
              {editingId === p.id ? "Fermer" : "Modifier"}
            </button>
            <form
              method="POST"
              action="?/delete"
              use:enhance
              onsubmit={(e) => {
                if (!confirm(`Supprimer « ${p.name} » ?`)) e.preventDefault();
              }}
            >
              <input type="hidden" name="id" value={p.id} />
              <button type="submit" class="link danger">Supprimer</button>
            </form>
          </td>
        </tr>
        {#if editingId === p.id}
          <tr class="edit-row">
            <td colspan="6">
              <div class="panel inline">{@render productForm("update", p)}</div>
            </td>
          </tr>
        {/if}
      {/each}
    </tbody>
  </table>
</div>

<style>
  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    margin-bottom: var(--space-6);

    h1 {
      font-size: var(--fs-h2);
      .count {
        color: var(--text-muted);
        font-size: var(--fs-md);
      }
    }
  }
  .primary {
    padding: var(--space-2) var(--space-5);
    border-radius: var(--radius-pill);
    background: var(--accent);
    color: var(--accent-text);
    font-family: var(--font-ui);
    font-weight: 600;
  }
  .flash {
    padding: var(--space-3) var(--space-4);
    border-radius: var(--radius-md);
    margin-bottom: var(--space-4);
    background: color-mix(in srgb, var(--accent) 14%, transparent);
    color: var(--accent);
    font-weight: 600;

    &.ok {
      background: color-mix(in srgb, var(--gold) 25%, transparent);
      color: var(--text);
    }
  }
  .panel {
    padding: var(--space-6);
    border-radius: var(--radius-lg);
    background: var(--surface-raised);
    border: 1px solid var(--border);
    margin-bottom: var(--space-6);

    &.inline {
      margin: 0;
      background: var(--surface);
    }
    h2 {
      font-size: var(--fs-h3);
      margin-bottom: var(--space-4);
    }
  }
  .form-grid {
    display: grid;
    gap: var(--space-3);
    grid-template-columns: repeat(2, 1fr);
    margin-bottom: var(--space-4);

    label {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
      font-size: var(--fs-xs);
      font-weight: 600;

      &.full {
        grid-column: 1 / -1;
      }
      &.check {
        flex-direction: row;
        align-items: center;
        gap: var(--space-2);
      }
      input:not([type="checkbox"]),
      select,
      textarea {
        padding: var(--space-2) var(--space-3);
        border-radius: var(--radius-sm);
        border: 1px solid var(--border);
        background: var(--surface);
        color: var(--text);
        font-weight: 400;
      }
    }
  }
  .filter {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    margin-bottom: var(--space-4);

    input {
      flex: 1;
      padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-md);
      border: 1px solid var(--border);
      background: var(--surface-raised);
      color: var(--text);
    }
    span {
      color: var(--text-muted);
      font-size: var(--fs-sm);
      white-space: nowrap;
    }
  }
  .table-wrap {
    overflow-x: auto;
    border-radius: var(--radius-lg);
    border: 1px solid var(--border);
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--fs-sm);
    background: var(--surface-raised);

    th,
    td {
      padding: var(--space-3) var(--space-4);
      text-align: left;
      border-bottom: 1px solid var(--border);
    }
    th {
      font-family: var(--font-ui);
      font-weight: 600;
      font-size: var(--fs-xs);
      text-transform: uppercase;
      color: var(--text-muted);
    }
    .mono {
      font-family: var(--font-mono);
    }
    .num {
      font-weight: 700;
      white-space: nowrap;
    }
    .prod {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      min-width: 220px;

      img,
      .ph {
        width: 36px;
        height: 36px;
        border-radius: var(--radius-sm);
        background: var(--white);
        object-fit: contain;
        display: grid;
        place-items: center;
      }
    }
    .stock {
      display: flex;
      align-items: center;
      gap: var(--space-2);

      button {
        width: 26px;
        height: 26px;
        border-radius: var(--radius-pill);
        background: var(--surface-inset);
        border: 1px solid var(--border);
        font-weight: 700;
        &:hover:not(:disabled) {
          background: var(--accent);
          color: var(--accent-text);
        }
        &:disabled {
          opacity: 0.4;
        }
      }
      span.zero {
        color: var(--accent);
        font-weight: 700;
      }
    }
    .actions {
      display: flex;
      gap: var(--space-3);
      align-items: center;
      white-space: nowrap;

      .link {
        color: var(--accent);
        font-weight: 600;
        font-size: var(--fs-xs);
        &.danger {
          color: var(--text-muted);
          &:hover {
            color: var(--accent);
          }
        }
      }
    }
  }
  .edit-row td {
    background: var(--surface);
  }

  @media (max-width: 640px) {
    .form-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
