"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { EmptyState, LoadingBlock, PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/Icon";
import { PetCardSkeleton } from "@/components/pets/PetCard";
import { PetListingCard } from "@/components/pets/PetListingCard";
import { useStore } from "@/lib/store";
import type { ListingType, Pet, Species } from "@/lib/types";

/* ---------- filter model (all state lives in the URL) ---------- */

const SPECIES_OPTIONS: { value: Species; label: string }[] = [
  { value: "dog", label: "Dogs" },
  { value: "cat", label: "Cats" },
  { value: "small", label: "Small pets" },
  { value: "bird", label: "Birds & more" },
];

type AgeBucket = "young" | "adult" | "senior";
const AGE_OPTIONS: { value: AgeBucket; label: string }[] = [
  { value: "young", label: "Young" },
  { value: "adult", label: "Adult" },
  { value: "senior", label: "Senior" },
];
/** Young: under 2 years · Adult: 2–7 years · Senior: 8+ years. */
const ageBucket = (months: number): AgeBucket => (months < 24 ? "young" : months < 96 ? "adult" : "senior");

const GOOD_WITH_OPTIONS = [
  { value: "kids", label: "Children" },
  { value: "dogs", label: "Dogs" },
  { value: "cats", label: "Cats" },
] as const;
type GoodWith = (typeof GOOD_WITH_OPTIONS)[number]["value"];

const DISTANCE_OPTIONS = [
  { value: "5", label: "Within 5 miles" },
  { value: "10", label: "Within 10 miles" },
  { value: "25", label: "Within 25 miles" },
  { value: "50", label: "Within 50 miles" },
  { value: "any", label: "Any distance" },
];
const DEFAULT_DISTANCE = "25";

const SORT_OPTIONS = [
  { value: "nearest", label: "Nearest first" },
  { value: "newest", label: "Newest first" },
  { value: "fee-asc", label: "Lowest fee" },
  { value: "fee-desc", label: "Highest fee" },
  { value: "youngest", label: "Youngest first" },
] as const;
type SortKey = (typeof SORT_OPTIONS)[number]["value"];

const PAGE_SIZE = 6;

function csv<T extends string>(raw: string | null, allowed: readonly T[]): T[] {
  if (!raw) return [];
  return raw.split(",").filter((x): x is T => (allowed as readonly string[]).includes(x));
}

interface Filters {
  species: Species[];
  type: ListingType | "";
  city: string;
  distance: string;
  age: AgeBucket[];
  good: GoodWith[];
  sort: SortKey;
}

function readFilters(sp: URLSearchParams): Filters {
  const type = sp.get("type");
  const distance = sp.get("distance");
  const sort = sp.get("sort");
  return {
    species: csv(sp.get("species"), SPECIES_OPTIONS.map((o) => o.value)),
    type: type === "adoption" || type === "rehoming" ? type : "",
    city: (sp.get("city") ?? "").trim(),
    distance: DISTANCE_OPTIONS.some((o) => o.value === distance) ? (distance as string) : DEFAULT_DISTANCE,
    age: csv(sp.get("age"), AGE_OPTIONS.map((o) => o.value)),
    good: csv(sp.get("good"), GOOD_WITH_OPTIONS.map((o) => o.value)),
    sort: SORT_OPTIONS.some((o) => o.value === sort) ? (sort as SortKey) : "nearest",
  };
}

function applyFilters(pets: Pet[], f: Filters): Pet[] {
  const city = f.city.toLowerCase();
  const maxMiles = f.distance === "any" ? Infinity : Number(f.distance);
  const out = pets.filter(
    (p) =>
      (f.species.length === 0 || f.species.includes(p.species)) &&
      (!f.type || p.listingType === f.type) &&
      (!city || p.city.toLowerCase().includes(city)) &&
      p.distanceMiles <= maxMiles &&
      (f.age.length === 0 || f.age.includes(ageBucket(p.ageMonths))) &&
      f.good.every((g) => p.goodWith.includes(g)),
  );
  const by: Record<SortKey, (a: Pet, b: Pet) => number> = {
    nearest: (a, b) => a.distanceMiles - b.distanceMiles,
    newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
    "fee-asc": (a, b) => a.fee - b.fee,
    "fee-desc": (a, b) => b.fee - a.fee,
    youngest: (a, b) => a.ageMonths - b.ageMonths,
  };
  return out.sort(by[f.sort]);
}

/* ---------- small UI pieces ---------- */

const fieldBox =
  "h-[46px] w-full rounded-[16px] border border-field bg-white px-[13px] text-[14px] text-ink outline-none transition placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/15";

function FilterCheck({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-[11px] py-[6px] text-[13px] leading-[1.5] text-muted hover:text-ink">
      <input type="checkbox" checked={checked} onChange={onChange} className="peer sr-only" />
      <span
        aria-hidden
        className="grid size-4 shrink-0 place-items-center rounded-[4px] border border-field bg-white text-[11px] font-bold leading-none text-white peer-checked:border-brand peer-checked:bg-brand peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand"
      >
        {checked ? "✓" : ""}
      </span>
      {label}
    </label>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="mt-[26px] first-of-type:mt-[31px]">
      <legend className="mb-[6px] text-[13px] font-semibold leading-[1.5] text-ink">{title}</legend>
      {children}
    </fieldset>
  );
}

/** Top search row: Location / Distance / Listing type, applied on "Search pets". */
function SearchControls({ initial, onSearch }: { initial: Pick<Filters, "city" | "distance" | "type">; onSearch: (v: Pick<Filters, "city" | "distance" | "type">) => void }) {
  const [city, setCity] = useState(initial.city);
  const [distance, setDistance] = useState(initial.distance);
  const [type, setType] = useState(initial.type);
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        onSearch({ city: city.trim(), distance, type });
      }}
      className="grid gap-4 rounded-[16px] border border-field bg-white p-[19px] pt-[9px] md:grid-cols-3 md:items-end md:gap-5 xl:grid-cols-[340px_240px_320px_1fr]"
    >
      <div>
        <label htmlFor="f-city" className="mb-[6px] block text-[12px] font-medium leading-[1.5] text-ink">Location</label>
        <input id="f-city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City or ZIP code" className={fieldBox} />
      </div>
      <div>
        <label htmlFor="f-distance" className="mb-[6px] block text-[12px] font-medium leading-[1.5] text-ink">Distance</label>
        <div className="relative">
          <select id="f-distance" value={distance} onChange={(e) => setDistance(e.target.value)} className={`${fieldBox} cursor-pointer appearance-none pr-9 text-muted`}>
            {DISTANCE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <Icon name="chevron-down" size={16} className="pointer-events-none absolute right-[13px] top-1/2 -translate-y-1/2" />
        </div>
      </div>
      <div>
        <label htmlFor="f-type" className="mb-[6px] block text-[12px] font-medium leading-[1.5] text-ink">Listing type</label>
        <div className="relative">
          <select id="f-type" value={type} onChange={(e) => setType(e.target.value as Filters["type"])} className={`${fieldBox} cursor-pointer appearance-none pr-9 text-muted`}>
            <option value="">Adopt or rehome</option>
            <option value="adoption">Adoption</option>
            <option value="rehoming">Rehoming</option>
          </select>
          <Icon name="chevron-down" size={16} className="pointer-events-none absolute right-[13px] top-1/2 -translate-y-1/2" />
        </div>
      </div>
      <button
        type="submit"
        className="h-[50px] w-full rounded-full bg-brand text-[14px] font-semibold text-white transition-colors hover:bg-brand-dark md:col-span-3 xl:col-span-1 xl:mb-[9px] xl:w-[268px] xl:justify-self-end"
      >
        Search pets
      </button>
    </form>
  );
}

/* ---------- page ---------- */

function FindAPet() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { publicPets, ready } = useStore();
  const [panelOpen, setPanelOpen] = useState(false);

  const query = sp.toString();
  const filters = useMemo(() => readFilters(new URLSearchParams(query)), [query]);
  const results = useMemo(() => applyFilters(publicPets(), filters), [publicPets, filters]);

  const setParams = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(query);
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    const qs = next.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  };

  const toggleIn = <T extends string>(key: string, list: T[], value: T) => {
    const next = list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
    setParams({ [key]: next.join(",") || null });
  };

  const resetAll = () => {
    router.replace(pathname, { scroll: false });
    setPanelOpen(false);
  };

  const activeCount =
    filters.species.length + filters.age.length + filters.good.length + (filters.type ? 1 : 0) + (filters.city ? 1 : 0) + (filters.distance !== DEFAULT_DISTANCE ? 1 : 0);
  const cityShort = filters.city.split(",")[0].trim();

  return (
    <div className="container-page pb-16">
      <h1 className="pt-10 font-serif text-[34px] leading-[1.2] text-ink md:pt-[47px] md:text-[42px]">Your new chapter is out there.</h1>
      <p className="mt-[14px] text-[15px] leading-[1.5] text-muted">Find a companion who fits your home, your pace, and your heart.</p>

      <div className="mt-8">
        <SearchControls
          key={`${filters.city}|${filters.distance}|${filters.type}`}
          initial={filters}
          onSearch={(v) => setParams({ city: v.city || null, distance: v.distance === DEFAULT_DISTANCE ? null : v.distance, type: v.type || null })}
        />
      </div>

      {/* Mobile filter toggle */}
      <button
        type="button"
        aria-expanded={panelOpen}
        aria-controls="pet-filters"
        onClick={() => setPanelOpen((o) => !o)}
        className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-full border border-field bg-white text-[14px] font-semibold text-ink md:hidden"
      >
        {panelOpen ? "Hide filters" : "Show filters"}
        {activeCount > 0 && <span className="grid size-5 place-items-center rounded-full bg-brand text-[11px] text-white">{activeCount}</span>}
      </button>

      <div className="mt-6 grid gap-8 md:mt-[29px] md:grid-cols-[220px_minmax(0,1fr)] lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside
          id="pet-filters"
          aria-label="Search filters"
          className={`${panelOpen ? "block" : "hidden"} self-start rounded-[16px] border border-field bg-white px-[21px] pb-8 pt-[21px] md:block md:min-h-[792px]`}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-[20px] font-semibold leading-[1.5] text-ink">Filters</h2>
            <button type="button" onClick={resetAll} className="-my-3 py-3 pr-1 text-[12px] font-medium text-brand hover:underline">
              Reset
            </button>
          </div>

          <FilterGroup title="Pet type">
            <FilterCheck label="All pets" checked={filters.species.length === 0} onChange={() => setParams({ species: null })} />
            {SPECIES_OPTIONS.map((o) => (
              <FilterCheck key={o.value} label={o.label} checked={filters.species.includes(o.value)} onChange={() => toggleIn("species", filters.species, o.value)} />
            ))}
          </FilterGroup>

          <FilterGroup title="Age">
            <FilterCheck label="Any age" checked={filters.age.length === 0} onChange={() => setParams({ age: null })} />
            {AGE_OPTIONS.map((o) => (
              <FilterCheck key={o.value} label={o.label} checked={filters.age.includes(o.value)} onChange={() => toggleIn("age", filters.age, o.value)} />
            ))}
          </FilterGroup>

          <FilterGroup title="Good with">
            {GOOD_WITH_OPTIONS.map((o) => (
              <FilterCheck key={o.value} label={o.label} checked={filters.good.includes(o.value)} onChange={() => toggleIn("good", filters.good, o.value)} />
            ))}
          </FilterGroup>
        </aside>

        <section aria-label="Results" className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[15px] font-semibold leading-[1.5] text-ink" aria-live="polite">
              {ready ? `${results.length} ${results.length === 1 ? "companion" : "companions"}${cityShort ? ` near ${cityShort}` : ""}` : "Finding companions…"}
            </p>
            <label className="relative flex items-center gap-1 text-[13px] text-muted">
              <span>Sort:</span>
              <select
                value={filters.sort}
                onChange={(e) => setParams({ sort: e.target.value === "nearest" ? null : e.target.value })}
                className="h-10 cursor-pointer appearance-none bg-transparent pr-6 text-[13px] text-muted outline-none hover:text-ink"
                aria-label="Sort results"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <Icon name="chevron-down" size={14} className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2" />
            </label>
          </div>

          {!ready ? (
            <div className="mt-[18px] grid gap-[17px] sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => <PetCardSkeleton key={i} />)}
            </div>
          ) : results.length === 0 ? (
            <div className="-mx-4 md:-mx-10 xl:-mx-[72px]">
              <EmptyState
                title="No matches just yet"
                body="Try widening your distance or removing a filter or two. New companions are listed every day."
                action={<Button onClick={resetAll}>Reset all filters</Button>}
              />
            </div>
          ) : (
            <ResultsGrid key={query} pets={results} />
          )}
        </section>
      </div>
    </div>
  );
}

/** Keyed by the query string so "load more" resets whenever filters change. */
function ResultsGrid({ pets }: { pets: Pet[] }) {
  const [limit, setLimit] = useState(PAGE_SIZE);
  const shown = pets.slice(0, limit);
  return (
    <>
      <ul className="mt-[18px] grid gap-[17px] sm:grid-cols-2 xl:grid-cols-3">
        {shown.map((p) => (
          <li key={p.id} className="flex">
            <div className="w-full [&>a]:h-full">
              <PetListingCard pet={p} />
            </div>
          </li>
        ))}
      </ul>
      {limit < pets.length && (
        <div className="mt-[50px] flex justify-center">
          <button
            type="button"
            onClick={() => setLimit((l) => l + PAGE_SIZE)}
            className="h-[50px] w-full max-w-[348px] rounded-full border border-field bg-white text-[14px] font-semibold text-brand transition hover:border-brand"
          >
            Load more companions
          </button>
        </div>
      )}
    </>
  );
}

export default function PetsPage() {
  return (
    <PageShell>
      <Suspense fallback={<LoadingBlock />}>
        <FindAPet />
      </Suspense>
    </PageShell>
  );
}
