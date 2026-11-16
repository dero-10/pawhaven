"use client";

import Link from "next/link";
import { useState } from "react";
import { EmptyState, PageShell, RequireAuth } from "@/components/layout/PageShell";
import { ButtonLink } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { Icon } from "@/components/Icon";
import { PetListingCard } from "@/components/pets/PetListingCard";
import { useStore } from "@/lib/store";
import type { Pet } from "@/lib/types";

const SORTS = [
  { value: "recent", label: "Recently saved" },
  { value: "nearest", label: "Nearest first" },
  { value: "fee-asc", label: "Lowest fee" },
  { value: "name", label: "Name (A–Z)" },
] as const;
type SortKey = (typeof SORTS)[number]["value"];

function sortPets(pets: Pet[], sort: SortKey): Pet[] {
  // savedPets() returns in save order (oldest first)
  const list = [...pets];
  switch (sort) {
    case "recent":
      return list.reverse();
    case "nearest":
      return list.sort((a, b) => a.distanceMiles - b.distanceMiles);
    case "fee-asc":
      return list.sort((a, b) => a.fee - b.fee);
    case "name":
      return list.sort((a, b) => a.name.localeCompare(b.name));
  }
}

function SavedPets() {
  const { savedPets, toggleSave } = useStore();
  const toast = useToast();
  const [sort, setSort] = useState<SortKey>("recent");
  const all = savedPets();
  const sorted = sortPets(all, sort);
  const available = sorted.filter((p) => p.status === "active");
  const unavailable = sorted.filter((p) => p.status !== "active");

  if (all.length === 0) {
    return (
      <EmptyState
        as="h1"
        icon="heart-outline"
        title="No saved pets yet"
        body="Tap the heart on any companion to keep them here while you decide. We’ll let you know if their listing changes."
        action={<ButtonLink href="/pets">Find a pet</ButtonLink>}
      />
    );
  }

  return (
    <div className="container-page pb-16">
      <div className="flex flex-col gap-4 pb-8 pt-10 md:flex-row md:items-end md:justify-between md:pt-[47px]">
        <div>
          <h1 className="font-serif text-[34px] leading-[1.2] text-ink md:text-[42px]">Saved pets</h1>
          <p className="mt-[14px] text-[15px] leading-[1.5] text-muted">The companions you’re keeping close while you find the right fit.</p>
        </div>
        <ButtonLink href="/pets" variant="outline" className="self-start text-[14px] !text-brand md:self-auto">
          Find more pets
        </ButtonLink>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[15px] font-semibold leading-[1.5] text-ink" aria-live="polite">
          {all.length} saved {all.length === 1 ? "companion" : "companions"}
          {unavailable.length > 0 && <span className="font-normal text-muted"> · {unavailable.length} no longer available</span>}
        </p>
        <label className="relative flex items-center gap-1 text-[13px] text-muted">
          <span>Sort:</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="cursor-pointer appearance-none bg-transparent pr-6 text-[13px] text-muted outline-none hover:text-ink"
            aria-label="Sort saved pets"
          >
            {SORTS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <Icon name="chevron-down" size={14} className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2" />
        </label>
      </div>

      {available.length > 0 ? (
        <ul className="mt-[18px] grid gap-[17px] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {available.map((p) => (
            <li key={p.id} className="flex [&>a]:w-full">
              <PetListingCard pet={p} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-6 rounded-[16px] border border-field bg-white p-6 text-[14px] text-muted">
          None of your saved companions are available right now.{" "}
          <Link href="/pets" className="font-semibold text-brand hover:underline">Browse pets looking for a home</Link>
        </p>
      )}

      {unavailable.length > 0 && (
        <section className="mt-14" aria-labelledby="unavailable-heading">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="unavailable-heading" className="text-[20px] font-semibold leading-[1.5] text-ink">No longer available</h2>
              <p className="mt-1 text-[13px] text-muted">These companions have been adopted or their listing is paused.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                unavailable.forEach((p) => toggleSave(p.id));
                toast(`Removed ${unavailable.length} unavailable ${unavailable.length === 1 ? "pet" : "pets"}`);
              }}
              className="text-[13px] font-semibold text-brand hover:underline"
            >
              Remove all unavailable
            </button>
          </div>
          <ul className="mt-[18px] grid gap-[17px] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {unavailable.map((p) => (
              <li key={p.id} className="flex [&>a]:w-full">
                <PetListingCard pet={p} flag={p.status === "adopted" ? "Adopted" : "Unavailable"} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export default function SavedPage() {
  return (
    <PageShell>
      <RequireAuth>
        <SavedPets />
      </RequireAuth>
    </PageShell>
  );
}
