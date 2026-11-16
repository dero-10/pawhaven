"use client";

import { useState } from "react";
import { PageShell, RequireAuth } from "@/components/layout/PageShell";
import { Field, Select, Textarea } from "@/components/ui/Field";
import { FormCard, GuidanceCard, PostWizard } from "@/components/post/PostWizard";
import { MultiSelect } from "@/components/post/MultiSelect";
import { useWizardDraft } from "@/components/post/useWizardDraft";
import { focusFirstError, useWizardNav } from "@/components/post/useWizardNav";
import { COMFORT_OPTIONS, draftDetails, ENERGY_LABEL, firstIncompleteStep, hasErrors, TRI_LABEL, validateHealth, type Errors } from "@/components/post/wizard";
import type { EnergyLevel, PetDetails, TriState } from "@/lib/types";

const TRI_FIELDS = [
  { key: "vaccinated", label: "Vaccinated *" },
  { key: "spayedNeutered", label: "Spayed / neutered *" },
  { key: "microchipped", label: "Microchipped *" },
  { key: "houseTrained", label: "House trained *" },
] as const;

function HealthStep() {
  const { draft, update, flush } = useWizardDraft();
  const nav = useWizardNav(flush);
  const [errors, setErrors] = useState<Errors>({});
  const details = draftDetails(draft);

  const err = (k: string) => (errors[k] ? { "aria-invalid": true as const, "aria-describedby": `${k}-error` } : {});
  const clear = (k: string) => errors[k] && setErrors((e) => ({ ...e, [k]: undefined }));

  const setDetails = (patch: Partial<PetDetails>) => {
    const next = { ...details, ...patch };
    // Keep the legacy boolean flags in sync for listing badges/filters elsewhere.
    update({
      details: next,
      health: {
        ...draft.health,
        vaccinated: next.vaccinated === "yes",
        spayedNeutered: next.spayedNeutered === "yes",
        microchipped: next.microchipped === "yes",
      },
    });
  };

  const onContinue = () => {
    const e = validateHealth(draft);
    setErrors(e);
    if (hasErrors(e)) return focusFirstError();
    nav.go("/post/story");
  };

  return (
    <PostWizard
      step={2}
      maxReachable={firstIncompleteStep(draft) ?? 4}
      editingName={draft.editingId ? draft.name : undefined}
      onSaveExit={nav.saveExit}
      onLeave={flush}
      actions={{ backLabel: "Back", onBack: () => nav.go("/post"), continueLabel: "Continue to story & media", onContinue, onSaveDraft: nav.saveDraft }}
      aside={
        <>
          <GuidanceCard
            title={
              <>
                The right match <br className="hidden sm:block" />
                needs the full picture.
              </>
            }
          >
            Select “Unknown” when you aren’t sure. Disclose health and behavioral needs. Share veterinary records privately with a prospective adopter, not publicly.
          </GuidanceCard>
          <p className="mt-[35px] text-[12px] leading-[1.5] text-muted">Step 2 of 4 · Required fields are marked *</p>
        </>
      }
    >
      <FormCard title="Good care starts with honesty.">
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            onContinue();
          }}
          className="mt-[42px] grid gap-x-7 gap-y-6 md:grid-cols-2"
        >
          {TRI_FIELDS.map((f) => (
            <Field key={f.key} id={f.key} label={f.label} error={errors[f.key]}>
              <Select
                id={f.key}
                value={details[f.key]}
                onChange={(e) => {
                  setDetails({ [f.key]: e.target.value as TriState | "" });
                  clear(f.key);
                }}
                {...err(f.key)}
              >
                <option value="">Select</option>
                {(Object.keys(TRI_LABEL) as TriState[]).map((t) => (
                  <option key={t} value={t}>
                    {TRI_LABEL[t]}
                  </option>
                ))}
              </Select>
            </Field>
          ))}
          <Field id="goodWith" label="Comfortable with">
            <MultiSelect id="goodWith" options={COMFORT_OPTIONS} value={draft.goodWith} onChange={(v) => update({ goodWith: v })} />
          </Field>
          <Field id="energyLevel" label="Energy level *" error={errors.energyLevel}>
            <Select
              id="energyLevel"
              value={details.energyLevel}
              onChange={(e) => {
                setDetails({ energyLevel: e.target.value as EnergyLevel | "" });
                clear("energyLevel");
              }}
              {...err("energyLevel")}
            >
              <option value="">Select</option>
              {(Object.keys(ENERGY_LABEL) as EnergyLevel[]).map((t) => (
                <option key={t} value={t}>
                  {ENERGY_LABEL[t]}
                </option>
              ))}
            </Select>
          </Field>
          <div className="md:col-span-2 md:mt-1.5">
            <Field id="notes" label="Medical needs / medications *" error={errors.notes}>
              <Textarea
                id="notes"
                value={draft.health.notes}
                maxLength={600}
                className="min-h-[80px]!"
                placeholder="e.g. No known medical conditions. Routine checkups recommended."
                onChange={(e) => {
                  update({ health: { ...draft.health, notes: e.target.value } });
                  clear("notes");
                }}
                {...err("notes")}
              />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field id="behavior" label="Behavior & special care *" error={errors.behavior}>
              <Textarea
                id="behavior"
                value={details.behavior}
                maxLength={600}
                className="min-h-[76px]!"
                placeholder="e.g. Enjoys gentle play and quiet spaces. Has not lived with dogs."
                onChange={(e) => {
                  setDetails({ behavior: e.target.value });
                  clear("behavior");
                }}
                {...err("behavior")}
              />
            </Field>
          </div>
          <button type="submit" className="sr-only">
            Continue
          </button>
        </form>
      </FormCard>
    </PostWizard>
  );
}

export default function PostHealthPage() {
  return (
    <PageShell>
      <RequireAuth>
        <HealthStep />
      </RequireAuth>
    </PageShell>
  );
}
