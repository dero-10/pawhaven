"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/Button";
import { timeAgo } from "@/lib/format";
import type { Application, Pet } from "@/lib/types";
import { firstName, initials, StatusPill } from "./shared";

export type ReviewAction = "review" | "meet" | "approve" | "decline" | "message";

const show = (v: string | undefined) => (v && v.trim() ? v : "—");

/** One applicant on the owner's "Review adoption requests" screen, with expandable answers. */
export function ApplicantCard({
  app,
  pet,
  onAction,
}: {
  app: Application;
  pet: Pet;
  onAction: (action: ReviewAction, app: Application) => void;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const a = app.answers;
  const first = firstName(app.applicantName);
  const petTaken = pet.status === "adopted" && app.status !== "approved";
  const closed = app.status === "approved" || app.status === "declined" || app.status === "withdrawn";

  const details: [string, string][] = [
    ["Email", a.email],
    ["Phone", a.phone],
    ["City", a.city],
    ["Home type", a.homeType],
    ["Housing permission", show(a.housingPermission)],
    ["Yard", a.hasYard ? "Yes" : "No"],
    ["Other pets", show(a.otherPets)],
    ["Children", show(a.kids)],
    ["Time alone each day", show(a.hoursAlone)],
  ];

  return (
    <article className="rounded-[18px] border border-line bg-white p-5 sm:p-6" aria-labelledby={`${panelId}-name`}>
      <div className="flex flex-wrap items-start gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-sage-125 text-[15px] font-semibold text-brand" aria-hidden>
          {initials(app.applicantName)}
        </span>
        <div className="min-w-0 flex-1">
          <h3 id={`${panelId}-name`} className="text-[18px] font-semibold leading-[1.4] text-ink">
            {app.applicantName}
          </h3>
          <p className="mt-0.5 text-[13px] leading-[1.45] text-muted">
            {a.city} · Applied {timeAgo(app.createdAt)}
          </p>
        </div>
        <StatusPill status={app.status} />
      </div>

      <ul className="mt-4 flex flex-wrap gap-2 text-[12px] font-medium text-ink" aria-label="Highlights">
        <li className="rounded-full bg-sand-100 px-3 py-1">{a.homeType}{a.hasYard ? " with yard" : ""}</li>
        <li className="rounded-full bg-sand-100 px-3 py-1">Other pets: {show(a.otherPets)}</li>
        <li className="rounded-full bg-sand-100 px-3 py-1">Children: {show(a.kids)}</li>
        {a.hoursAlone && <li className="rounded-full bg-sand-100 px-3 py-1">Alone: {a.hoursAlone}</li>}
      </ul>

      {a.message && <p className="mt-4 text-[14px] leading-[1.55] text-ink">“{a.message}”</p>}

      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="mt-4 inline-flex items-center gap-1.5 rounded-full text-[13px] font-semibold text-brand hover:underline"
      >
        {open ? "Hide full application" : "View full application"}
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden className={`transition ${open ? "rotate-180" : ""}`}>
          <path d="M2.5 4.5L6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div id={panelId} hidden={!open} className="mt-4 rounded-[14px] bg-sage-50 p-4 sm:p-5">
        <dl className="grid gap-x-6 gap-y-3 text-[13px] sm:grid-cols-2">
          {details.map(([k, v]) => (
            <div key={k}>
              <dt className="text-muted">{k}</dt>
              <dd className="mt-0.5 break-words font-medium text-ink">{v}</dd>
            </div>
          ))}
          <div className="sm:col-span-2">
            <dt className="text-muted">Household and pet experience</dt>
            <dd className="mt-0.5 font-medium leading-[1.55] text-ink">{show(a.experience)}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-5 flex flex-wrap gap-3 border-t border-line pt-5">
        {app.status === "submitted" && !petTaken && (
          <Button size="sm" variant="secondary" onClick={() => onAction("review", app)}>
            Move to review
          </Button>
        )}
        {app.status === "in_review" && !petTaken && (
          <Button size="sm" onClick={() => onAction("meet", app)}>
            Schedule meet &amp; greet
          </Button>
        )}
        {app.status === "meet_greet" && !petTaken && (
          <Button size="sm" onClick={() => onAction("approve", app)}>
            Approve adoption
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={() => onAction("message", app)}>
          Message {first}
        </Button>
        {!closed && (
          <Button size="sm" variant="ghost" className="!text-danger hover:!bg-danger-50" onClick={() => onAction("decline", app)}>
            Decline
          </Button>
        )}
      </div>
      {petTaken && !closed && (
        <p className="mt-3 text-[12px] text-muted">{pet.name} has been adopted. Let {first} know, then decline this request to close it.</p>
      )}
    </article>
  );
}
