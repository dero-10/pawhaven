"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { EmptyState, PageHeading, PageShell, RequireAuth } from "@/components/layout/PageShell";
import { Button, ButtonLink } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { AdoptionPetArt, CheckMark, formatWhen, ownerNoun, ownerShortName, StatusPill } from "@/components/adoption/shared";
import { useStore } from "@/lib/store";
import { APP_STATUS_LABEL, APP_STEPS, formatAge } from "@/lib/format";
import type { Application, ApplicationStatus, Pet } from "@/lib/types";

const FINAL: ApplicationStatus[] = ["approved", "declined", "withdrawn"];

function stepCopy(step: ApplicationStatus, app: Application, pet: Pet) {
  const shelter = ownerNoun(pet, "shelter");
  switch (step) {
    case "submitted":
      return { title: "Request sent", body: `${formatWhen(app.createdAt)} · Your application reached the ${shelter}.` };
    case "in_review":
      return { title: pet.ownerType === "shelter" ? "Shelter review" : "Pet parent review", body: `${pet.ownerName} will review your home and lifestyle.` };
    case "meet_greet":
      return { title: "Meet & greet", body: `Arrange a safe meeting if the ${shelter} thinks it’s a fit.` };
    default:
      return { title: "Welcome home", body: `Complete the ${shelter}’s adoption process together.` };
  }
}

function ProgressTracker({ app, pet }: { app: Application; pet: Pet }) {
  const inactive = app.status === "declined" || app.status === "withdrawn";
  // The step we're waiting on: "submitted" and "in_review" both wait on the owner's review.
  const active = app.status === "approved" ? APP_STEPS.length : inactive ? 1 : Math.max(1, APP_STEPS.indexOf(app.status));
  return (
    <ol className="mt-7 space-y-[26px]" aria-label="Adoption request progress">
      {APP_STEPS.map((step, i) => {
        const done = i < active;
        const isCurrent = !inactive && i === active;
        const { title, body } = stepCopy(step, app, pet);
        return (
          <li key={step} className="flex gap-[19px]" aria-current={isCurrent ? "step" : undefined}>
            <span
              className={`grid size-[30px] shrink-0 place-items-center rounded-full text-[12px] font-semibold ${
                done ? "bg-sage-125 text-brand" : isCurrent ? "bg-sage-125 text-brand ring-2 ring-brand/40" : inactive ? "bg-sand-100 text-muted" : "bg-sage-125 text-ink"
              }`}
            >
              {done ? <CheckMark /> : i + 1}
              <span className="sr-only">{done ? " (complete)" : isCurrent ? " (current step)" : ""}</span>
            </span>
            <div className={inactive && !done ? "opacity-60" : ""}>
              <p className="text-[16px] font-semibold leading-[1.45] text-ink">{title}</p>
              <p className="mt-1 text-[13px] leading-[1.45] text-muted">{body}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function StatusNote({ app, pet }: { app: Application; pet: Pet }) {
  if (app.status === "declined") {
    return (
      <div className="mt-7 rounded-[14px] bg-danger-50 p-4 text-[13px] leading-[1.55] text-ink">
        <p className="font-semibold">This one wasn’t the right match.</p>
        <p className="mt-1 text-muted">
          {pet.ownerName} has decided to go with another home for {pet.name}. Thank you for offering yours — there are more companions waiting to meet you.
        </p>
      </div>
    );
  }
  if (app.status === "withdrawn") {
    return (
      <div className="mt-7 rounded-[14px] bg-sand-100 p-4 text-[13px] leading-[1.55] text-ink">
        <p className="font-semibold">You withdrew this request.</p>
        <p className="mt-1 text-muted">
          {pet.status === "active" ? (
            <>
              Changed your mind? You can{" "}
              <Link href={`/pets/${pet.id}/apply`} className="font-semibold text-brand hover:underline">
                apply to meet {pet.name} again
              </Link>
              .
            </>
          ) : (
            `${pet.name} is no longer accepting applications.`
          )}
        </p>
      </div>
    );
  }
  if (app.status === "approved") {
    return (
      <div className="mt-7 rounded-[14px] bg-sage-125 p-4 text-[13px] leading-[1.55] text-ink">
        <p className="font-semibold">Congratulations — you’ve been approved!</p>
        <p className="mt-1 text-muted">Message {pet.ownerName} to arrange the handover and finish the paperwork together.</p>
      </div>
    );
  }
  return null;
}

function RequestDetail({ app, pet }: { app: Application; pet: Pet }) {
  const { startConversation, setApplicationStatus } = useStore();
  const router = useRouter();
  const toast = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const canWithdraw = !FINAL.includes(app.status);

  const message = () => {
    const r = startConversation(pet.id);
    if (!r.ok) return toast(r.error, "error");
    router.push(`/messages?c=${r.data.id}`);
  };

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_408px] lg:gap-12">
      <div className="space-y-6">
        <Link
          href={`/pets/${pet.id}`}
          className="flex items-center gap-5 rounded-[18px] border border-line bg-white p-5 transition hover:border-brand"
        >
          <div className="size-[96px] shrink-0 overflow-hidden rounded-[12px] bg-sage-125">
            <AdoptionPetArt pet={pet} pawWidth={34} />
          </div>
          <div className="min-w-0">
            <p className="text-[24px] font-semibold leading-[1.3] text-ink">{pet.name}</p>
            <p className="mt-2 text-[13px] leading-[1.45] text-muted">
              {pet.breed} · {formatAge(pet.ageMonths)}
            </p>
            <p className="mt-2 text-[12px] leading-[1.45] text-muted">
              {pet.ownerName} · {pet.city}
            </p>
          </div>
        </Link>

        <section className="rounded-[18px] border border-line bg-white px-5 pb-12 pt-6 sm:px-7" aria-labelledby="request-title">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="request-title" className="text-[24px] font-semibold leading-[1.45] text-ink">
              Adoption request
            </h2>
            <StatusPill status={app.status} className="sm:min-w-[154px]" />
          </div>
          <StatusNote app={app} pet={pet} />
          <ProgressTracker app={app} pet={pet} />
        </section>
      </div>

      <aside className="space-y-6">
        <section className="rounded-[18px] border border-line bg-white p-6 sm:px-[27px] sm:py-[27px]" aria-labelledby="stay-connected">
          <h2 id="stay-connected" className="font-serif text-[28px] leading-[1.3] text-ink">
            Stay connected
          </h2>
          <p className="mt-5 max-w-[260px] text-[13px] leading-[1.6] text-muted">
            {FINAL.includes(app.status) ? `You can still message ${pet.ownerName} about ${pet.name}.` : "You can ask questions while your application is being reviewed."}
          </p>
          <div className="mt-6 space-y-[14px]">
            <Button onClick={message} className="w-full !text-[14px]">
              Message {ownerShortName(pet)}
            </Button>
            <ButtonLink href={`/pets/${pet.id}`} variant="outline" className="w-full !text-[14px] !text-brand">
              View {pet.name}’s profile
            </ButtonLink>
          </div>
          {canWithdraw && (
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className="mx-auto mt-5 block rounded-full px-3 py-1 text-[13px] text-muted hover:text-danger"
            >
              Withdraw request
            </button>
          )}
        </section>
        <p className="text-[13px] leading-[1.55] text-muted">
          Please don’t send a deposit before meeting.
          <br />
          Pawhaven does not collect adoption payments.
        </p>
      </aside>

      <ConfirmDialog
        open={confirmOpen}
        title="Withdraw your request?"
        body={`${pet.ownerName} will see that you’re no longer interested in ${pet.name}. You can apply again later if ${pet.name} is still looking for a home.`}
        confirmLabel="Withdraw request"
        cancelLabel="Keep my request"
        tone="danger"
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          setApplicationStatus(app.id, "withdrawn");
          setConfirmOpen(false);
          toast("Your request was withdrawn.", "info");
        }}
      />
    </div>
  );
}

function ApplicationsContent() {
  const { myApplications, getPet } = useStore();
  const entries = myApplications()
    .map((app) => ({ app, pet: getPet(app.petId) }))
    .filter((e): e is { app: Application; pet: Pet } => !!e.pet)
    .sort((x, y) => {
      // open requests first, then most recently updated
      const fx = FINAL.includes(x.app.status) && x.app.status !== "approved" ? 1 : 0;
      const fy = FINAL.includes(y.app.status) && y.app.status !== "approved" ? 1 : 0;
      return fx - fy || y.app.updatedAt.localeCompare(x.app.updatedAt);
    });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = entries.find((e) => e.app.id === selectedId) ?? entries[0];

  if (!selected) {
    return (
      <EmptyState
        as="h1"
        title="No adoption requests yet"
        body="When you apply to meet a pet, you’ll be able to follow every step here."
        action={<ButtonLink href="/pets">Find a pet</ButtonLink>}
      />
    );
  }

  return (
    <div className="container-page pb-14">
      <PageHeading title="Your next chapter is in motion." subtitle="Track your adoption request and keep the conversation going." />

      {entries.length > 1 && (
        <div className="-mt-2 mb-8">
          <h2 className="mb-3 text-[13px] font-semibold text-ink">Your requests ({entries.length})</h2>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Choose a request">
            {entries.map(({ app, pet }) => {
              const active = app.id === selected.app.id;
              return (
                <button
                  key={app.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSelectedId(app.id)}
                  className={`flex h-10 items-center gap-2 rounded-full border px-4 text-[14px] font-medium transition ${
                    active ? "border-brand bg-brand text-white" : "border-line bg-white text-ink hover:border-brand"
                  }`}
                >
                  {pet.name}
                  <span className={`text-[12px] ${active ? "text-sage-on-dark" : "text-muted"}`}>· {APP_STATUS_LABEL[app.status]}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <RequestDetail key={selected.app.id} app={selected.app} pet={selected.pet} />

      <ButtonLink href="/pets" variant="outline" className="mt-10 w-full !text-[14px] !text-brand sm:w-[256px]">
        Continue exploring
      </ButtonLink>
    </div>
  );
}

export default function ApplicationsPage() {
  return (
    <PageShell>
      <RequireAuth>
        <ApplicationsContent />
      </RequireAuth>
    </PageShell>
  );
}
