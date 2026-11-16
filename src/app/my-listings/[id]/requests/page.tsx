"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { EmptyState, PageHeading, PageShell, RequireAuth } from "@/components/layout/PageShell";
import { ButtonLink } from "@/components/ui/Button";
import { Label, Textarea } from "@/components/ui/Field";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { ApplicantCard, type ReviewAction } from "@/components/adoption/ApplicantCard";
import { AdoptionPetArt, firstName } from "@/components/adoption/shared";
import { useStore } from "@/lib/store";
import { APP_STATUS_LABEL, formatAge, PET_STATUS_LABEL, sexLabel } from "@/lib/format";
import type { Application, ApplicationStatus } from "@/lib/types";

type Filter = "all" | ApplicationStatus;
const FILTERS: Filter[] = ["all", "submitted", "in_review", "meet_greet", "approved", "declined", "withdrawn"];
const FILTER_LABEL = (f: Filter) => (f === "all" ? "All" : f === "submitted" ? "New" : APP_STATUS_LABEL[f]);

type Pending = { kind: "meet" | "approve" | "decline"; app: Application } | null;

function RequestsContent() {
  const { id } = useParams<{ id: string }>();
  const { getPet, currentUser, applicationsForPet, setApplicationStatus, startConversationWith, sendMessage } = useStore();
  const router = useRouter();
  const toast = useToast();
  const [filter, setFilter] = useState<Filter>("all");
  const [pending, setPending] = useState<Pending>(null);
  const [note, setNote] = useState("");
  const pet = getPet(id);

  if (!pet || pet.ownerId !== currentUser?.id) {
    return (
      <EmptyState
        as="h1"
        title="We couldn’t find that listing"
        body="You can only review adoption requests for pets you’ve listed."
        action={<ButtonLink href="/my-listings">Go to my listings</ButtonLink>}
      />
    );
  }

  const apps = [...applicationsForPet(pet.id)].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const count = (f: Filter) => (f === "all" ? apps.length : apps.filter((a) => a.status === f).length);
  const visible = filter === "all" ? apps : apps.filter((a) => a.status === filter);
  const openCount = apps.filter((a) => ["submitted", "in_review", "meet_greet"].includes(a.status)).length;

  const openConversation = (app: Application) => {
    const r = startConversationWith(pet.id, app.applicantId);
    if (!r.ok) {
      toast(r.error, "error");
      return null;
    }
    return r.data;
  };

  const onAction = (action: ReviewAction, app: Application) => {
    if (action === "message") {
      const c = openConversation(app);
      if (c) router.push(`/messages?c=${c.id}`);
      return;
    }
    if (action === "review") {
      setApplicationStatus(app.id, "in_review");
      toast(`${firstName(app.applicantName)}’s request is now in review.`);
      return;
    }
    setNote("");
    setPending({ kind: action, app });
  };

  const confirm = () => {
    if (!pending) return;
    const { kind, app } = pending;
    const name = firstName(app.applicantName);
    if (kind === "meet") {
      setApplicationStatus(app.id, "meet_greet");
      if (note.trim()) {
        const c = openConversation(app);
        if (c) {
          const r = sendMessage(c.id, note);
          if (!r.ok) toast(r.error, "error");
        }
      }
      toast(note.trim() ? `Meet & greet requested — your note was sent to ${name}.` : `${name} moved to meet & greet.`);
    } else if (kind === "approve") {
      setApplicationStatus(app.id, "approved");
      toast(`${name} approved. ${pet.name} is now marked as adopted.`);
    } else {
      setApplicationStatus(app.id, "declined");
      toast(`${name}’s request was declined.`, "info");
    }
    setPending(null);
  };

  const dialog = pending && {
    meet: {
      title: `Schedule a meet & greet with ${firstName(pending.app.applicantName)}?`,
      body: `We’ll let ${firstName(pending.app.applicantName)} know you’d like to meet. Always meet in a safe, public place or at your shelter.`,
      confirmLabel: "Schedule meet & greet",
      tone: "primary" as const,
    },
    approve: {
      title: `Approve ${firstName(pending.app.applicantName)} for ${pet.name}?`,
      body: `${pet.name} will be marked as adopted and removed from search. Make sure you’ve met in person first.`,
      confirmLabel: "Approve adoption",
      tone: "primary" as const,
    },
    decline: {
      title: `Decline ${firstName(pending.app.applicantName)}’s request?`,
      body: `${firstName(pending.app.applicantName)} will see that ${pet.name} has found a different match. This can’t be undone.`,
      confirmLabel: "Decline request",
      tone: "danger" as const,
    },
  }[pending.kind];

  return (
    <div className="container-page pb-14">
      <Link href="/my-listings" className="mt-8 inline-flex items-center gap-2 text-[13px] font-semibold text-brand hover:underline">
        <span aria-hidden>←</span> My listings
      </Link>
      <PageHeading
        eyebrow="Review adoption requests"
        title={`Who’s ready to welcome ${pet.name}?`}
        subtitle="Read each request carefully, ask questions in messages, and meet in person before deciding."
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_408px] lg:gap-12">
        <section aria-labelledby="requests-title" className="min-w-0">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="requests-title" className="text-[22px] font-semibold leading-[1.45] text-ink">
              Adoption requests
            </h2>
            <p className="text-[13px] text-muted">
              {openCount} open · {apps.length} total
            </p>
          </div>

          <div className="-mx-4 mt-4 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="group" aria-label="Filter requests by status">
            <div className="flex gap-2 pb-1 sm:flex-wrap">
              {FILTERS.filter((f) => f === "all" || f === filter || count(f) > 0).map((f) => (
                <button
                  key={f}
                  type="button"
                  aria-pressed={filter === f}
                  onClick={() => setFilter(f)}
                  className={`h-9 shrink-0 rounded-full border px-4 text-[13px] font-medium transition ${
                    filter === f ? "border-brand bg-brand text-white" : "border-line bg-white text-ink hover:border-brand"
                  }`}
                >
                  {FILTER_LABEL(f)} <span className={filter === f ? "text-sage-on-dark" : "text-muted"}>({count(f)})</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {apps.length === 0 ? (
              <div className="rounded-[18px] border border-line bg-white px-6 py-12 text-center">
                <p className="font-serif text-[22px] text-ink">No requests yet</p>
                <p className="mt-2 text-[14px] text-muted">
                  {pet.status === "active"
                    ? `When someone applies to meet ${pet.name}, you’ll see their request here.`
                    : `${pet.name}’s listing is ${PET_STATUS_LABEL[pet.status].toLowerCase()}, so new people can’t apply right now.`}
                </p>
              </div>
            ) : visible.length === 0 ? (
              <div className="rounded-[18px] border border-line bg-white px-6 py-10 text-center text-[14px] text-muted">
                No {FILTER_LABEL(filter).toLowerCase()} requests.{" "}
                <button type="button" onClick={() => setFilter("all")} className="font-semibold text-brand hover:underline">
                  Show all
                </button>
              </div>
            ) : (
              visible.map((app) => <ApplicantCard key={app.id} app={app} pet={pet} onAction={onAction} />)
            )}
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-[20px] bg-sage-125 p-6" aria-label={`${pet.name} listing summary`}>
            <div className="h-[200px] overflow-hidden rounded-[16px] bg-sage-225">
              <AdoptionPetArt pet={pet} pawWidth={80} />
            </div>
            <div className="mt-5 flex items-start justify-between gap-3">
              <h2 className="font-serif text-[30px] leading-[1.3] text-ink">{pet.name}</h2>
              <span className="mt-1.5 inline-flex h-[27px] items-center rounded-full bg-white px-3 text-[11px] font-semibold text-brand">
                {PET_STATUS_LABEL[pet.status]}
              </span>
            </div>
            <p className="mt-1 text-[14px] leading-[1.45] text-muted">
              {pet.breed} · {sexLabel(pet.sex)} · {formatAge(pet.ageMonths)}
              <br />
              {pet.city} · {pet.views} views
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:flex-col">
              <ButtonLink href={`/pets/${pet.id}`} variant="outline" className="w-full !text-[14px] !text-brand">
                View listing
              </ButtonLink>
              <ButtonLink href="/messages" variant="ghost" className="w-full !text-[14px]">
                Open messages
              </ButtonLink>
            </div>
          </section>
          <section className="rounded-[18px] bg-peach-50 p-6">
            <h2 className="font-serif text-[22px] leading-[1.3] text-ink">A match, not a transaction.</h2>
            <p className="mt-3 text-[13px] leading-[1.6] text-muted">
              Meet in person before approving anyone. Never ask for a deposit before a meeting — Pawhaven does not collect adoption payments.
            </p>
            <Link href="/safety#rehoming" className="mt-4 inline-block text-[13px] font-semibold text-brand hover:underline">
              Read our rehoming guide
            </Link>
          </section>
        </aside>
      </div>

      <ConfirmDialog
        open={!!pending}
        title={dialog?.title ?? ""}
        body={dialog?.body}
        confirmLabel={dialog?.confirmLabel}
        tone={dialog?.tone}
        onClose={() => setPending(null)}
        onConfirm={confirm}
      >
        {pending?.kind === "meet" && (
          <div>
            <Label htmlFor="meet-note" hint="Optional">
              Suggest a time and place
            </Label>
            <Textarea
              id="meet-note"
              rows={3}
              className="!min-h-[96px]"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={2000}
              placeholder="e.g. Could you meet Saturday at 10am at the Austin adoption center?"
            />
            <p className="mt-1.5 text-[12px] text-muted">If you add a note, we’ll send it to {firstName(pending.app.applicantName)} in Messages.</p>
          </div>
        )}
      </ConfirmDialog>
    </div>
  );
}

export default function ReviewRequestsPage() {
  return (
    <PageShell>
      <RequireAuth>
        <RequestsContent />
      </RequireAuth>
    </PageShell>
  );
}
