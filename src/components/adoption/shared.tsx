/* eslint-disable @next/next/no-img-element */
import type { Application, ApplicationStatus, Pet } from "@/lib/types";
import { APP_STATUS_LABEL } from "@/lib/format";

/** "rescue" / "shelter" wording for shelters, "pet parent" for private owners. */
export function ownerNoun(pet: Pet, kind: "rescue" | "shelter" = "rescue") {
  return pet.ownerType === "shelter" ? kind : "pet parent";
}

/** Short owner name for button labels: "Happy Tails" for shelters, first name for people. */
export function ownerShortName(pet: Pet) {
  const parts = pet.ownerName.trim().split(/\s+/);
  return pet.ownerType === "shelter" ? parts.slice(0, 2).join(" ") : parts[0];
}

export const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? name;

export function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}

/** "Today, 10:24 AM" / "Yesterday, 9:02 AM" / "Nov 8, 4:15 PM". */
export function formatWhen(iso: string) {
  const d = new Date(iso);
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const today = new Date();
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((startOf(today) - startOf(d)) / 86400000);
  if (diff === 0) return `Today, ${time}`;
  if (diff === 1) return `Yesterday, ${time}`;
  return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${time}`;
}

/** Applications that still block a new one (mirrors submitApplication's guard). */
export const isOpenApplication = (a: Application) => a.status !== "withdrawn" && a.status !== "declined";

const PILL_TONE: Record<ApplicationStatus, string> = {
  submitted: "bg-sage-125 text-brand",
  in_review: "bg-sage-125 text-brand",
  meet_greet: "bg-peach-100 text-ink",
  approved: "bg-brand text-white",
  declined: "bg-danger-50 text-danger",
  withdrawn: "bg-sand-100 text-muted",
};

export function StatusPill({ status, className = "" }: { status: ApplicationStatus; className?: string }) {
  return (
    <span className={`inline-flex h-[30px] items-center rounded-full px-3 text-[12px] font-semibold ${PILL_TONE[status]} ${className}`}>
      {APP_STATUS_LABEL[status]}
    </span>
  );
}

/**
 * Pet media for adoption screens: the pet's first photo, otherwise the solid paw
 * artwork from the 12:34 / 12:38 frames on a sage panel.
 */
export function AdoptionPetArt({ pet, pawWidth = 90, className = "" }: { pet: Pet; pawWidth?: number; className?: string }) {
  if (pet.photos[0]) {
    return <img src={pet.photos[0]} alt={`Photo of ${pet.name}`} className={`size-full object-cover ${className}`} />;
  }
  return (
    <div className={`grid size-full place-items-center ${className}`}>
      <img src="/figma/adoption/paw-summary.svg" alt="" width={90} height={79.6466} style={{ width: pawWidth, height: pawWidth * 0.885 }} />
    </div>
  );
}

export function CheckMark({ size = 14, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden className={className}>
      <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
