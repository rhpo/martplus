<script lang="ts">
  import { enhance } from "$app/forms";
  import { goto } from "$app/navigation";
  import { PAYMENT_LABELS } from "$lib/config";
  import type { PaymentMethod } from "$lib/types";
  import { formatPrice } from "$lib/utils/money";
  import { computeDeliveryFee } from "$lib/utils/geo";
  import { cart } from "$lib/stores/cart.svelte";
  import { coupon } from "$lib/stores/coupon.svelte";
  import Field from "$lib/components/ui/Field.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import LocationPicker from "./LocationPicker.svelte";

  let { formError = "" }: { formError?: string } = $props();

  let step = $state(1);

  // step 1
  let name = $state("");
  let phone = $state("");
  let address = $state("");
  let email = $state("");
  let marketing = $state(false);
  let lat = $state<number | null>(null);
  let lng = $state<number | null>(null);
  let distanceKm = $state<number | null>(null);

  // step 2
  let payment = $state<PaymentMethod>("cod");

  let submitting = $state(false);
  let errors = $state<Record<string, string>>({});

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const discount = $derived(coupon.discountOn(cart.subtotal));
  const afterDiscount = $derived(cart.subtotal - discount);
  const deliveryFee = $derived(
    distanceKm != null ? computeDeliveryFee(afterDiscount, distanceKm) : null,
  );
  const total = $derived(afterDiscount + (deliveryFee ?? 0));

  const itemsJson = $derived(
    JSON.stringify(
      cart.items.map((it) => ({
        productId: it.productId,
        quantity: it.quantity,
      })),
    ),
  );

  function validateStep1(): boolean {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Le nom complet est requis.";
    const cleaned = phone.replace(/[\s.\-+()]/g, "");
    if (cleaned.length < 8 || !/^\d+$/.test(cleaned))
      e.phone = "Numéro de téléphone invalide.";
    if (!address.trim()) e.address = "L'adresse est requise.";
    if (email.trim() && !EMAIL_RE.test(email.trim()))
      e.email = "Adresse e-mail invalide.";
    if (lat == null || lng == null)
      e.pin = "Veuillez placer le repère sur la carte.";
    errors = e;
    return Object.keys(e).length === 0;
  }

  function next() {
    if (step === 1 && !validateStep1()) return;
    step = Math.min(3, step + 1);
  }
  function back() {
    step = Math.max(1, step - 1);
  }
</script>

{#if cart.isEmpty}
  <div class="empty">
    <p>Votre panier est vide.</p>
    <Button href="/">Retour à la boutique</Button>
  </div>
{:else}
  <div class="flow">
    <ol class="steps">
      <li class:active={step >= 1} class:current={step === 1}>
        1 · Coordonnées
      </li>
      <li class:active={step >= 2} class:current={step === 2}>2 · Paiement</li>
      <li class:active={step >= 3} class:current={step === 3}>
        3 · Récapitulatif
      </li>
    </ol>

    {#if formError}<p class="form-error" role="alert">{formError}</p>{/if}

    <form
      method="POST"
      use:enhance={() => {
        submitting = true;
        return async ({ result }) => {
          submitting = false;
          if (result.type === "redirect") {
            cart.clear();
            coupon.set(null);
            await goto(result.location);
          } else if (result.type === "failure") {
            formError =
              (result.data?.message as string) ?? "Une erreur est survenue.";
            step = 1;
          }
        };
      }}
    >
      <!-- hidden payload (server is authoritative for prices) -->
      <input type="hidden" name="items" value={itemsJson} />
      <input type="hidden" name="coupon_code" value={coupon.code ?? ""} />
      <input type="hidden" name="lat" value={lat ?? ""} />
      <input type="hidden" name="lng" value={lng ?? ""} />
      <input type="hidden" name="payment_method" value={payment} />
      <input
        type="hidden"
        name="marketing_opt_in"
        value={marketing ? "on" : ""}
      />

      {#if step === 1}
        <div class="panel">
          <Field
            label="Nom complet"
            name="customer_name"
            bind:value={name}
            required
            error={errors.name}
            autocomplete="name"
          />
          <Field
            label="Téléphone"
            name="customer_phone"
            type="tel"
            bind:value={phone}
            required
            error={errors.phone}
            autocomplete="tel"
            placeholder="06 12 34 56 78"
          />
          <Field
            label="Adresse de livraison"
            name="customer_address"
            bind:value={address}
            required
            error={errors.address}
            textarea
            placeholder="Rue, quartier, ville…"
          />
          <Field
            label="Email (optionnel)"
            name="customer_email"
            type="email"
            bind:value={email}
            error={errors.email}
            autocomplete="email"
            helper="Optionnel - sert à vous envoyer le récapitulatif de votre commande, à vous tenir informé du suivi de livraison, et à profiter d'offres et de réductions exclusives."
          />
          <label class="opt-in">
            <input type="checkbox" bind:checked={marketing} />
            Je souhaite recevoir les offres et réductions exclusives de MART+
          </label>

          <div class="map-block">
            <span class="map-label"
              >Point de livraison sur la carte <span class="req">*</span></span
            >
            <LocationPicker bind:lat bind:lng bind:distanceKm />
            {#if errors.pin}<p class="pin-error" role="alert">
                {errors.pin}
              </p>{/if}
            {#if distanceKm != null}
              <p class="fee-preview">
                {#if deliveryFee === 0}
                  Livraison offerte 🎉
                {:else}
                  Distance : {distanceKm.toFixed(1).replace(".", ",")} km · Frais
                  de livraison : {formatPrice(deliveryFee ?? 0)}
                {/if}
              </p>
            {/if}
          </div>

          <Button full size="lg" onclick={next}
            >Continuer vers le paiement</Button
          >
        </div>
      {:else if step === 2}
        <div class="panel">
          <fieldset class="pay">
            <legend>Mode de paiement</legend>
            {#each ["cod", "cib", "edahabia"] as method (method)}
              <label class="pay-opt" class:on={payment === method}>
                <input
                  type="radio"
                  name="pay"
                  value={method}
                  bind:group={payment}
                />
                <span class="dot" aria-hidden="true"></span>
                {PAYMENT_LABELS[method]}
              </label>
            {/each}
          </fieldset>
          <div class="nav">
            <Button variant="ghost" onclick={back}>Retour</Button>
            <Button onclick={next}>Voir le récapitulatif</Button>
          </div>
        </div>
      {:else}
        <div class="panel">
          <ul class="review">
            {#each cart.items as it (it.productId)}
              <li>
                <span>{it.name} <em>× {it.quantity}</em></span>
                <span>{formatPrice(it.price * it.quantity)}</span>
              </li>
            {/each}
          </ul>
          <div class="totals">
            <div class="row">
              <span>Sous-total</span><span>{formatPrice(cart.subtotal)}</span>
            </div>
            {#if discount > 0}
              <div class="row discount">
                <span>Remise ({coupon.code})</span><span
                  >−{formatPrice(discount)}</span
                >
              </div>
            {/if}
            <div class="row">
              <span>Livraison</span>
              <span
                >{deliveryFee === 0
                  ? "Offerte 🎉"
                  : formatPrice(deliveryFee ?? 0)}</span
              >
            </div>
            <div class="row grand">
              <span>Total</span><span>{formatPrice(total)}</span>
            </div>
          </div>
          <p class="ship-to">
            Livraison à : <strong>{name}</strong> · {phone}<br />{address}
          </p>
          <div class="nav">
            <Button variant="ghost" onclick={back}>Retour</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Confirmation…" : "Confirmer la commande"}
            </Button>
          </div>
        </div>
      {/if}
    </form>
  </div>
{/if}

<style>
  .flow {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }
  .steps {
    display: flex;
    gap: var(--space-2);
    flex-wrap: wrap;

    li {
      flex: 1;
      min-width: 120px;
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-pill);
      background: var(--surface-inset);
      color: var(--text-muted);
      font-family: var(--font-ui);
      font-weight: 600;
      font-size: var(--fs-xs);
      text-align: center;

      &.active {
        color: var(--text);
      }
      &.current {
        background: var(--accent);
        color: var(--accent-text);
      }
    }
  }
  .panel {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }
  .form-error {
    padding: var(--space-3) var(--space-4);
    border-radius: var(--radius-md);
    background: color-mix(in srgb, var(--accent) 14%, transparent);
    color: var(--accent);
    font-weight: 600;
    font-size: var(--fs-sm);
  }
  .opt-in {
    display: flex;
    align-items: flex-start;
    gap: var(--space-2);
    font-size: var(--fs-sm);
    color: var(--text-muted);

    input {
      margin-top: 3px;
      accent-color: var(--accent);
    }
  }
  .map-block {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);

    .map-label {
      font-family: var(--font-ui);
      font-weight: 600;
      font-size: var(--fs-sm);
      .req {
        color: var(--accent);
      }
    }
    .pin-error {
      color: var(--accent);
      font-size: var(--fs-xs);
      font-weight: 600;
    }
    .fee-preview {
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-md);
      background: var(--surface-inset);
      font-family: var(--font-mono);
      font-size: var(--fs-sm);
    }
  }
  .pay {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    border: none;

    legend {
      font-family: var(--font-ui);
      font-weight: 600;
      margin-bottom: var(--space-2);
    }
    .pay-opt {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-4);
      border-radius: var(--radius-md);
      border: 1.5px solid var(--border);
      cursor: pointer;
      font-family: var(--font-ui);
      font-weight: 500;
      transition: border-color var(--dur) var(--ease);

      input {
        position: absolute;
        opacity: 0;
        pointer-events: none;
      }
      .dot {
        width: 20px;
        height: 20px;
        border-radius: var(--radius-pill);
        border: 2px solid var(--border);
        flex-shrink: 0;
        transition: border-color var(--dur) var(--ease);
      }
      &.on {
        border-color: var(--accent);
        .dot {
          border-color: var(--accent);
          background: radial-gradient(
            circle,
            var(--accent) 0 5px,
            transparent 6px
          );
        }
      }
    }
  }
  .review {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    font-size: var(--fs-sm);

    li {
      display: flex;
      justify-content: space-between;
      gap: var(--space-3);
      padding-bottom: var(--space-2);
      border-bottom: 1px solid var(--border);

      em {
        color: var(--text-muted);
        font-style: normal;
      }
    }
  }
  .totals {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    font-size: var(--fs-sm);

    .row {
      display: flex;
      justify-content: space-between;
    }
    .discount {
      color: var(--accent);
    }
    .grand {
      margin-top: var(--space-2);
      padding-top: var(--space-2);
      border-top: 1px solid var(--border);
      font-weight: 700;
      font-size: var(--fs-lg);
    }
  }
  .ship-to {
    font-size: var(--fs-sm);
    color: var(--text-muted);
    line-height: 1.6;
    strong {
      color: var(--text);
    }
  }
  .nav {
    display: flex;
    justify-content: space-between;
    gap: var(--space-3);
  }
  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-4);
    padding: var(--space-16) 0;
    text-align: center;
    color: var(--text-muted);
  }
</style>
