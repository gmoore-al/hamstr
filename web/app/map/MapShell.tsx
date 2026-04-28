"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Hamster } from "@/lib/api";

/**
 * Client wrapper that lazy-loads the Leaflet map without SSR.
 *
 * Leaflet touches ``window`` at module scope, so we have to tell Next
 * not to render this on the server. Wrapping it in a tiny client
 * component keeps the route file itself a server component (which is
 * how we fetch the listings) while still satisfying that constraint.
 */
const HamsterMap = dynamic(
  () => import("@/components/map/HamsterMap").then((m) => m.HamsterMap),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex h-full w-full items-center justify-center"
        style={{ background: "var(--teal-base)" }}
      >
        <p className="text-sm font-semibold uppercase tracking-wider text-[color:var(--teal-dark)]">
          loading map…
        </p>
      </div>
    ),
  },
);

export function MapShell({
  hamsters,
  error,
}: {
  hamsters: Hamster[];
  error: string | null;
}) {
  return (
    <section
      className="relative w-full"
      style={{ background: "var(--teal-base)" }}
    >
      <div
        className="mx-auto flex w-full flex-col"
        style={{
          maxWidth: 1440,
          paddingLeft: "var(--site-edge)",
          paddingRight: "var(--site-edge)",
          paddingTop: "clamp(2.5rem, 6vh, 5rem)",
          paddingBottom: "clamp(2.5rem, 6vh, 5rem)",
          gap: "clamp(1.5rem, 3vh, 2.5rem)",
        }}
      >
        <header className="flex flex-col gap-3">
          <p
            className="label-eyebrow"
            style={{ color: "var(--teal-dark)", opacity: 0.7 }}
          >
            VIEW MAP
          </p>
          <h1
            className="display-lg"
            style={{ color: "var(--teal-dark)", maxWidth: "20ch" }}
          >
            hamsters across <span style={{ color: "var(--teal)" }}>the map.</span>
          </h1>
          <p
            className="body-lead max-w-2xl"
            style={{ color: "color-mix(in srgb, var(--teal-dark) 80%, transparent)" }}
          >
            {error
              ? error
              : `${hamsters.length} hamsters with locations. Zoom in to break clusters apart, click a pin for the listing.`}
          </p>
          <div className="flex gap-2">
            <Link
              href="/"
              className="rounded-full px-4 py-2 text-xs font-bold tracking-wide"
              style={{
                background: "transparent",
                color: "var(--teal-dark)",
                border:
                  "1px solid color-mix(in srgb, var(--teal-dark) 25%, transparent)",
              }}
            >
              ← BROWSE GRID
            </Link>
          </div>
        </header>

        <div
          className="relative w-full overflow-hidden rounded-3xl card-shadow"
          style={{
            height: "min(72vh, 720px)",
            background: "var(--cream)",
          }}
        >
          {error ? (
            <div className="flex h-full w-full items-center justify-center p-6 text-center text-sm">
              {error}. Make sure the API is running on port 8000.
            </div>
          ) : (
            <HamsterMap hamsters={hamsters} />
          )}
        </div>
      </div>
    </section>
  );
}
