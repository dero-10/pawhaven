"use client";

import { useState } from "react";
import { PageShell, RequireAuth } from "@/components/layout/PageShell";
import { Chip, Field, Label, Textarea } from "@/components/ui/Field";
import { FormCard, GuidanceCard, PostWizard } from "@/components/post/PostWizard";
import { PhotoUploader } from "@/components/post/PhotoUploader";
import { useWizardDraft } from "@/components/post/useWizardDraft";
import { focusFirstError, useWizardNav } from "@/components/post/useWizardNav";
import { draftDetails, firstIncompleteStep, hasErrors, possessive, pronoun, TEMPERAMENT_OPTIONS, validateStory, type Errors } from "@/components/post/wizard";

function StoryStep() {
  const { draft, update, flush } = useWizardDraft();
  const nav = useWizardNav(flush);
  const [errors, setErrors] = useState<Errors>({});
  const details = draftDetails(draft);
  const name = draft.name.trim() || "your pet";
  const rehoming = draft.listingType === "rehoming";

  const err = (k: string) => (errors[k] ? { "aria-invalid": true as const, "aria-describedby": `${k}-error` } : {});
  const clear = (k: string) => errors[k] && setErrors((e) => ({ ...e, [k]: undefined }));

  const onContinue = () => {
    const e = validateStory(draft);
    setErrors(e);
    if (hasErrors(e)) return focusFirstError();
    nav.go("/post/review");
  };

  const toggleTrait = (t: string) =>
    update({ temperament: draft.temperament.includes(t) ? draft.temperament.filter((x) => x !== t) : [...draft.temperament, t] });

  return (
    <PostWizard
      step={3}
      maxReachable={firstIncompleteStep(draft) ?? 4}
      editingName={draft.editingId ? draft.name : undefined}
      onSaveExit={nav.saveExit}
      onLeave={flush}
      actions={{ backLabel: "Back", onBack: () => nav.go("/post/health"), continueLabel: "Review listing", onContinue, onSaveDraft: nav.saveDraft }}
      aside={
        <>
          <GuidanceCard title="The small details matter.">
            Share routines, personality, and what helps your pet feel safe. Keep phone numbers, addresses, and private health records out of the public description.
          </GuidanceCard>
          <p className="mt-[35px] text-[12px] leading-[1.5] text-muted">Step 3 of 4 · Required fields are marked *</p>
        </>
      }
    >
      <FormCard title={`Let ${possessive(draft.name)} personality shine.`}>
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            onContinue();
          }}
          className="mt-[36px] space-y-[30px]"
        >
          <Field id="story" label={`About ${draft.name.trim() || "your pet"} *`} hint={`${draft.story.trim().length}/1200`} error={errors.story}>
            <Textarea
              id="story"
              value={draft.story}
              maxLength={1200}
              placeholder={`What is ${name} like? Favourite spots, games, routines…`}
              className="min-h-[100px]!"
              onChange={(e) => {
                update({ story: e.target.value });
                clear("story");
              }}
              {...err("story")}
            />
          </Field>

          <div>
            <Label>Personality</Label>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Personality traits">
              {TEMPERAMENT_OPTIONS.map((t) => (
                <Chip key={t} selected={draft.temperament.includes(t)} onClick={() => toggleTrait(t)}>
                  {t}
                </Chip>
              ))}
            </div>
          </div>

          <Field id="idealHome" label={`${pronoun(draft.sex)} ideal home *`} error={errors.idealHome}>
            <Textarea
              id="idealHome"
              value={details.idealHome}
              maxLength={600}
              placeholder="e.g. A calm indoor home with someone who can make time for play."
              className="min-h-[86px]!"
              onChange={(e) => {
                update({ details: { ...details, idealHome: e.target.value } });
                clear("idealHome");
              }}
              {...err("idealHome")}
            />
          </Field>

          {rehoming && (
            <Field id="reason" label="Reason for rehoming *" error={errors.reason}>
              <Textarea
                id="reason"
                value={draft.reasonForRehoming}
                maxLength={400}
                placeholder="e.g. My housing circumstances have changed. I’m looking for a stable, loving home."
                className="min-h-[79px]!"
                onChange={(e) => {
                  update({ reasonForRehoming: e.target.value });
                  clear("reason");
                }}
                {...err("reason")}
              />
            </Field>
          )}

          <div className="pt-1">
            <PhotoUploader photos={draft.photos} petName={draft.name} onChange={(photos) => update({ photos })} />
          </div>

          <button type="submit" className="sr-only">
            Continue
          </button>
        </form>
      </FormCard>
    </PostWizard>
  );
}

export default function PostStoryPage() {
  return (
    <PageShell>
      <RequireAuth>
        <StoryStep />
      </RequireAuth>
    </PageShell>
  );
}
