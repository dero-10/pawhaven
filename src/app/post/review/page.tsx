"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { EmptyState, PageShell, RequireAuth } from "@/components/layout/PageShell";
import { ButtonLink } from "@/components/ui/Button";
import { PetArt } from "@/components/pets/PetCard";
import { PostWizard } from "@/components/post/PostWizard";
import { useWizardDraft } from "@/components/post/useWizardDraft";
import { useWizardNav } from "@/components/post/useWizardNav";
import { comfortLabel, draftDetails, ENERGY_LABEL, firstIncompleteStep, joinList, possessive, STEPS } from "@/components/post/wizard";
import { useStore } from "@/lib/store";
import { formatAge, LISTING_TYPE_LABEL, sexLabel, SPECIES_SINGULAR } from "@/lib/format";
import type { Pet, PetDetails, PetDraft, TriState } from "@/lib/types";

/** Builds a throwaway Pet so the shared PetArt can render the listing media. */
function previewPet(d: PetDraft, existing?: Pet): Pet {
  return {
    id: "preview", name: d.name, species: (d.species || "dog") as Pet["species"], breed: d.breed, ageMonths: Number(d.ageMonths || 0),
    sex: (d.sex || "female") as Pet["sex"], size: (d.size || "small") as Pet["size"], color: d.color, city: d.city, distanceMiles: 0,
    listingType: d.listingType, fee: Number(d.fee || 0), ownerId: "", ownerName: "", ownerType: "private", status: "draft",
    tone: existing?.tone ?? "green", health: d.health, temperament: d.temperament, goodWith: d.goodWith, story: d.story,
    photos: d.photos, createdAt: "", updatedAt: "", views: 0,
  };
}

function triText(v: TriState | "", yes: string, no: string, unknown: string): string | null {
  return v === "yes" ? yes : v === "no" ? no : v === "unknown" ? unknown : null;
}

function healthTags(x: PetDetails, sex: PetDraft["sex"]): string[] {
  const fixed = sex === "male" ? "Neutered" : sex === "female" ? "Spayed" : "Spayed / neutered";
  return [
    triText(x.vaccinated, "Vaccinated", "Not vaccinated", "Vaccinations unknown"),
    triText(x.spayedNeutered, fixed, `Not ${fixed.toLowerCase()}`, `${fixed} status unknown`),
    triText(x.microchipped, "Microchipped", "Not microchipped", "Microchip unknown"),
    triText(x.houseTrained, "House trained", "Not house trained", "House training unknown"),
  ].filter((t): t is string => !!t);
}

const sentence = (s: string) => {
  const t = s.trim();
  return !t ? "" : /[.!?]$/.test(t) ? t : `${t}.`;
};

const CONFIRMATIONS = (name: string) => [
  `I own or am authorized to rehome ${name}.`,
  "All details are accurate and I’ve disclosed known health and behavioral needs.",
  "I agree to the listing rules and will screen adopters before any handover.",
];

function EditLink({ href, children }: { href: string; children: string }) {
  return (
    <Link href={href} className="shrink-0 text-[13px] font-semibold leading-[1.4] text-brand hover:underline">
      {children}
    </Link>
  );
}

function ReviewStep() {
  const router = useRouter();
  const { submitDraft, currentUser, getPet } = useStore();
  const { draft, flush, stop } = useWizardDraft();
  const nav = useWizardNav(flush);
  const [checks, setChecks] = useState([false, false, false]);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const idBase = useId();

  const editing = !!draft.editingId;
  const existing = draft.editingId ? getPet(draft.editingId) : undefined;
  const x = draftDetails(draft);
  const name = draft.name.trim() || "your pet";
  const incomplete = firstIncompleteStep(draft);
  const confirmations = CONFIRMATIONS(name);

  const careSummary = [
    sentence(draft.health.notes),
    draft.goodWith.length ? sentence(`Comfortable with ${joinList(draft.goodWith.map((g) => comfortLabel(g).toLowerCase()))}`) : "",
    x.energyLevel ? sentence(`${ENERGY_LABEL[x.energyLevel]} energy`) : "",
    sentence(x.behavior),
  ]
    .filter(Boolean)
    .join(" ");

  const onSubmit = () => {
    setSubmitError(null);
    if (incomplete) {
      setSubmitError(`Please complete “${STEPS[incomplete - 1].label}” before submitting.`);
      return;
    }
    if (!checks.every(Boolean)) {
      setCheckError("Please confirm all three statements to continue.");
      document.getElementById(`${idBase}-c${checks.findIndex((c) => !c)}`)?.focus();
      return;
    }
    setBusy(true);
    flush();
    const r = submitDraft();
    if (!r.ok) {
      setBusy(false);
      setSubmitError(r.error);
      return;
    }
    stop();
    router.push(`/post/submitted?id=${encodeURIComponent(r.data.id)}${editing ? "&updated=1" : ""}`);
  };

  const ageText = draft.ageMonths === "" ? "" : formatAge(Number(draft.ageMonths));
  const basicsLine = [draft.species && SPECIES_SINGULAR[draft.species], draft.breed.trim(), ageText, draft.sex && sexLabel(draft.sex)].filter(Boolean).join(" · ");
  const feeText = draft.fee === "" || draft.fee === 0 ? "No fee" : `$${draft.fee} fee`;
  const placeLine = [draft.city.trim(), LISTING_TYPE_LABEL[draft.listingType], feeText].filter(Boolean).join(" · ");

  return (
    <PostWizard
      step={4}
      maxReachable={4}
      editingName={editing ? draft.name : undefined}
      onSaveExit={nav.saveExit}
      onLeave={flush}
      actions={{
        backLabel: "Back",
        onBack: () => nav.go("/post/story"),
        continueLabel: busy ? "Submitting…" : editing ? "Submit changes for review" : "Submit for review",
        onContinue: onSubmit,
        onSaveDraft: nav.saveDraft,
        busy,
      }}
      notice={
        submitError && (
          <div role="alert" className="flex flex-col gap-2 rounded-[14px] border border-danger/30 bg-danger-50 px-5 py-4 text-[14px] text-danger sm:flex-row sm:items-center sm:justify-between">
            <span>{submitError}</span>
            {incomplete && (
              <Link href={STEPS[incomplete - 1].href} className="font-semibold underline">
                Go to {STEPS[incomplete - 1].label.toLowerCase()}
              </Link>
            )}
          </div>
        )
      }
      aside={
        <>
          <section aria-labelledby={`${idBase}-confirm`} className="rounded-[16px] border border-line bg-white px-[26px] pb-12 pt-[26px]">
            <h2 id={`${idBase}-confirm`} className="font-serif text-[26px] leading-[1.2] text-ink">
              One last thoughtful check.
            </h2>
            <fieldset className="mt-[50px] space-y-[40px]" aria-describedby={checkError ? `${idBase}-err` : undefined}>
              <legend className="sr-only">Required confirmations</legend>
              {confirmations.map((text, i) => (
                <label key={i} htmlFor={`${idBase}-c${i}`} className="flex cursor-pointer items-start gap-[14px]">
                  <input
                    id={`${idBase}-c${i}`}
                    type="checkbox"
                    checked={checks[i]}
                    aria-invalid={checkError && !checks[i] ? true : undefined}
                    onChange={(e) => {
                      const next = [...checks];
                      next[i] = e.target.checked;
                      setChecks(next);
                      if (next.every(Boolean)) setCheckError(null);
                    }}
                    className="mt-[2px] size-[18px] shrink-0 accent-brand"
                  />
                  <span className="text-[13px] leading-[1.4] text-ink">{text}</span>
                </label>
              ))}
            </fieldset>
            {checkError && (
              <p id={`${idBase}-err`} role="alert" className="mt-5 text-[13px] text-danger">
                {checkError}
              </p>
            )}
            <p className="mt-12 text-[13px] leading-[1.55] text-muted">Your listing is reviewed before it becomes public. No payment is collected here.</p>
          </section>
          <p className="mt-[39px] text-[13px] leading-[1.5] text-muted">
            {currentUser?.emailVerified ? "Your email is verified. ✓" : "Please verify your email before your listing can go live."}
          </p>
        </>
      }
    >
      <section aria-label="Listing summary" className="rounded-[16px] border border-line bg-white px-5 pb-10 pt-7 sm:px-7">
        <div className="flex flex-col gap-6 sm:flex-row sm:gap-7">
          <div className="h-[154px] w-full shrink-0 overflow-hidden rounded-[14px] sm:w-[183px]">
            <PetArt pet={previewPet(draft, existing)} pawSize={68} />
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <h2 className="text-[30px] font-semibold leading-[1.5] text-ink">{draft.name.trim() || "Unnamed pet"}</h2>
            <p className="mt-1.5 text-[15px] leading-[1.5] text-ink">{basicsLine || "Basics not added yet"}</p>
            <p className="mt-3 text-[15px] leading-[1.5] text-muted">{placeLine}</p>
            <div className="mt-4 flex justify-end sm:mt-auto">
              <EditLink href="/post">Edit basics</EditLink>
            </div>
          </div>
        </div>

        <hr className="mt-[30px] border-line" />

        <div className="mt-6">
          <div className="flex items-start justify-between gap-4">
            <h3 className="text-[21px] font-semibold leading-[1.5] text-ink">Health &amp; care</h3>
            <EditLink href="/post/health">Edit health &amp; care</EditLink>
          </div>
          <p className="mt-2 text-[14px] font-medium leading-[1.5] text-ink">{healthTags(x, draft.sex).join(" · ") || "Not added yet"}</p>
          {careSummary && <p className="mt-4 text-[14px] leading-[1.5] text-muted">{careSummary}</p>}
        </div>

        <hr className="mt-6 border-line" />

        <div className="mt-6">
          <div className="flex items-start justify-between gap-4">
            <h3 className="text-[21px] font-semibold leading-[1.5] text-ink">{possessive(draft.name)} story</h3>
            <EditLink href="/post/story">Edit story</EditLink>
          </div>
          <p className="mt-2.5 whitespace-pre-line text-[14px] leading-[1.5] text-muted">{draft.story.trim() || "Not added yet"}</p>
          {draft.temperament.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2" aria-label="Personality">
              {draft.temperament.map((t) => (
                <li key={t} className="rounded-full bg-sage-100 px-3 py-1 text-[12px] font-semibold text-brand">
                  {t}
                </li>
              ))}
            </ul>
          )}
          <h4 className="mt-6 text-[14px] font-semibold leading-[1.5] text-ink">Ideal home</h4>
          <p className="mt-2 whitespace-pre-line text-[14px] leading-[1.5] text-muted">{x.idealHome.trim() || "Not added yet"}</p>
          {draft.listingType === "rehoming" && (
            <>
              <h4 className="mt-6 text-[14px] font-semibold leading-[1.5] text-ink">Reason for rehoming</h4>
              <p className="mt-2 whitespace-pre-line text-[14px] leading-[1.5] text-muted">{draft.reasonForRehoming.trim() || "Not added yet"}</p>
            </>
          )}
          <p className="mt-6 text-[13px] text-muted">
            {draft.photos.length ? `${draft.photos.length} photo${draft.photos.length === 1 ? "" : "s"} · first photo is the cover` : "Using Pawhaven paw artwork"}
          </p>
        </div>
      </section>
    </PostWizard>
  );
}

function ReviewGate() {
  const { db } = useStore();
  // Checked once on mount so the page doesn't flash empty after a successful submit clears the draft.
  const [hasDraft] = useState(() => !!db.draft);
  if (!hasDraft) {
    return (
      <EmptyState
        as="h1"
        title="Nothing to review yet"
        body="Start a listing and we’ll bring you back here to check everything before it’s submitted."
        action={<ButtonLink href="/post">Post a pet</ButtonLink>}
      />
    );
  }
  return <ReviewStep />;
}

export default function PostReviewPage() {
  return (
    <PageShell>
      <RequireAuth>
        <ReviewGate />
      </RequireAuth>
    </PageShell>
  );
}
