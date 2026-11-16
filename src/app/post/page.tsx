"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageShell, RequireAuth } from "@/components/layout/PageShell";
import { Field, Input, Select } from "@/components/ui/Field";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FormCard, GuidanceCard, PostWizard } from "@/components/post/PostWizard";
import { useWizardDraft } from "@/components/post/useWizardDraft";
import { focusFirstError, useWizardNav } from "@/components/post/useWizardNav";
import { defaultAgeUnit, firstIncompleteStep, fromMonths, hasErrors, toMonths, validateBasics, type Errors } from "@/components/post/wizard";
import { useStore } from "@/lib/store";
import { SPECIES_SINGULAR } from "@/lib/format";
import type { ListingType, Sex, Size, Species } from "@/lib/types";

const parseNum = (v: string): number | "" => (v.trim() === "" ? "" : Number(v));

function BasicsStep() {
  const router = useRouter();
  const { clearDraft } = useStore();
  const { draft, update, flush, stop } = useWizardDraft();
  const nav = useWizardNav(flush);
  const [errors, setErrors] = useState<Errors>({});
  const [confirmCancel, setConfirmCancel] = useState(false);
  const unit = defaultAgeUnit(draft);
  const [ageText, setAgeText] = useState(() => String(fromMonths(draft.ageMonths, unit)));
  const editing = !!draft.editingId;

  const err = (k: string) => (errors[k] ? { "aria-invalid": true as const, "aria-describedby": `${k}-error` } : {});
  const clear = (k: string) => errors[k] && setErrors((e) => ({ ...e, [k]: undefined }));

  const setAge = (text: string, u: "months" | "years") => {
    setAgeText(text);
    update({ ageMonths: toMonths(parseNum(text), u), ageUnit: u });
    clear("age");
  };

  const onContinue = () => {
    const e = validateBasics(draft);
    setErrors(e);
    if (hasErrors(e)) return focusFirstError();
    nav.go("/post/health");
  };

  const isEmpty = !draft.name && !draft.species && !draft.breed && !draft.city && draft.ageMonths === "";
  const onCancel = () => {
    if (isEmpty && !editing) {
      stop();
      clearDraft();
      router.push("/");
      return;
    }
    setConfirmCancel(true);
  };

  const feeLabel = draft.listingType === "adoption" ? "Adoption fee (USD)" : "Rehoming fee (USD)";

  return (
    <>
      <PostWizard
        step={1}
        maxReachable={firstIncompleteStep(draft) ?? 4}
        editingName={editing ? draft.name : undefined}
        onSaveExit={nav.saveExit}
        onLeave={flush}
        actions={{ backLabel: "Cancel", onBack: onCancel, continueLabel: "Continue to health & care", onContinue, onSaveDraft: nav.saveDraft }}
        aside={
          <>
            <GuidanceCard title="Their welfare comes first.">
              Post only a pet you legally own or represent. Be transparent about needs and fees. Never list wildlife or endangered animals.
            </GuidanceCard>
            <p className="mt-[35px] text-[12px] leading-[1.5] text-muted">Step 1 of 4 · Required fields are marked *</p>
          </>
        }
      >
        <FormCard title="Let’s start with the basics.">
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              onContinue();
            }}
            className="mt-[38px] grid gap-x-7 gap-y-6 md:grid-cols-2"
          >
            <Field id="name" label="Pet name *" error={errors.name}>
              <Input
                id="name"
                value={draft.name}
                maxLength={60}
                autoComplete="off"
                placeholder="e.g. Finn"
                onChange={(e) => {
                  update({ name: e.target.value });
                  clear("name");
                }}
                {...err("name")}
              />
            </Field>
            <Field id="species" label="Pet type *" error={errors.species}>
              <Select
                id="species"
                value={draft.species}
                onChange={(e) => {
                  update({ species: e.target.value as Species | "" });
                  clear("species");
                }}
                {...err("species")}
              >
                <option value="">Select</option>
                {(Object.keys(SPECIES_SINGULAR) as Species[]).map((s) => (
                  <option key={s} value={s}>
                    {SPECIES_SINGULAR[s]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field id="breed" label="Breed / mix *" error={errors.breed}>
              <Input
                id="breed"
                value={draft.breed}
                maxLength={80}
                placeholder="e.g. Domestic shorthair"
                onChange={(e) => {
                  update({ breed: e.target.value });
                  clear("breed");
                }}
                {...err("breed")}
              />
            </Field>
            <Field id="sex" label="Sex *" error={errors.sex}>
              <Select
                id="sex"
                value={draft.sex}
                onChange={(e) => {
                  update({ sex: e.target.value as Sex | "" });
                  clear("sex");
                }}
                {...err("sex")}
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-5">
              <Field id="age" label="Age *" error={errors.age}>
                <Input
                  id="age"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step={unit === "years" ? 0.5 : 1}
                  value={ageText}
                  placeholder="e.g. 1"
                  onChange={(e) => setAge(e.target.value, unit)}
                  {...err("age")}
                />
              </Field>
              <Field id="ageUnit" label="Age unit *">
                <Select id="ageUnit" value={unit} onChange={(e) => setAge(ageText, e.target.value as "months" | "years")}>
                  <option value="months">Months</option>
                  <option value="years">Years</option>
                </Select>
              </Field>
            </div>
            <Field id="size" label="Size *" error={errors.size}>
              <Select
                id="size"
                value={draft.size}
                onChange={(e) => {
                  update({ size: e.target.value as Size | "" });
                  clear("size");
                }}
                {...err("size")}
              >
                <option value="">Select</option>
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </Select>
            </Field>
            <Field id="listingType" label="Listing type *">
              <Select id="listingType" value={draft.listingType} onChange={(e) => update({ listingType: e.target.value as ListingType })}>
                <option value="rehoming">Responsible rehoming</option>
                <option value="adoption">Shelter or rescue adoption</option>
              </Select>
            </Field>
            <Field id="fee" label={feeLabel} error={errors.fee}>
              <Input
                id="fee"
                type="number"
                inputMode="numeric"
                min={0}
                max={1000}
                value={draft.fee}
                placeholder="0 for free"
                onChange={(e) => {
                  update({ fee: parseNum(e.target.value) });
                  clear("fee");
                }}
                {...err("fee")}
              />
            </Field>
            <div className="md:col-span-2">
              <Field id="city" label="City / ZIP code *" error={errors.city}>
                <Input
                  id="city"
                  value={draft.city}
                  maxLength={80}
                  autoComplete="address-level2"
                  placeholder="e.g. Austin, TX 78704"
                  aria-describedby={errors.city ? "city-error city-hint" : "city-hint"}
                  aria-invalid={errors.city ? true : undefined}
                  onChange={(e) => {
                    update({ city: e.target.value });
                    clear("city");
                  }}
                />
              </Field>
              <p id="city-hint" className="mt-3 text-[12px] leading-[1.5] text-muted">
                Only your city is public. Your exact address is never displayed.
              </p>
            </div>
            <button type="submit" className="sr-only">
              Continue
            </button>
          </form>
        </FormCard>
      </PostWizard>

      <ConfirmDialog
        open={confirmCancel}
        title={editing ? "Discard your changes?" : "Discard this listing?"}
        body={editing ? "Your live listing stays exactly as it was. Any edits you’ve made here will be lost." : "Everything you’ve entered so far will be deleted. You can also save it as a draft and finish later."}
        confirmLabel={editing ? "Discard changes" : "Discard listing"}
        cancelLabel="Keep editing"
        tone="danger"
        onClose={() => setConfirmCancel(false)}
        onConfirm={() => {
          stop();
          clearDraft();
          setConfirmCancel(false);
          router.push(editing ? "/my-listings" : "/");
        }}
      />
    </>
  );
}

export default function PostBasicsPage() {
  return (
    <PageShell>
      <RequireAuth>
        <BasicsStep />
      </RequireAuth>
    </PageShell>
  );
}
