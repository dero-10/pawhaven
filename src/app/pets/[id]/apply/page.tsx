"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { EmptyState, LoadingBlock, PageShell, RequireAuth } from "@/components/layout/PageShell";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Field, FieldError, Input, Select, Textarea } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { AdoptionPetArt, isOpenApplication, ownerNoun } from "@/components/adoption/shared";
import { useStore } from "@/lib/store";
import { formatAge, sexLabel } from "@/lib/format";
import type { Application, Pet } from "@/lib/types";

type Answers = Application["answers"];
type Errors = Partial<Record<keyof Answers | "agreeCare" | "agreeShare", string>>;

const HOME_TYPES = ["House", "Apartment", "Townhouse", "Other"];
const HOUSING_PERMISSION = ["I own my home", "I rent and pets are allowed", "I rent and will confirm with my landlord", "I live with family", "Other"];
const HOURS_ALONE = ["Under 4 hours", "4–8 hours", "8+ hours"];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(a: Answers, agreeCare: boolean, agreeShare: boolean): Errors {
  const e: Errors = {};
  if (!a.fullName.trim()) e.fullName = "Please enter your full name.";
  if (!a.email.trim()) e.email = "Please enter your email address.";
  else if (!EMAIL_RE.test(a.email.trim())) e.email = "Please enter a valid email address.";
  if (!a.phone.trim()) e.phone = "Please enter a phone number.";
  else if (a.phone.replace(/\D/g, "").length < 7) e.phone = "Please enter a valid phone number.";
  if (!a.city.trim()) e.city = "Please enter your city and ZIP code.";
  if (!a.homeType) e.homeType = "Please choose your home type.";
  if (!a.housingPermission) e.housingPermission = "Please tell us about your housing permission.";
  if (!a.hoursAlone) e.hoursAlone = "Please choose how long a pet would be alone.";
  if (a.experience.trim().length < 20) e.experience = "Please share a little more about your household (20+ characters).";
  if (!agreeCare) e.agreeCare = "Please confirm you can provide ongoing care.";
  if (!agreeShare) e.agreeShare = "Please agree to share your application details.";
  return e;
}

const FIELD_ORDER: (keyof Errors)[] = ["fullName", "email", "phone", "city", "homeType", "housingPermission", "hoursAlone", "experience", "agreeCare", "agreeShare"];

function PetSummary({ pet }: { pet: Pet }) {
  const noun = ownerNoun(pet);
  return (
    <aside className="rounded-[20px] bg-sage-125 p-6" aria-label={`${pet.name} application summary`}>
      <div className="relative h-[230px] overflow-hidden rounded-[16px] bg-sage-225">
        <AdoptionPetArt pet={pet} pawWidth={90} className="pb-6" />
        {!pet.photos[0] && (
          <p className="absolute inset-x-0 bottom-[19px] text-center text-[11px] font-semibold uppercase leading-[1.45] text-brand">{pet.name}</p>
        )}
      </div>
      <div className="px-1 pt-7">
        <h2 className="font-serif text-[32px] leading-[1.45] text-ink">{pet.name}</h2>
        <p className="mt-1 text-[14px] leading-[1.45] text-muted">
          {pet.breed} · {sexLabel(pet.sex)} · {formatAge(pet.ageMonths)}
          <br />
          {pet.ownerName} · {pet.city}
        </p>
        <h3 className="mt-9 text-[20px] font-semibold leading-[1.45] text-ink">What happens next?</h3>
        <ol className="mt-3 space-y-[19px] text-[13px] leading-[1.45] text-muted">
          <li>1. The {noun} reviews your application.</li>
          <li>2. You’ll hear back in your messages.</li>
          <li>3. Arrange a safe in-person meeting.</li>
        </ol>
        <p className="mt-[19px] text-[13px] leading-[1.45] text-muted">An application is not an adoption guarantee.</p>
      </div>
    </aside>
  );
}

function ApplyForm({ pet, onSent }: { pet: Pet; onSent: () => void }) {
  const { currentUser, getApplicationDraft, saveApplicationDraft, submitApplication } = useStore();
  const router = useRouter();
  const toast = useToast();
  const draft = getApplicationDraft(pet.id);

  const [a, setA] = useState<Answers>(
    () =>
      draft ?? {
        fullName: currentUser?.name ?? "",
        email: currentUser?.email ?? "",
        phone: currentUser?.phone ?? "",
        city: currentUser?.city ?? "",
        homeType: "",
        housingPermission: "",
        hasYard: false,
        otherPets: "",
        kids: "",
        experience: "",
        hoursAlone: "",
        message: "",
      },
  );
  const [agreeCare, setAgreeCare] = useState(false);
  const [agreeShare, setAgreeShare] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);

  const noun = ownerNoun(pet);

  const set = <K extends keyof Answers>(k: K, v: Answers[K]) => {
    const next = { ...a, [k]: v };
    setA(next);
    if (submitted) setErrors(validate(next, agreeCare, agreeShare));
  };
  const setAgree = (which: "care" | "share", v: boolean) => {
    if (which === "care") setAgreeCare(v);
    else setAgreeShare(v);
    if (submitted) setErrors(validate(a, which === "care" ? v : agreeCare, which === "share" ? v : agreeShare));
  };

  const err = (k: keyof Errors) => ({
    "aria-invalid": errors[k] ? true : undefined,
    "aria-describedby": errors[k] ? `${k}-error` : undefined,
  });

  const onSubmit = (ev: FormEvent) => {
    ev.preventDefault();
    setSubmitted(true);
    const e = validate(a, agreeCare, agreeShare);
    setErrors(e);
    const first = FIELD_ORDER.find((k) => e[k]);
    if (first) {
      document.getElementById(first)?.focus();
      toast("Please check the highlighted fields.", "error");
      return;
    }
    setBusy(true);
    const clean: Answers = {
      ...a,
      fullName: a.fullName.trim(),
      email: a.email.trim(),
      phone: a.phone.trim(),
      city: a.city.trim(),
      otherPets: a.otherPets.trim(),
      kids: a.kids.trim(),
      experience: a.experience.trim(),
      message: a.message.trim(),
    };
    const r = submitApplication(pet.id, clean);
    if (!r.ok) {
      setBusy(false);
      toast(r.error, "error");
      return;
    }
    onSent();
    saveApplicationDraft(pet.id, null);
    router.push(`/pets/${pet.id}/apply/sent`);
  };

  const onSaveDraft = () => {
    const r = saveApplicationDraft(pet.id, a);
    toast(r.ok ? "Draft saved. You can finish your application any time." : r.error, r.ok ? "success" : "error");
  };

  return (
    <form noValidate onSubmit={onSubmit} className="rounded-[20px] border border-line bg-white p-5 sm:p-[27px]" aria-labelledby="apply-form-title">
      <h2 id="apply-form-title" className="text-[22px] font-semibold leading-[1.45] text-ink">
        Your details &amp; home
      </h2>
      {draft && <p className="mt-1 text-[13px] text-muted">We restored your saved draft.</p>}

      <div className="mt-5 grid gap-x-6 gap-y-5 md:grid-cols-2">
        <Field id="fullName" label="Full name" error={errors.fullName}>
          <Input id="fullName" autoComplete="name" placeholder="Alex Morgan" value={a.fullName} onChange={(e) => set("fullName", e.target.value)} {...err("fullName")} />
        </Field>
        <Field id="email" label="Email address" error={errors.email}>
          <Input id="email" type="email" autoComplete="email" placeholder="alex@example.com" value={a.email} onChange={(e) => set("email", e.target.value)} {...err("email")} />
        </Field>
        <Field id="phone" label="Phone number" error={errors.phone}>
          <Input id="phone" type="tel" autoComplete="tel" placeholder="(512) 555-0142" value={a.phone} onChange={(e) => set("phone", e.target.value)} {...err("phone")} />
        </Field>
        <Field id="city" label="City and ZIP code" error={errors.city}>
          <Input id="city" autoComplete="address-level2" placeholder="Austin, TX 78701" value={a.city} onChange={(e) => set("city", e.target.value)} {...err("city")} />
        </Field>
        <Field id="homeType" label="Home type" error={errors.homeType}>
          <Select id="homeType" value={a.homeType} onChange={(e) => set("homeType", e.target.value)} {...err("homeType")}>
            <option value="">Choose…</option>
            {HOME_TYPES.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </Select>
        </Field>
        <Field id="housingPermission" label="Housing permission" error={errors.housingPermission}>
          <Select id="housingPermission" value={a.housingPermission ?? ""} onChange={(e) => set("housingPermission", e.target.value)} {...err("housingPermission")}>
            <option value="">Choose…</option>
            {HOUSING_PERMISSION.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </Select>
        </Field>
        <Field id="hasYard" label="Do you have a yard?">
          <Select id="hasYard" value={a.hasYard ? "yes" : "no"} onChange={(e) => set("hasYard", e.target.value === "yes")}>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </Select>
        </Field>
        <Field id="hoursAlone" label="Hours a pet would be alone each day" error={errors.hoursAlone}>
          <Select id="hoursAlone" value={a.hoursAlone} onChange={(e) => set("hoursAlone", e.target.value)} {...err("hoursAlone")}>
            <option value="">Choose…</option>
            {HOURS_ALONE.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </Select>
        </Field>
        <Field id="otherPets" label="Other pets at home" hint="Optional">
          <Input id="otherPets" placeholder="e.g. One senior cat" value={a.otherPets} onChange={(e) => set("otherPets", e.target.value)} />
        </Field>
        <Field id="kids" label="Children at home" hint="Optional">
          <Input id="kids" placeholder="e.g. None" value={a.kids} onChange={(e) => set("kids", e.target.value)} />
        </Field>
        <div className="md:col-span-2">
          <Field id="experience" label="Tell us about your household and pet experience" error={errors.experience}>
            <Textarea
              id="experience"
              rows={3}
              className="!min-h-[98px]"
              placeholder="Two adults, no children. We have a secure yard and experience caring for dogs. We can offer daily walks and a calm routine."
              value={a.experience}
              onChange={(e) => set("experience", e.target.value)}
              {...err("experience")}
            />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field id="message" label={`A note for ${pet.ownerName}`} hint="Optional">
            <Textarea id="message" rows={2} className="!min-h-[80px]" placeholder={`What made you fall for ${pet.name}?`} value={a.message} onChange={(e) => set("message", e.target.value)} maxLength={1000} />
          </Field>
        </div>
      </div>

      <fieldset className="mt-6 space-y-2">
        <legend className="sr-only">Agreements</legend>
        <div>
          <label className="flex cursor-pointer items-start gap-2.5 text-[12px] leading-[1.45] text-ink">
            <input
              id="agreeCare"
              type="checkbox"
              checked={agreeCare}
              onChange={(e) => setAgree("care", e.target.checked)}
              className="mt-px size-4 shrink-0 accent-brand"
              {...err("agreeCare")}
            />
            I can provide ongoing care and meet the {noun}’s adoption requirements.
          </label>
          <FieldError id="agreeCare-error">{errors.agreeCare}</FieldError>
        </div>
        <div>
          <label className="flex cursor-pointer items-start gap-2.5 text-[12px] leading-[1.45] text-ink">
            <input
              id="agreeShare"
              type="checkbox"
              checked={agreeShare}
              onChange={(e) => setAgree("share", e.target.checked)}
              className="mt-px size-4 shrink-0 accent-brand"
              {...err("agreeShare")}
            />
            I agree my application details will be shared with {pet.ownerName}.
          </label>
          <FieldError id="agreeShare-error">{errors.agreeShare}</FieldError>
        </div>
      </fieldset>

      <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:gap-5">
        <Button type="submit" disabled={busy} className="w-full sm:w-[330px] !text-[14px]">
          {busy ? "Sending…" : "Send application"}
        </Button>
        <Button type="button" variant="outline" onClick={onSaveDraft} className="w-full !text-[14px] !text-brand sm:w-[220px]">
          Save draft
        </Button>
      </div>
    </form>
  );
}

function ApplyContent() {
  const { id } = useParams<{ id: string }>();
  const { getPet, currentUser, myApplications } = useStore();
  const [sent, setSent] = useState(false);
  const pet = getPet(id);

  // After a successful submit the "already applied" guard would flash before navigation.
  if (sent) return <LoadingBlock label="Sending your application…" />;
  if (!pet || pet.status !== "active") {
    return (
      <EmptyState
        as="h1"
        title="This pet isn’t available right now"
        body={pet?.status === "adopted" ? `${pet.name} has already found a home.` : "The listing may have been paused or removed. There are plenty of companions still waiting to meet you."}
        action={<ButtonLink href="/pets">Find a pet</ButtonLink>}
      />
    );
  }
  if (pet.ownerId === currentUser?.id) {
    return (
      <EmptyState
        as="h1"
        title="This is your listing"
        body={`You can’t apply for ${pet.name}, but you can review the people who have.`}
        action={<ButtonLink href={`/my-listings/${pet.id}/requests`}>Review requests</ButtonLink>}
        secondary={<Link href={`/pets/${pet.id}`} className="text-[14px] font-semibold text-brand">View listing</Link>}
      />
    );
  }
  const existing = myApplications().find((x) => x.petId === pet.id && isOpenApplication(x));
  if (existing) {
    return (
      <EmptyState
        as="h1"
        title={`You’ve already applied to meet ${pet.name}`}
        body={`${pet.ownerName} has your application. You can follow its progress any time.`}
        action={<ButtonLink href="/applications">Track your request</ButtonLink>}
        secondary={<Link href={`/pets/${pet.id}`} className="text-[14px] font-semibold text-brand">Back to {pet.name}’s profile</Link>}
      />
    );
  }

  return (
    <div className="container-page pb-14 pt-10">
      <p className="text-[11px] font-semibold uppercase leading-[1.45] text-brand">A thoughtful first hello</p>
      <h1 className="mt-2 font-serif text-[34px] leading-[1.45] text-ink md:text-[40px]">Apply to meet {pet.name}.</h1>
      <p className="mt-1 text-[15px] leading-[1.45] text-muted">
        Share a little about your home. {pet.ownerName} will review your application before arranging a meeting.
      </p>
      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_440px]">
        <ApplyForm pet={pet} onSent={() => setSent(true)} />
        <PetSummary pet={pet} />
      </div>
    </div>
  );
}

export default function ApplyPage() {
  return (
    <PageShell>
      <RequireAuth>
        <ApplyContent />
      </RequireAuth>
    </PageShell>
  );
}
