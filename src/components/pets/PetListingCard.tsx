"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { Pet } from "@/lib/types";
import { formatFee, LISTING_TYPE_LABEL, petSubtitle, sexLabel } from "@/lib/format";
import { PetArt, SaveButton } from "./PetCard";

/** Small listing pill used on discover cards and the profile hero (frames 14:37 / 14:39). */
export function ListingPill({ type, onArt = "canvas" }: { type: Pet["listingType"]; onArt?: "canvas" | "white" }) {
  const bg = onArt === "white" ? "bg-white" : type === "adoption" ? "bg-canvas" : "bg-peach-25";
  return (
    <span className={`inline-flex h-7 min-w-[90px] items-center rounded-[14px] px-2.5 text-[11px] font-medium text-ink ${bg}`}>
      {LISTING_TYPE_LABEL[type]}
    </span>
  );
}

/**
 * Discover/saved grid card — matches the "Luna listing" card in frame 14:37 (318×350).
 * `flag` renders an overlay label (e.g. "Adopted") for listings that are no longer available.
 */
export function PetListingCard({ pet, flag }: { pet: Pet; flag?: ReactNode }) {
  return (
    // The save button sits outside the link so interactive elements aren't nested.
    <div className="group relative flex flex-col overflow-hidden rounded-[16px] border border-field bg-white transition hover:-translate-y-0.5 hover:shadow-card">
      <Link href={`/pets/${pet.id}`} className="flex flex-1 flex-col rounded-[16px]">
        <div className={`relative h-[190px] overflow-hidden rounded-[16px] ${flag ? "opacity-70" : ""}`}>
          <PetArt pet={pet} pawSize={73} pawSrc="/figma/discover/card-paw.svg" />
          <div className="absolute left-3 top-3">
            <ListingPill type={pet.listingType} />
          </div>
          {flag && (
            <span className="absolute bottom-3 left-3 inline-flex h-7 items-center rounded-[14px] bg-ink px-3 text-[11px] font-semibold text-white">{flag}</span>
          )}
        </div>
        <div className="flex flex-1 flex-col px-[17px] pt-[15px]">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="truncate text-[22px] font-semibold leading-[1.5] text-ink">{pet.name}</h3>
            <span className="text-[16px] font-semibold leading-[1.5] text-ink">{formatFee(pet.fee)}</span>
          </div>
          <p className="mt-1 text-[13px] leading-[1.5] text-muted">{petSubtitle(pet)}</p>
          <p className="mt-1 text-[12px] leading-[1.5] text-muted">
            {sexLabel(pet.sex)} · {pet.city}
          </p>
          <div className="mt-[14px] border-t border-field pb-[13px] pt-[14px]">
            <span className="text-[12px] font-semibold leading-[1.5] text-brand">
              Meet {pet.name}&nbsp;&nbsp;<span aria-hidden className="inline-block transition group-hover:translate-x-0.5">→</span>
            </span>
          </div>
        </div>
      </Link>
      <div className="absolute right-3 top-3">
        <SaveButton pet={pet} size={32} tone="brand" />
      </div>
    </div>
  );
}
