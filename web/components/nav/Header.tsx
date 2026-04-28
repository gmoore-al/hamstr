"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { StaggerHoverLink } from "@/components/nav/StaggerHoverLink";

/**
 * Sticky top nav. Reads the in-view section's `data-tone` and recolors
 * itself for legibility. Mirrors Tesoro's nav: pill-grouped links on
 * the right, brand mark on the left.
 *
 * `dark`-tone sections are: ink, teal, coral, rose. Everything else
 * is treated as a light surface (cream + base/light variants).
 */
const DARK_TONES = new Set(["ink", "teal", "coral", "rose"]);

export function Header() {
  const headerRef = useRef<HTMLElement>(null);
  const [tone, setTone] = useState<string>("cream");

  useEffect(() => {
    const triggers: ScrollTrigger[] = [];
    const sections = document.querySelectorAll<HTMLElement>("[data-tone]");
    sections.forEach((sec) => {
      const t = ScrollTrigger.create({
        trigger: sec,
        start: "top 64px",
        end: "bottom 64px",
        onToggle: (self) => {
          if (self.isActive) setTone(sec.dataset.tone || "cream");
        },
      });
      triggers.push(t);
    });
    return () => {
      triggers.forEach((t) => t.kill());
    };
  }, []);

  const dark = DARK_TONES.has(tone);
  const fg = dark ? "var(--cream)" : "var(--ink)";
  const hoverColor = dark ? "var(--mustard)" : "var(--coral)";
  // Pill background sits on top of the section colour so we always
  // need a translucent surface that reads regardless of section.
  const pillBg = dark
    ? "color-mix(in srgb, var(--ink) 70%, transparent)"
    : "color-mix(in srgb, var(--cream) 80%, transparent)";
  const pillBorder = dark
    ? "color-mix(in srgb, var(--cream) 18%, transparent)"
    : "color-mix(in srgb, var(--ink) 14%, transparent)";

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    gsap.to(el, { color: fg, duration: 0.4, ease: "power2.out" });
  }, [fg]);

  return (
    <header
      ref={headerRef}
      className="fixed inset-x-0 top-0 z-40"
      style={{
        color: fg,
        paddingTop: "clamp(0.75rem, 1.4vh, 1.25rem)",
        paddingBottom: "clamp(0.75rem, 1.4vh, 1.25rem)",
        paddingLeft: "var(--site-edge)",
        paddingRight: "var(--site-edge)",
      }}
    >
      <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-4">
        {/* Brand lockup — pink hammy face + multi-tone "hamstr"
            wordmark PNG. Colours are baked into the asset (teal / coral
            / red / yellow / blue / green letterforms) so it sits on any
            section background. True RGBA with a clean alpha channel. */}
        <Link href="/" className="flex items-center" aria-label="Hamstr home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/hamstr-wordmark.png"
            alt="Hamstr"
            style={{
              display: "block",
              // 1665 × 293 native aspect → 5.68:1. Width clamps with
              // viewport so it reads on mobile without overwhelming
              // the nav.
              width: "clamp(11rem, 17vw, 15rem)",
              height: "auto",
            }}
          />
        </Link>

        {/* Nav — Tesoro pill-grouped */}
        <nav
          className="hidden items-center gap-1 rounded-full border px-1.5 py-1 backdrop-blur-md sm:flex"
          style={{ background: pillBg, borderColor: pillBorder }}
        >
          {[
            { href: "/", label: "Browse" },
            { href: "/map", label: "View Map" },
            { href: "/rehome", label: "Rehome" },
            { href: "/#how-it-works", label: "How it works" },
          ].map((l) => (
            <span
              key={l.href + l.label}
              className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider"
            >
              <StaggerHoverLink href={l.href} hoverColor={hoverColor}>
                {l.label}
              </StaggerHoverLink>
            </span>
          ))}
        </nav>

        {/* CTA — always visible, themed */}
        <Link
          href="/rehome"
          className="rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider transition-transform hover:-translate-y-0.5"
          style={{
            background: dark ? "var(--mustard)" : "var(--ink)",
            color: dark ? "var(--ink)" : "var(--cream)",
          }}
        >
          Rehome
        </Link>
      </div>
    </header>
  );
}
