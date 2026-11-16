"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/Icon";
import { PetCard, PetCardSkeleton } from "@/components/pets/PetCard";
import { useStore } from "@/lib/store";
import type { Species } from "@/lib/types";

const CATEGORIES: { species: Species; label: string; sub: string; icon: string }[] = [
  { species: "dog", label: "Dogs", sub: "A loyal +1", icon: "dog" },
  { species: "cat", label: "Cats", sub: "A little independence", icon: "cat" },
  { species: "small", label: "Small pets", sub: "Small but mighty", icon: "rabbit" },
  { species: "bird", label: "Birds & more", sub: "A different kind of love", icon: "bird" },
];

const STEPS = [
  { n: "01", icon: "search", title: "Find your connection", body: ["Browse pets by location, personality, and needs.", "There’s someone for every kind of home."] },
  { n: "02", icon: "chat", title: "Get to know each other", body: ["Chat with the shelter or pet parent. Ask questions", "and arrange a safe, in-person meet-and-greet."] },
  { n: "03", icon: "home", title: "Start your next chapter", body: ["Make sure it’s the right fit, complete the paperwork,", "and help your new companion settle in."] },
];

const FEATURED = ["p_luna", "p_milo", "p_willow", "p_teddy"];

function SearchBar() {
  const router = useRouter();
  const [species, setSpecies] = useState<"" | Species>("");
  const [city, setCity] = useState("");
  const [type, setType] = useState<"" | "adoption" | "rehoming">("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = new URLSearchParams();
    if (species) q.set("species", species);
    if (city.trim()) q.set("city", city.trim());
    if (type) q.set("type", type);
    router.push(`/pets${q.toString() ? `?${q}` : ""}`);
  };

  return (
    <form
      role="search"
      onSubmit={submit}
      className="grid gap-4 rounded-[20px] border border-line bg-white p-5 md:grid-cols-[1fr_auto_1.2fr_auto_1fr_auto] md:items-center md:gap-0 md:px-[17px] md:py-[22px]"
    >
      <label className="relative flex items-center gap-[14px] md:pr-7">
        <Icon name="paw-search" size={32} />
        <span className="flex-1">
          <span className="block text-[12px] leading-[1.5] text-muted">I’m looking for</span>
          <select
            value={species}
            onChange={(e) => setSpecies(e.target.value as Species | "")}
            className="w-full cursor-pointer appearance-none bg-transparent pr-6 text-[17px] font-semibold leading-[1.5] text-ink outline-none"
            aria-label="Pet type"
          >
            <option value="">All pets</option>
            {CATEGORIES.map((c) => (
              <option key={c.species} value={c.species}>{c.label}</option>
            ))}
          </select>
        </span>
        <Icon name="chevron-down" size={20} className="pointer-events-none absolute right-7 top-1/2 -translate-y-1/2" />
      </label>
      <span className="hidden h-14 w-px bg-line md:block" />
      <label className="flex items-center gap-[17px] md:px-[25px]">
        <Icon name="pin" size={24} />
        <span className="flex-1">
          <span className="block text-[12px] leading-[1.5] text-muted">Near me</span>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City or ZIP code"
            aria-label="City or ZIP code"
            className="w-full bg-transparent text-[17px] leading-[1.5] text-ink outline-none placeholder:text-muted"
          />
        </span>
      </label>
      <span className="hidden h-14 w-px bg-line md:block" />
      <label className="relative flex items-center md:px-[30px]">
        <span className="flex-1">
          <span className="block text-[12px] leading-[1.5] text-muted">A new beginning</span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as typeof type)}
            className="w-full cursor-pointer appearance-none bg-transparent pr-6 text-[17px] font-semibold leading-[1.5] text-ink outline-none"
            aria-label="Adopt or rehome"
          >
            <option value="">Adopt or rehome</option>
            <option value="adoption">Adoption</option>
            <option value="rehoming">Rehoming</option>
          </select>
        </span>
        <Icon name="chevron-down" size={20} className="pointer-events-none absolute right-[30px] top-1/2 -translate-y-1/2" />
      </label>
      <button type="submit" className="inline-flex h-[50px] items-center gap-[10px] justify-self-stretch rounded-full bg-brand pl-[17px] pr-12 text-[15px] font-semibold text-white hover:bg-brand-dark md:justify-self-end md:w-[192px]">
        <Icon name="search-white" size={20} />
        Search pets
      </button>
    </form>
  );
}

export default function HomePage() {
  const { getPet, ready } = useStore();
  const featured = FEATURED.map((id) => getPet(id)).filter((p) => p && p.status === "active");

  return (
    <PageShell footer="full">
      {/* Hero */}
      <section className="container-page grid gap-10 pb-10 pt-11 lg:grid-cols-[1fr_594px] lg:gap-6">
        <div className="pt-0">
          <span className="inline-flex h-[33px] items-center gap-2.5 rounded-full bg-sage-100 pl-3 pr-5 text-[10px] font-semibold uppercase text-brand">
            <Icon name="paw-small" size={16} />
            Little paws. Big possibilities.
          </span>
          <h1 className="mt-[26px] font-serif text-[48px] leading-[1.14] text-ink sm:text-[64px] xl:text-[76px]">
            A best friend.
            <br />
            A fresh start.
          </h1>
          <p className="mt-6 max-w-[570px] text-[18px] leading-[1.5] text-muted">
            Find a companion. Give them a loving home.
            <br className="hidden sm:block" /> Connect with shelters and caring pet parents near you.
          </p>
          <ButtonLink href="/pets" className="mt-8 w-[243px] !justify-between">
            Meet your new friend
            <Icon name="arrow-right-white" size={20} />
          </ButtonLink>
          <p className="mt-5 text-[14px] text-muted">
            Rehoming a pet?{" "}
            <Link href="/post" className="ml-1 font-semibold text-brand hover:underline">
              We’re here to help ↗
            </Link>
          </p>
        </div>
        <div className="relative">
          <div className="grid h-[360px] place-items-center rounded-bl-[24px] rounded-br-[140px] rounded-tl-[140px] rounded-tr-[24px] bg-sage-150 sm:h-[510px]">
            <Icon name="paw-hero" size={180} className="sm:!h-[207px] sm:!w-[238px]" />
          </div>
          <div className="absolute -bottom-2 left-4 flex h-[76px] w-[294px] items-center gap-4 rounded-[16px] bg-white px-4 shadow-float lg:-left-[42px] lg:bottom-[2px]">
            <span className="grid size-[44px] place-items-center rounded-full bg-sage-100">
              <Icon name="heart" size={20} />
            </span>
            <span>
              <span className="block text-[16px] font-semibold text-ink">A little love.</span>
              <span className="block text-[13px] text-muted">A whole new life.</span>
            </span>
          </div>
          <p className="mt-6 text-right text-[13px] text-muted lg:pr-[218px]">A home for every kind of companion.</p>
        </div>
      </section>

      {/* Search */}
      <section className="container-page pb-[26px] pt-3" aria-label="Find your companion">
        <SearchBar />
      </section>

      {/* Browse by companion */}
      <section className="container-page pb-11 pt-5">
        <h2 className="font-serif text-[28px] leading-[1.14] text-ink">Who’s your kind of companion?</h2>
        <div className="mt-[34px] grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((c, i) => (
            <Link
              key={c.species}
              href={`/pets?species=${c.species}`}
              className={`flex h-[104px] items-center gap-4 rounded-[16px] px-5 transition hover:ring-2 hover:ring-brand/20 ${i === 0 ? "bg-sage-100" : "bg-sand-100"}`}
            >
              <span className={`grid size-14 place-items-center rounded-full ${i === 0 ? "bg-sage-300" : "bg-sand-200"}`}>
                <Icon name={c.icon} size={30} />
              </span>
              <span>
                <span className="block text-[18px] font-semibold leading-[1.5] text-ink">{c.label}</span>
                <span className="block text-[13px] text-muted">{c.sub}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="container-page pb-10 pt-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-serif text-[32px] leading-[1.2] text-ink md:text-[40px]">A few faces. A whole lot of love.</h2>
            <p className="mt-3 text-[16px] text-muted">Meet some of the companions looking for their next chapter.</p>
          </div>
          <Link href="/pets" className="flex items-center gap-3 pb-9 text-[15px] font-semibold text-brand hover:underline">
            View all pets
            <Icon name="arrow-right" size={20} />
          </Link>
        </div>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {!ready
            ? FEATURED.map((id) => <PetCardSkeleton key={id} />)
            : featured.map((p) => <PetCard key={p!.id} pet={p!} />)}
        </div>
        <p className="mt-[34px] text-center text-[14px] text-muted">A little patience, the right match, a lifetime of love.</p>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-6 bg-sage-50">
        <div className="container-page py-11">
          <h2 className="text-center font-serif text-[30px] leading-[1.2] text-ink md:text-[37px]">A small step for you. A new world for them.</h2>
          <p className="mt-4 text-center text-[15px] text-muted">Your journey to a new best friend starts here.</p>
          <div className="mt-[47px] grid gap-10 md:grid-cols-3 md:gap-[30px]">
            {STEPS.map((s) => (
              <div key={s.n}>
                <div className="flex items-start justify-between">
                  <span className="grid size-12 place-items-center rounded-[16px] bg-sage-200">
                    <Icon name={s.icon} size={24} />
                  </span>
                  <span className="pr-1 font-serif text-[28px] text-numeral">{s.n}</span>
                </div>
                <h3 className="mt-5 text-[22px] font-semibold leading-[1.55] text-ink">{s.title}</h3>
                <p className="mt-2 text-[14px] leading-[1.55] text-muted">
                  {s.body[0]}
                  <br className="hidden lg:block" /> {s.body[1]}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Responsible rehoming */}
      <section id="our-mission" className="container-page scroll-mt-6 pb-10 pt-[38px]">
        <div className="flex flex-col gap-5 rounded-[18px] bg-peach-50 p-6 md:flex-row md:items-center md:gap-[27px] md:px-[26px] md:py-[27px]">
          <span className="grid size-[66px] shrink-0 place-items-center rounded-full bg-peach-200">
            <Icon name="shield" size={30} />
          </span>
          <div className="flex-1">
            <h2 className="font-serif text-[26px] leading-[1.2] text-ink">Good homes. Thoughtful connections.</h2>
            <p className="mt-3 text-[13px] leading-[1.55] text-muted">
              Meet in person. Ask for health records. Never send a deposit before meeting your pet.
              <br className="hidden md:block" /> We encourage adoption and responsible rehoming, always with animal welfare first.
            </p>
          </div>
          <Link href="/safety" className="flex items-center gap-4 text-[14px] font-semibold text-brand hover:underline md:pr-6">
            Read our safety guide
            <Icon name="arrow-right-2" size={19} />
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="container-page pb-9 pt-2.5">
        <div className="relative overflow-hidden rounded-[24px] bg-brand px-6 py-8 md:h-[284px] md:px-[42px] md:py-[34px]">
          <p className="text-[11px] font-semibold uppercase text-sage-on-dark">For every new beginning</p>
          <h2 className="mt-5 font-serif text-[32px] leading-[1.2] text-white md:text-[44px]">
            Their person is out there.
            <br />
            Help them find each other.
          </h2>
          <p className="mt-5 text-[15px] leading-[1.55] text-sage-on-dark">Create a thoughtful listing and connect with people ready to care.</p>
          <ButtonLink href="/post" variant="peach" size="lg" className="mt-6 w-[241px] !justify-start md:absolute md:bottom-[51px] md:right-[46px] md:mt-0">
            + Post a pet
          </ButtonLink>
          <Icon name="paw-cta" size={134} className="pointer-events-none absolute right-[80px] top-[26px] hidden rotate-[13deg] md:block" />
        </div>
      </section>
    </PageShell>
  );
}
