"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BrowseFilters } from "./BrowseControls";

/**
 * Server-link pagination. Each Prev/Next/page-N link is a real ``<Link>``,
 * which keeps the home page server-rendered and shareable.
 */
export function Pagination({
  filters,
  total,
  page,
  pageSize,
}: {
  filters: BrowseFilters;
  total: number;
  page: number;
  pageSize: number;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const existing = useSearchParams();

  if (totalPages <= 1) return null;

  function hrefFor(targetPage: number): string {
    const params = new URLSearchParams(existing?.toString() || "");
    if (targetPage <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(targetPage));
    }
    // Preserve filters even if they came from controlled state rather than URL.
    setIfPresent(params, "q", filters.q);
    setIfPresent(params, "species", filters.species);
    setIfPresent(params, "gender", filters.gender);
    setIfPresent(params, "location", filters.location);
    setIfPresent(params, "max_fee", filters.maxFee);
    const qs = params.toString();
    return qs ? `/?${qs}#hamsters` : "/#hamsters";
  }

  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages;

  return (
    <nav
      className="flex w-full items-center justify-between gap-3"
      aria-label="Pagination"
    >
      <PagerLink
        href={hrefFor(page - 1)}
        disabled={prevDisabled}
        label="← Prev"
      />
      <p className="text-xs font-semibold uppercase tracking-wider opacity-70">
        Page {page} of {totalPages}
      </p>
      <PagerLink
        href={hrefFor(page + 1)}
        disabled={nextDisabled}
        label="Next →"
      />
    </nav>
  );
}

function setIfPresent(
  params: URLSearchParams,
  key: string,
  value: string | null | undefined,
): void {
  if (value && value !== "") params.set(key, value);
}

function PagerLink({
  href,
  disabled,
  label,
}: {
  href: string;
  disabled: boolean;
  label: string;
}) {
  if (disabled) {
    return (
      <span
        className="rounded-full px-5 py-2 text-xs font-bold tracking-wide opacity-40"
        style={{
          border:
            "1px solid color-mix(in srgb, var(--teal-dark) 25%, transparent)",
          color: "var(--teal-dark)",
        }}
      >
        {label}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className="rounded-full px-5 py-2 text-xs font-bold tracking-wide text-white"
      style={{ background: "var(--teal-dark)" }}
    >
      {label}
    </Link>
  );
}
