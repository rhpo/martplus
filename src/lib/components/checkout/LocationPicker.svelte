<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import "leaflet/dist/leaflet.css";
  import markerIcon from "leaflet/dist/images/marker-icon.png";
  import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
  import markerShadow from "leaflet/dist/images/marker-shadow.png";
  import { STORE_LOCATION } from "$lib/config";
  import { haversineKm } from "$lib/utils/geo";
  import type { LatLng } from "$lib/types";
  import Pin from "$lib/components/icons/Pin.svelte";

  let {
    lat = $bindable<number | null>(null),
    lng = $bindable<number | null>(null),
    distanceKm = $bindable<number | null>(null),
  }: {
    lat?: number | null;
    lng?: number | null;
    distanceKm?: number | null;
  } = $props();

  let container = $state<HTMLDivElement | null>(null);
  let geoError = $state("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let map: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let marker: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let L: any = null;

  function setPoint(p: LatLng) {
    lat = Math.round(p.lat * 1e6) / 1e6;
    lng = Math.round(p.lng * 1e6) / 1e6;
    distanceKm = Math.round(haversineKm(STORE_LOCATION, p) * 100) / 100;
    if (marker) marker.setLatLng([lat, lng]);
  }

  function locateMe() {
    geoError = "";
    if (!navigator.geolocation) {
      geoError = "La géolocalisation n'est pas disponible sur cet appareil.";
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setPoint(p);
        if (map) map.setView([p.lat, p.lng], 15);
      },
      () => {
        geoError =
          "Position refusée - placez le repère manuellement sur la carte.";
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  onMount(async () => {
    // Client-only: import Leaflet here so SSR never touches `window`.
    const leaflet = await import("leaflet");
    L = leaflet.default ?? leaflet;

    // Fix default marker icon paths (Vite-bundled URLs).
    delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconUrl: markerIcon,
      iconRetinaUrl: markerIcon2x,
      shadowUrl: markerShadow,
    });

    const start: [number, number] =
      lat != null && lng != null
        ? [lat, lng]
        : [STORE_LOCATION.lat, STORE_LOCATION.lng];

    map = L.map(container!).setView(start, 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
      maxZoom: 19,
    }).addTo(map);

    marker = L.marker(start, { draggable: true }).addTo(map);
    marker.on("dragend", () => {
      const ll = marker.getLatLng();
      setPoint({ lat: ll.lat, lng: ll.lng });
    });
    map.on("click", (e: { latlng: { lat: number; lng: number } }) => {
      setPoint({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    // If a pin already exists (returning to the step), reflect its distance.
    if (lat != null && lng != null) setPoint({ lat, lng });
  });

  onDestroy(() => {
    if (map) {
      map.remove();
      map = null;
    }
  });
</script>

<div class="picker">
  <div class="map" bind:this={container}></div>
  <div class="controls">
    <button type="button" class="locate" onclick={locateMe}>
      <Pin size={16} /> Utiliser ma position
    </button>
    {#if lat != null && lng != null}
      <span class="coords">📍 {lat.toFixed(5)}, {lng.toFixed(5)}</span>
    {:else}
      <span class="hint"
        >Touchez la carte pour placer le repère de livraison.</span
      >
    {/if}
  </div>
  {#if geoError}<p class="geo-error" role="alert">{geoError}</p>{/if}
</div>

<style>
  .picker {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);

    .map {
      width: 100%;
      height: 260px;
      border-radius: var(--radius-md);
      overflow: hidden;
      border: 1px solid var(--border);
      z-index: 0;
    }
    .controls {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--space-3);

      .locate {
        display: inline-flex;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-2) var(--space-4);
        border-radius: var(--radius-pill);
        background: var(--navy-800);
        color: var(--white);
        font-family: var(--font-ui);
        font-weight: 600;
        font-size: var(--fs-sm);
        &:hover {
          background: var(--accent);
        }
      }
      .coords {
        font-family: var(--font-mono);
        font-size: var(--fs-xs);
        color: var(--text);
      }
      .hint {
        font-size: var(--fs-xs);
        color: var(--text-muted);
      }
    }
    .geo-error {
      color: var(--accent);
      font-size: var(--fs-xs);
    }
  }

  @media (min-width: 768px) {
    .picker .map {
      height: 340px;
    }
  }
</style>
