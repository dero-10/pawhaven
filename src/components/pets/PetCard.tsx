"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Pet } from "@/lib/types";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/ui/Toast";
import { Icon } from "@/components/Icon";
import { formatFee, LISTING_TYPE_LABEL, petLocation, petSubtitle, sexLabel, TONE_BG, TONE_PAW } from "@/lib/format";

/** Paw artwork placeholder (or first photo) used for pet media. */
export function PetArt({
  pet,
  className = "",
  pawSize = 82,
  pawSrc,
}: {
  pet: Pet;
  className?: string;
  pawSize?: number;
  /** Optional override for the paw artwork (e.g. the solid paw used on discover cards). */
  pawSrc?: string;
}) {
  if (pet.photos[0]) {
    return <img src={pet.photos[0]} alt={`Photo of ${pet.name}`} className={`size-full object-cover ${className}`} />;
  }
  return (
    <div className={`grid size-full place-items-center ${TONE_BG[pet.tone]} ${className}`}>
      <img src={pawSrc ?? TONE_PAW[pet.tone]} alt="" style={{ width: pawSize, height: pawSrc ? "auto" : pawSize * 0.92 }} />
    </div>
  );
}

export function SaveButton({ pet, size = 34, tone = "ink" }: { pet: Pet; size?: number; /** "brand" uses the green-stroke hearts from the discover/profile frames. */ tone?: "ink" | "brand" }) {
  const { isSaved, toggleSave, currentUser } = useStore();
  const toast = useToast();
  const router = useRouter();
  const saved = isSaved(pet.id);
  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? `Remove ${pet.name} from saved pets` : `Save ${pet.name}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!currentUser) {
          toast("Log in to save pets you love.", "info");
          router.push(`/login?next=/pets/${pet.id}`);
          return;
        }
        const now = toggleSave(pet.id);
        toast(now ? `${pet.name} saved` : `${pet.name} removed from saved`);
      }}
      className="relative grid place-items-center rounded-full bg-white shadow-sm transition before:absolute before:-inset-1 before:content-[''] hover:scale-105"
      style={{ width: size, height: size }}
    >
      {tone === "brand" ? (
        <img src={saved ? "/figma/discover/heart-filled.svg" : "/figma/discover/heart-outline.svg"} alt="" width={17} height={17} style={{ width: size * 0.53, height: size * 0.53 }} />
      ) : saved ? (
        <svg width={size / 2} height={size / 2} viewBox="0 0 24 24" fill="#245a46" aria-hidden>
          <path d="M12 21s-7.5-4.6-9.5-9.2C1 8.4 3.2 5 6.6 5c2 0 3.4 1.1 4.4 2.5C12 6.1 13.4 5 15.4 5 18.8 5 21 8.4 19.5 11.8 17.5 16.4 12 21 12 21z" />
        </svg>
      ) : (
        <Icon name="heart-outline" size={size / 2} />
      )}
    </button>
  );
}

export function ListingBadge({ type }: { type: Pet["listingType"] }) {
  return (
    <span className={`inline-flex h-[27px] items-center rounded-full px-[13px] text-[11px] font-semibold text-ink ${type === "adoption" ? "bg-sage-150" : "bg-peach-100"}`}>
      {LISTING_TYPE_LABEL[type]}
    </span>
  );
}

/** Listing card — matches "Luna · Adoption" card in the homepage frame (306×411). */
export function PetCard({ pet }: { pet: Pet }) {
  return (
    // The save button sits outside the link so interactive elements aren't nested.
    <div className="group relative flex flex-col overflow-hidden rounded-[18px] border border-line bg-white transition hover:-translate-y-0.5 hover:shadow-card">
      <Link href={`/pets/${pet.id}`} className="flex flex-1 flex-col rounded-[18px]">
        <div className="relative h-[231px]">
          <PetArt pet={pet} />
          <div className="absolute left-[13px] top-[13px]">
            <ListingBadge type={pet.listingType} />
          </div>
        </div>
        <div className="flex flex-1 flex-col px-[17px] pt-[14px]">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="text-[24px] font-semibold leading-[1.5] text-ink">{pet.name}</h3>
            <span className="text-[17px] font-semibold text-ink">{formatFee(pet.fee)}</span>
          </div>
          <p className="mt-0.5 text-[13px] leading-[1.5] text-muted">{petSubtitle(pet)}</p>
          <p className="text-[12px] leading-[1.5] text-muted">{sexLabel(pet.sex)}</p>
          <p className="mt-3 flex items-center gap-[7px] text-[11px] text-muted">
            <Icon name="pin-small" size={15} />
            {petLocation(pet)}
          </p>
          <div className="mt-[14px] flex items-center justify-between border-t border-line pb-4 pt-[13px]">
            <span className="text-[11px] font-medium text-ink">{pet.ownerType === "shelter" ? pet.ownerName : "Private pet parent"}</span>
            <Icon name="chevron-right" size={14} />
          </div>
        </div>
      </Link>
      <div className="absolute right-[13px] top-[13px]">
        <SaveButton pet={pet} />
      </div>
    </div>
  );
}

export function PetCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[18px] border border-line bg-white" aria-hidden>
      <div className="h-[231px] animate-pulse bg-sand-100" />
      <div className="space-y-3 p-[17px]">
        <div className="h-6 w-1/2 animate-pulse rounded bg-sand-100" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-sand-100" />
        <div className="h-4 w-1/3 animate-pulse rounded bg-sand-100" />
      </div>
    </div>
  );
}
