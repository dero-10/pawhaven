"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChecklistRow, NoteDialog, QueueItem, StatCard } from "@/components/admin/ModerationParts";
import { PageShell, RequireAuth } from "@/components/layout/PageShell";
import { REPORT_REASON_LABEL } from "@/components/messages/reportReasons";
import { PetArt } from "@/components/pets/PetCard";
import { Dialog } from "@/components/states/Dialog";
import { StateCard } from "@/components/states/StateCard";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { formatAge, formatDate, LISTING_TYPE_LABEL, PET_STATUS_LABEL, sexLabel, SPECIES_SINGULAR, timeAgo } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { Pet, Report } from "@/lib/types";

const CHECKLIST = [
  "Ownership statement provided",
  "Health and behavior details disclosed",
  "Listing complies with animal welfare rules",
  "No private contact information in public text",
] as const;

/** Pre-fills the review checklist from what we can detect automatically; moderators can override. */
function autoChecks(p: Pet): boolean[] {
  const text = `${p.story} ${p.reasonForRehoming ?? ""}`;
  const contact = /[\w.+-]+@[\w-]+\.\w+|\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/.test(text);
  const welfare = p.fee <= 500 && p.ageMonths >= 2 && !/deposit|ship|shipping|several|litter/i.test(text);
  const disclosed = p.story.trim().length >= 40 && p.temperament.length > 0;
  return [true, disclosed, welfare, !contact];
}

const isToday = (iso?: string) => !!iso && new Date(iso).toDateString() === new Date().toDateString();

const panel = "rounded-[16px] border border-field bg-white";

function Workspace() {
  const { db, getPet, getUser, setPetStatus, deletePet, setReportStatus } = useStore();
  const toast = useToast();

  const [tab, setTab] = useState<"listings" | "reports">("listings");
  const [reportFilter, setReportFilter] = useState<"open" | "all">("open");
  const [petId, setPetId] = useState<string | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const [checks, setChecks] = useState<Record<string, boolean[]>>({});
  const [checklistError, setChecklistError] = useState("");
  const [dialog, setDialog] = useState<null | "changes" | "reject" | "remove" | "pause">(null);
  const [sessionReviews, setSessionReviews] = useState(0);

  const pending = useMemo(
    () => db.pets.filter((p) => p.status === "pending_review").sort((a, b) => a.updatedAt.localeCompare(b.updatedAt)),
    [db.pets],
  );
  const openReports = db.reports.filter((r) => r.status === "open");
  const reports = (reportFilter === "open" ? openReports : db.reports).slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const reviewedToday =
    db.pets.filter((p) => p.moderationNote !== undefined && isToday(p.updatedAt) && p.status !== "pending_review").length + sessionReviews;

  const pet = pending.find((p) => p.id === petId) ?? pending[0];
  const report = reports.find((r) => r.id === reportId) ?? reports[0];
  const petChecks = pet ? (checks[pet.id] ?? autoChecks(pet)) : [];

  const nextPending = (doneId: string) => pending.find((p) => p.id !== doneId)?.id ?? null;
  const owner = pet ? getUser(pet.ownerId) : undefined;

  // ---- listing actions
  const approve = () => {
    if (!pet) return;
    if (petChecks.some((c) => !c)) {
      setChecklistError("Complete the review checklist before approving, or request changes instead.");
      return;
    }
    setPetStatus(pet.id, "active", "");
    toast(`${pet.name} is now live.`);
    setChecklistError("");
    setPetId(nextPending(pet.id));
  };
  const requestChanges = (note: string) => {
    if (!pet) return;
    setPetStatus(pet.id, "rejected", note);
    toast(`Changes requested for ${pet.name}.`, "info");
    setDialog(null);
    setPetId(nextPending(pet.id));
  };
  const reject = (note: string) => {
    if (!pet) return;
    setPetStatus(pet.id, "rejected", `Rejected: ${note}`);
    toast(`${pet.name} was rejected.`, "info");
    setDialog(null);
    setPetId(nextPending(pet.id));
  };

  // ---- report actions
  const reportPet = report?.targetType === "pet" ? getPet(report.targetId) : undefined;
  const decideReport = (r: Report, status: Report["status"]) => {
    setReportStatus(r.id, status);
    if (status !== "open") setSessionReviews((n) => n + 1);
    toast(status === "resolved" ? "Report resolved." : status === "dismissed" ? "Report dismissed." : "Report reopened.", status === "resolved" ? "success" : "info");
    if (reportFilter === "open" && status !== "open") setReportId(openReports.find((x) => x.id !== r.id)?.id ?? null);
  };

  const removeTarget = pet && tab === "listings" ? pet : reportPet;

  return (
    <>
      <div className="grid gap-[30px] sm:grid-cols-3">
        <StatCard label="Pending listings" value={pending.length} />
        <StatCard label="Open reports" value={openReports.length} />
        <StatCard label="Reviewed today" value={reviewedToday} />
      </div>

      <div className="mt-8 flex gap-2" role="tablist" aria-label="Moderation queues">
        {(["listings", "reports"] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`h-10 rounded-full px-5 text-[14px] font-semibold transition ${tab === t ? "bg-brand text-white" : "bg-white text-ink ring-1 ring-field hover:ring-brand"}`}
          >
            {t === "listings" ? `Listings (${pending.length})` : `Reports (${openReports.length})`}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-7 lg:grid-cols-[384px_minmax(0,1fr)]" role="tabpanel">
        {/* Queue */}
        <section aria-labelledby="queue-heading" className={`${panel} flex flex-col px-[14px] pb-6 pt-6 lg:min-h-[652px]`}>
          <div className="flex items-center justify-between gap-3 px-[10px]">
            <h2 id="queue-heading" className="text-[22px] font-semibold leading-[1.45] text-ink">
              {tab === "listings" ? `Pending listings (${pending.length})` : `${reportFilter === "open" ? "Open reports" : "All reports"} (${reports.length})`}
            </h2>
            {tab === "reports" && (
              <select
                aria-label="Filter reports"
                value={reportFilter}
                onChange={(e) => setReportFilter(e.target.value as "open" | "all")}
                className="h-9 rounded-full border border-field bg-white px-3 text-[13px] text-ink"
              >
                <option value="open">Open</option>
                <option value="all">All</option>
              </select>
            )}
          </div>
          <ul className="mt-[31px] flex flex-col gap-[18px]">
            {tab === "listings"
              ? pending.map((p) => (
                  <li key={p.id}>
                    <QueueItem
                      title={p.name}
                      meta={`${p.ownerName} · ${LISTING_TYPE_LABEL[p.listingType]}`}
                      status={p.moderationNote ? "Resubmitted" : "Awaiting review"}
                      active={pet?.id === p.id}
                      onClick={() => { setPetId(p.id); setChecklistError(""); }}
                    />
                  </li>
                ))
              : reports.map((r) => {
                  const target = r.targetType === "pet" ? getPet(r.targetId)?.name : r.targetType === "user" ? getUser(r.targetId)?.name : "Conversation";
                  return (
                    <li key={r.id}>
                      <QueueItem
                        title={REPORT_REASON_LABEL[r.reason]}
                        meta={`${r.targetType === "pet" ? "Listing" : r.targetType === "user" ? "Member" : "Message"} · ${target ?? "Removed"} · ${timeAgo(r.createdAt)}`}
                        status={r.status === "open" ? "Open" : r.status === "resolved" ? "Resolved" : "Dismissed"}
                        tone={r.status === "open" ? "warning" : "done"}
                        active={report?.id === r.id}
                        onClick={() => setReportId(r.id)}
                      />
                    </li>
                  );
                })}
          </ul>
          {((tab === "listings" && pending.length === 0) || (tab === "reports" && reports.length === 0)) && (
            <p className="px-[10px] py-10 text-center text-[14px] text-muted">All caught up. Nothing waiting for review.</p>
          )}
          <div className="mt-auto px-[10px] pt-8">
            <Button variant="outline" className="w-full border-field !text-[14px] !text-brand" onClick={() => setTab(tab === "listings" ? "reports" : "listings")}>
              {tab === "listings" ? "View reported content" : "View pending listings"}
            </Button>
          </div>
        </section>

        {/* Detail */}
        {tab === "listings" ? (
          pet ? (
            <section aria-labelledby="review-heading" className={`${panel} px-6 pb-7 pt-6 sm:px-7`}>
              <h2 id="review-heading" className="font-serif text-[28px] leading-[1.4] text-ink sm:text-[32px]">{pet.name} · Listing review</h2>
              <p className="mt-2 text-[13px] leading-[1.5] text-muted">
                {pet.ownerName} · {owner?.emailVerified ? "Email verified" : "Email not verified"} · {pet.city}
              </p>
              <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:gap-[26px]">
                <div className="h-[126px] w-[134px] shrink-0 overflow-hidden rounded-[14px]">
                  <PetArt pet={pet} pawSize={54} />
                </div>
                <div className="min-w-0">
                  <p className="text-[16px] font-semibold leading-[1.5] text-ink">
                    {SPECIES_SINGULAR[pet.species]} · {pet.breed} · {formatAge(pet.ageMonths)} · {sexLabel(pet.sex)}
                  </p>
                  <p className="mt-4 text-[14px] leading-[1.5] text-ink">
                    {pet.listingType === "rehoming" ? "Responsible rehoming" : "Adoption"} · {pet.fee === 0 ? "No fee" : `$${pet.fee} fee`}
                  </p>
                  <p className="mt-4 text-[12px] leading-[1.5] text-muted">
                    {pet.photos.length ? `${pet.photos.length} photo${pet.photos.length === 1 ? "" : "s"}` : "No photos · Paw artwork selected"} · Submitted {timeAgo(pet.updatedAt)}
                  </p>
                </div>
              </div>
              <blockquote className="mt-5 rounded-[12px] bg-sand-50 px-4 py-3 text-[13px] leading-[1.55] text-muted">
                “{pet.story}”
                {pet.reasonForRehoming && <span className="mt-2 block">Reason for rehoming: {pet.reasonForRehoming}</span>}
                {pet.moderationNote && <span className="mt-2 block text-warning">Previous note: {pet.moderationNote}</span>}
              </blockquote>

              <h3 className="mt-7 text-[18px] font-semibold leading-[1.5] text-ink">Review checklist</h3>
              <div className="mt-4 flex flex-col gap-[19px]">
                {CHECKLIST.map((label, i) => (
                  <ChecklistRow
                    key={label}
                    id={`check-${i}`}
                    label={label}
                    checked={petChecks[i]}
                    onChange={(v) => {
                      setChecklistError("");
                      setChecks((c) => ({ ...c, [pet.id]: petChecks.map((x, j) => (j === i ? v : x)) }));
                    }}
                  />
                ))}
              </div>
              {checklistError && <p role="alert" className="mt-4 text-[13px] text-danger">{checklistError}</p>}

              <Link href={`/pets/${pet.id}`} target="_blank" className="mt-[30px] inline-block text-[13px] font-semibold text-brand hover:underline">
                Open full listing&nbsp;&nbsp;↗
              </Link>

              <div className="mt-8 flex flex-col gap-[18px] sm:flex-row sm:flex-wrap sm:items-center">
                <Button onClick={approve} className="!text-[14px] sm:w-[254px]">Approve listing</Button>
                <Button variant="outline" onClick={() => setDialog("changes")} className="border-field !text-[14px] !text-brand sm:w-[254px]">Request changes</Button>
                <div className="flex items-center gap-5 sm:ml-auto">
                  <button type="button" onClick={() => setDialog("reject")} className="rounded-full px-2 py-1 text-[13px] font-semibold text-danger-ink hover:bg-danger-50">Reject</button>
                  <button type="button" onClick={() => setDialog("remove")} className="rounded-full px-2 py-1 text-[13px] font-medium text-muted hover:bg-sand-100 hover:text-danger-ink">Remove</button>
                </div>
              </div>
            </section>
          ) : (
            <StateCard
              className="lg:min-h-[652px]"
              title="All caught up."
              body="There are no listings waiting for review. New submissions will appear here automatically."
              action={<Button variant="outline" onClick={() => setTab("reports")} className="w-full !text-[14px] sm:w-[254px]">View reported content</Button>}
            />
          )
        ) : report ? (
          <ReportDetail
            report={report}
            onDecide={(s) => decideReport(report, s)}
            onPause={() => setDialog("pause")}
            onRemove={() => setDialog("remove")}
          />
        ) : (
          <StateCard
            className="lg:min-h-[652px]"
            title="No open reports."
            body="Thank you for keeping Pawhaven safe. New reports from the community will appear here."
            action={<Button variant="outline" onClick={() => setTab("listings")} className="w-full !text-[14px] sm:w-[254px]">View pending listings</Button>}
          />
        )}
      </div>

      <p className="mt-[47px] text-[13px] leading-[1.5] text-muted">Every decision records the reviewer, timestamp, and reason in the audit trail.</p>

      {/* Dialogs */}
      <NoteDialog
        open={dialog === "changes"}
        onClose={() => setDialog(null)}
        title={`Request changes to ${pet?.name ?? "this listing"}`}
        description="The owner will see your note on their listing and can resubmit for review."
        label="What needs to change? *"
        placeholder="e.g. Please clarify the care requirements and remove the phone number from the story."
        confirmLabel="Send request"
        onSubmit={requestChanges}
      />
      <NoteDialog
        open={dialog === "reject"}
        onClose={() => setDialog(null)}
        title={`Reject ${pet?.name ?? "this listing"}?`}
        description="Rejected listings stay hidden. Explain which rule was broken so the owner understands the decision."
        label="Reason for rejection *"
        placeholder="e.g. Listings that require a deposit before meeting aren’t allowed."
        confirmLabel="Reject listing"
        danger
        onSubmit={reject}
      />
      <NoteDialog
        open={dialog === "pause"}
        onClose={() => setDialog(null)}
        title={`Pause ${reportPet?.name ?? "this listing"}?`}
        description="Paused listings are hidden from search while you investigate. The owner will see your note."
        label="Note to the owner *"
        confirmLabel="Pause listing"
        onSubmit={(note) => {
          if (reportPet) setPetStatus(reportPet.id, "paused", note);
          toast("Listing paused.", "info");
          setDialog(null);
        }}
      />
      <Dialog
        open={dialog === "remove"}
        onClose={() => setDialog(null)}
        title={`Remove ${removeTarget?.name ?? "this listing"}?`}
        description="This permanently deletes the listing and its adoption requests. This can’t be undone."
        footer={
          <>
            <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
            <Button
              variant="danger"
              onClick={() => {
                if (!removeTarget) return setDialog(null);
                deletePet(removeTarget.id);
                if (tab === "reports" && report) setReportStatus(report.id, "resolved");
                setSessionReviews((n) => n + 1);
                toast(`${removeTarget.name} was removed.`, "info");
                setDialog(null);
                if (tab === "listings") setPetId(nextPending(removeTarget.id));
              }}
            >
              Remove listing
            </Button>
          </>
        }
      />
    </>
  );
}

function ReportDetail({ report, onDecide, onPause, onRemove }: { report: Report; onDecide: (s: Report["status"]) => void; onPause: () => void; onRemove: () => void }) {
  const { getPet, getUser, db } = useStore();
  const reporter = getUser(report.reporterId);
  const pet = report.targetType === "pet" ? getPet(report.targetId) : undefined;
  const user = report.targetType === "user" ? getUser(report.targetId) : undefined;
  const convo = report.targetType === "message" ? db.conversations.find((c) => c.id === report.targetId) : undefined;
  const targetLabel = report.targetType === "pet" ? "Listing" : report.targetType === "user" ? "Member" : "Conversation";

  return (
    <section aria-labelledby="report-heading" className={`${panel} px-6 pb-7 pt-6 sm:px-7`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 id="report-heading" className="font-serif text-[28px] leading-[1.4] text-ink sm:text-[32px]">{REPORT_REASON_LABEL[report.reason]}</h2>
        <span className={`mt-2 rounded-full px-3 py-1 text-[12px] font-semibold ${report.status === "open" ? "bg-warning-50 text-warning" : "bg-sage-150 text-brand"}`}>
          {report.status === "open" ? "Open" : report.status === "resolved" ? "Resolved" : "Dismissed"}
        </span>
      </div>
      <p className="mt-2 text-[13px] leading-[1.5] text-muted">
        Reported by {reporter?.name ?? "a former member"} · {formatDate(report.createdAt)} ({timeAgo(report.createdAt)})
      </p>

      <dl className="mt-6 grid gap-x-6 gap-y-4 text-[14px] sm:grid-cols-[140px_1fr]">
        <dt className="text-muted">{targetLabel}</dt>
        <dd className="text-ink">
          {pet ? (
            <>
              <Link href={`/pets/${pet.id}`} target="_blank" className="font-semibold text-brand hover:underline">{pet.name} ↗</Link>
              <span className="text-muted"> · {pet.breed} · {pet.ownerName} · {PET_STATUS_LABEL[pet.status]}</span>
            </>
          ) : user ? (
            <span className="font-semibold">{user.name} <span className="font-normal text-muted">· {user.email} · {user.city}</span></span>
          ) : convo ? (
            <span>About {getPet(convo.petId)?.name ?? "a past listing"} · {convo.participantIds.map((id) => getUser(id)?.name ?? "Member").join(" & ")}</span>
          ) : (
            <span className="text-muted">This content has already been removed.</span>
          )}
        </dd>
        <dt className="text-muted">Details</dt>
        <dd className="text-ink">{report.details || <span className="text-muted">No details provided.</span>}</dd>
      </dl>

      {convo && convo.messages.length > 0 && (
        <div className="mt-6 space-y-2 rounded-[12px] bg-sand-50 p-4">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-muted">Recent messages</p>
          {convo.messages.slice(-4).map((m) => (
            <p key={m.id} className="text-[13px] leading-[1.5] text-ink">
              <span className="font-semibold">{getUser(m.fromId)?.name ?? "Member"}:</span> {m.text}
            </p>
          ))}
        </div>
      )}

      <div className="mt-10 flex flex-col gap-[18px] sm:flex-row sm:flex-wrap sm:items-center">
        {report.status === "open" ? (
          <>
            <Button onClick={() => onDecide("resolved")} className="!text-[14px] sm:w-[220px]">Resolve report</Button>
            <Button variant="outline" onClick={() => onDecide("dismissed")} className="border-field !text-[14px] !text-brand sm:w-[220px]">Dismiss</Button>
          </>
        ) : (
          <Button variant="outline" onClick={() => onDecide("open")} className="border-field !text-[14px] !text-brand sm:w-[220px]">Reopen report</Button>
        )}
        {pet && (
          <div className="flex items-center gap-5 sm:ml-auto">
            {pet.status !== "paused" && (
              <button type="button" onClick={onPause} className="rounded-full px-2 py-1 text-[13px] font-semibold text-brand hover:bg-sage-100">Pause listing</button>
            )}
            <button type="button" onClick={onRemove} className="rounded-full px-2 py-1 text-[13px] font-semibold text-danger-ink hover:bg-danger-50">Remove listing</button>
          </div>
        )}
      </div>
    </section>
  );
}

export default function ModerationPage() {
  return (
    <PageShell>
      <RequireAuth admin>
        <div className="container-page">
          <div className="flex flex-col-reverse gap-4 pb-8 pt-8 md:flex-row md:items-start md:justify-between md:pb-[38px] md:pt-[49px]">
            <div>
              <h1 className="font-serif text-[32px] leading-[1.2] text-ink md:text-[41px]">Care behind every connection.</h1>
              <p className="mt-4 text-[15px] leading-[1.5] text-muted">Moderation workspace · Restricted to authorized staff.</p>
            </div>
            <span className="inline-flex h-7 w-fit items-center rounded-full bg-peach-100 px-[10px] text-[11px] font-semibold uppercase tracking-wide text-ink md:mt-3 md:w-[168px] md:justify-center">
              Staff only
            </span>
          </div>
          <Workspace />
        </div>
      </RequireAuth>
    </PageShell>
  );
}
