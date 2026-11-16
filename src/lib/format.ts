import type { ApplicationStatus, Pet, PetStatus, Species } from "./types";

export const SPECIES_LABEL: Record<Species, string> = {
  dog: "Dogs",
  cat: "Cats",
  small: "Small pets",
  bird: "Birds & more",
};

export const SPECIES_SINGULAR: Record<Species, string> = {
  dog: "Dog",
  cat: "Cat",
  small: "Small pet",
  bird: "Bird",
};

export function formatAge(months: number): string {
  if (months < 12) return `${months} month${months === 1 ? "" : "s"}`;
  const y = Math.floor(months / 12);
  return `${y} year${y === 1 ? "" : "s"}`;
}

export function formatFee(fee: number): string {
  return fee === 0 ? "Free" : `$${fee}`;
}

export function petSubtitle(p: Pet): string {
  return `${p.breed} · ${formatAge(p.ageMonths)}`;
}

export function petLocation(p: Pet): string {
  return p.distanceMiles > 0 ? `${p.city} · ${p.distanceMiles} miles away` : p.city;
}

export const sexLabel = (s: Pet["sex"]) => (s === "female" ? "Female" : "Male");

export const LISTING_TYPE_LABEL = { adoption: "Adoption", rehoming: "Rehoming" } as const;

export const PET_STATUS_LABEL: Record<PetStatus, string> = {
  draft: "Draft",
  pending_review: "In review",
  active: "Live",
  paused: "Paused",
  adopted: "Adopted",
  rejected: "Needs changes",
};

export const APP_STATUS_LABEL: Record<ApplicationStatus, string> = {
  submitted: "Submitted",
  in_review: "In review",
  meet_greet: "Meet & greet",
  approved: "Approved",
  declined: "Not a match",
  withdrawn: "Withdrawn",
};

/** Order used by the progress tracker on the request-status page. */
export const APP_STEPS: ApplicationStatus[] = ["submitted", "in_review", "meet_greet", "approved"];

export function timeAgo(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = s / 60;
  if (m < 60) return `${Math.floor(m)}m ago`;
  const h = m / 60;
  if (h < 24) return `${Math.floor(h)}h ago`;
  const d = h / 24;
  if (d < 7) return `${Math.floor(d)}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export const TONE_BG = {
  green: "bg-sage-150",
  peach: "bg-peach-100",
  lilac: "bg-lilac-100",
  sage: "bg-sage-175",
} as const;

export const TONE_PAW = {
  green: "/icons/paw-card-green.svg",
  peach: "/icons/paw-card-peach.svg",
  lilac: "/icons/paw-card-lilac.svg",
  sage: "/icons/paw-card-peach.svg",
} as const;
