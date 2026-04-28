"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Hamster } from "@/lib/api";
import { HamsterCard } from "@/components/HamsterCard";
import { BrowseControls, BrowseFilters } from "@/components/home/BrowseControls";
import { Pagination } from "@/components/home/Pagination";
import { ConnectedPills } from "@/components/ui/ConnectedPills";
import { RevealChars } from "@/components/motion/RevealChars";
import { RevealUp } from "@/components/motion/RevealUp";
import { gsap, ScrollTrigger } from "@/lib/gsap";

/**
 * Section C — listing grid. Tesoro pattern: pale teal section background,
 * connected pills + center heading, then a 3-up grid of saturated cards.
 * Each card carries its own colour family so the grid reads like a
 * confetti of stickers.
 */
export function HamsterGrid({
  hamsters,
  error,
  filters,
  total,
  page,
  pageSize,
}: {
  hamsters: Hamster[];
  error: string | null;
  filters: BrowseFilters;
  total: number;
  page: number;
  pageSize: number;
}) {
  const gridRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const grid = gridRef.current;
    if (!grid) return;

    const cards = grid.querySelectorAll<HTMLElement>("li");
    const ctx = gsap.context(() => {
      gsap.set(cards, { y: 60, opacity: 0 });
      ScrollTrigger.create({
        trigger: grid,
        start: "top 78%",
        once: true,
        onEnter: () => {
          gsap.to(cards, {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: "expo.out",
            stagger: 0.08,
          });
        },
      });
    }, grid);

    return () => ctx.revert();
  }, [hamsters.length]);

  return (
    <section
      id="hamsters"
      data-tone="teal-base"
      className="relative w-full"
      style={{
        background: "var(--teal-base)",
        color: "var(--teal-dark)",
      }}
    >
      <div
        className="mx-auto flex w-full flex-col items-center"
        style={{
          maxWidth: 1440,
          paddingLeft: "var(--site-edge)",
          paddingRight: "var(--site-edge)",
          paddingTop: "clamp(5rem, 11vh, 9rem)",
          paddingBottom: "clamp(5rem, 11vh, 9rem)",
          gap: "clamp(2.5rem, 5vh, 4rem)",
        }}
      >
        <div className="flex flex-col items-center gap-6 text-center">
          <RevealUp>
            <ConnectedPills
              parts={["LOOKING FOR", "A HOME"]}
              tones={["teal", "teal-light"]}
            />
          </RevealUp>
          <h2
            className="display-lg mx-auto"
            style={{ maxWidth: "16ch", color: "var(--teal-dark)" }}
          >
            <RevealChars as="span">meet the </RevealChars>
            <RevealChars as="span" delay={0.1} className="text-[color:var(--teal)]">
              hamsters.
            </RevealChars>
          </h2>
          <RevealUp delay={0.3}>
            <p
              className="body-lead mx-auto max-w-[48ch]"
              style={{ color: "color-mix(in srgb, var(--teal-dark) 80%, transparent)" }}
            >
              {total > 0
                ? `${total} small lives waiting for soft landings. Each one comes with a full story.`
                : "No hamsters here yet. The grid will fill up as people post their listings."}
            </p>
          </RevealUp>
        </div>

        <BrowseControls filters={filters} total={total} />

        {error ? (
          <div
            className="mx-auto max-w-2xl rounded-2xl p-6 text-center text-sm"
            style={{
              background: "color-mix(in srgb, var(--rose) 25%, transparent)",
              color: "var(--teal-dark)",
            }}
          >
            {error}. Make sure the API is running on port 8000.
          </div>
        ) : hamsters.length === 0 ? (
          <div
            className="mx-auto max-w-2xl rounded-3xl p-10 text-center"
            style={{ background: "color-mix(in srgb, var(--teal) 12%, transparent)" }}
          >
            <p className="body-main">
              Be the first to post.{" "}
              <Link
                href="/rehome"
                className="underline decoration-2 underline-offset-4"
                style={{ color: "var(--teal)" }}
              >
                Rehome a hamster
              </Link>
              .
            </p>
          </div>
        ) : (
          <>
            <ul
              ref={gridRef}
              className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
            >
              {hamsters.map((h) => (
                <li key={h.id}>
                  <HamsterCard hamster={h} />
                </li>
              ))}
            </ul>
            <Pagination
              filters={filters}
              total={total}
              page={page}
              pageSize={pageSize}
            />
          </>
        )}
      </div>
    </section>
  );
}
