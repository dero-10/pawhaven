import type { EnergyLevel, PetDetails, PetDraft, TriState } from "@/lib/types";

export const STEPS = [
  { n: 1, label: "The basics", href: "/post" },
  { n: 2, label: "Health & care", href: "/post/health" },
  { n: 3, label: "Story & media", href: "/post/story" },
  { n: 4, label: "Review & submit", href: "/post/review" },
] as const;

export type StepNumber = 1 | 2 | 3 | 4;
export type Errors = Partial<Record<string, string>>;

export const emptyDetails = (): PetDetails => ({
  vaccinated: "",
  spayedNeutered: "",
  microchipped: "",
  houseTrained: "",
  energyLevel: "",
  behavior: "",
  idealHome: "",
});

/** Details for a draft, falling back to the legacy boolean health flags for older listings. */
export function draftDetails(d: PetDraft): PetDetails {
  if (d.details) return { ...emptyDetails(), ...d.details };
  if (!d.editingId) return emptyDetails();
  const fromBool = (b: boolean): TriState => (b ? "yes" : "no");
  return {
    ...emptyDetails(),
    vaccinated: fromBool(d.health.vaccinated),
    spayedNeutered: fromBool(d.health.spayedNeutered),
    microchipped: fromBool(d.health.microchipped),
  };
}

export const TRI_LABEL: Record<TriState, string> = { yes: "Yes", no: "No", unknown: "Unknown" };
export const ENERGY_LABEL: Record<EnergyLevel, string> = { low: "Low", moderate: "Moderate", high: "High" };

export const COMFORT_OPTIONS = [
  { value: "adults", label: "Adults" },
  { value: "kids", label: "Kids" },
  { value: "dogs", label: "Dogs" },
  { value: "cats", label: "Cats" },
  { value: "first-time owners", label: "First-time owners" },
] as const;

export const TEMPERAMENT_OPTIONS = ["Affectionate", "Playful", "Calm", "Curious", "Gentle", "Energetic", "Independent", "Shy", "Social", "Chatty"];

export const comfortLabel = (v: string) => COMFORT_OPTIONS.find((o) => o.value === v)?.label ?? v;

/** "adults and cats" / "adults, kids and cats" */
export function joinList(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
}

/** Converts an age value + unit into months. */
export function toMonths(value: number | "", unit: "months" | "years"): number | "" {
  if (value === "") return "";
  return unit === "years" ? Math.round(value * 12) : Math.round(value);
}

/** Splits stored months into the value shown in the form. */
export function fromMonths(months: number | "", unit: "months" | "years"): number | "" {
  if (months === "") return "";
  return unit === "years" ? Math.round((months / 12) * 10) / 10 : months;
}

export function defaultAgeUnit(d: PetDraft): "months" | "years" {
  if (d.ageUnit) return d.ageUnit;
  if (d.ageMonths === "") return "years";
  return d.ageMonths >= 12 && d.ageMonths % 12 === 0 ? "years" : "months";
}

export const pronoun = (sex: PetDraft["sex"]) => (sex === "male" ? "His" : sex === "female" ? "Her" : "Their");
export const possessive = (name: string) => (name.trim() ? `${name.trim()}’s` : "Your pet’s");

// ---------- validation (each step validates only its own fields) ----------

export function validateBasics(d: PetDraft): Errors {
  const e: Errors = {};
  if (!d.name.trim()) e.name = "Enter your pet’s name.";
  else if (d.name.trim().length > 40) e.name = "Keep the name under 40 characters.";
  if (!d.species) e.species = "Choose a pet type.";
  if (!d.breed.trim()) e.breed = "Enter a breed or mix (or “Unknown”).";
  if (!d.sex) e.sex = "Choose a sex.";
  if (d.ageMonths === "" || Number.isNaN(d.ageMonths)) e.age = "Enter an age.";
  else if (d.ageMonths <= 0) e.age = "Age must be more than 0.";
  else if (d.ageMonths > 360) e.age = "That age looks too high — please check it.";
  if (!d.size) e.size = "Choose a size.";
  if (d.fee !== "" && (Number.isNaN(d.fee) || d.fee < 0)) e.fee = "Enter a fee of 0 or more.";
  else if (d.fee !== "" && d.fee > 1000) e.fee = "Fees over $1,000 aren’t allowed. Pawhaven is for rehoming, not selling.";
  if (!d.city.trim()) e.city = "Enter a city or ZIP code.";
  return e;
}

export function validateHealth(d: PetDraft): Errors {
  const e: Errors = {};
  const x = draftDetails(d);
  for (const k of ["vaccinated", "spayedNeutered", "microchipped", "houseTrained"] as const) {
    if (!x[k]) e[k] = "Choose Yes, No or Unknown.";
  }
  if (!x.energyLevel) e.energyLevel = "Choose an energy level.";
  if (!d.health.notes.trim()) e.notes = "Describe any medical needs, or write “None known”.";
  if (!x.behavior.trim()) e.behavior = "Tell adopters about behavior and any special care.";
  return e;
}

export function validateStory(d: PetDraft): Errors {
  const e: Errors = {};
  const x = draftDetails(d);
  if (d.story.trim().length < 40) e.story = "Please write at least 40 characters so people can get to know them.";
  if (!x.idealHome.trim()) e.idealHome = "Describe the home that would suit them best.";
  if (d.listingType === "rehoming" && !d.reasonForRehoming.trim()) e.reason = "Share why you’re rehoming.";
  return e;
}

export const hasErrors = (e: Errors) => Object.values(e).some(Boolean);

/** First step that still has errors (used to block skipping ahead). */
export function firstIncompleteStep(d: PetDraft): StepNumber | null {
  if (hasErrors(validateBasics(d))) return 1;
  if (hasErrors(validateHealth(d))) return 2;
  if (hasErrors(validateStory(d))) return 3;
  return null;
}
