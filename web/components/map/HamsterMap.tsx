"use client";

import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet.markercluster";
import { Hamster, SPECIES, formatFee } from "@/lib/api";
import { LeafletCSS } from "./leaflet-css";

/**
 * Full-page clustered map of every hamster that has coordinates.
 *
 * Uses Leaflet directly (rather than react-leaflet wrappers) so we can
 * keep the leaflet.markercluster integration tiny and avoid the extra
 * abstraction; the cluster plugin doesn't have first-class react-leaflet
 * bindings in the v5 line.
 *
 * The component is purely client-side — it touches ``window`` and the
 * DOM at module load — so the parent route imports it via
 * ``next/dynamic`` with ``ssr: false``.
 */
export function HamsterMap({ hamsters }: { hamsters: Hamster[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  // Stable reference to the rows so the marker effect doesn't churn.
  const points = useMemo(
    () =>
      hamsters.filter(
        (h): h is Hamster & { latitude: number; longitude: number } =>
          typeof h.latitude === "number" && typeof h.longitude === "number",
      ),
    [hamsters],
  );

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    if (mapRef.current) return; // dev-mode StrictMode double-invoke guard

    fixDefaultIconPaths();

    const map = L.map(node, {
      center: [42.5, -94],
      zoom: 4,
      worldCopyJump: true,
      scrollWheelZoom: true,
    });
    mapRef.current = map;

    L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      },
    ).addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (points.length === 0) return;

    const cluster = L.markerClusterGroup({
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      zoomToBoundsOnClick: true,
      maxClusterRadius: 60,
      iconCreateFunction: (group) => {
        const count = group.getChildCount();
        const size = count < 10 ? 36 : count < 100 ? 44 : 56;
        return L.divIcon({
          html: `<div class="hamstr-cluster-inner">${count}</div>`,
          className: "hamstr-cluster",
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });
      },
    });

    for (const h of points) {
      const marker = L.marker([h.latitude, h.longitude], {
        icon: pinIcon(),
        title: h.name,
      });
      marker.bindPopup(buildPopup(h), {
        maxWidth: 240,
        className: "hamstr-popup",
      });
      cluster.addLayer(marker);
    }
    map.addLayer(cluster);

    // Fit to all points the first time we load them.
    const bounds = cluster.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 9 });
    }

    return () => {
      map.removeLayer(cluster);
    };
  }, [points]);

  return (
    <>
      <LeafletCSS />
      <div ref={containerRef} className="h-full w-full" />
    </>
  );
}

/**
 * Leaflet's bundler-resolved default icon paths break in webpack/turbopack
 * setups. Re-point them at the published CDN images so pins always render.
 */
function fixDefaultIconPaths(): void {
  const proto = L.Icon.Default.prototype as unknown as {
    _getIconUrl?: () => string;
  };
  delete proto._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

function pinIcon(): L.DivIcon {
  return L.divIcon({
    html: '<div class="hamstr-pin"></div>',
    className: "hamstr-pin-wrap",
    iconSize: [28, 36],
    iconAnchor: [14, 34],
    popupAnchor: [0, -30],
  });
}

function buildPopup(h: Hamster & { latitude: number; longitude: number }): string {
  const speciesLabel =
    SPECIES.find((s) => s.value === h.species)?.label ?? h.species;
  const fee = formatFee(h.adoption_fee_cents);
  const photo = h.photo_url
    ? `<img src="${escapeAttr(h.photo_url)}" alt="" class="hamstr-popup-photo" loading="lazy" />`
    : '<div class="hamstr-popup-photo hamstr-popup-photo--empty">🐹</div>';
  return `
    <a class="hamstr-popup-link" href="/hamsters/${h.id}">
      ${photo}
      <div class="hamstr-popup-body">
        <p class="hamstr-popup-name">${escapeText(h.name)}</p>
        <p class="hamstr-popup-meta">${escapeText(speciesLabel)} · ${escapeText(h.location)}</p>
        <p class="hamstr-popup-fee">${escapeText(fee)}</p>
      </div>
    </a>
  `;
}

function escapeText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(value: string): string {
  return escapeText(value).replace(/"/g, "&quot;");
}
