"use client";

import { useState } from "react";
import { Dialog } from "@/components/states/Dialog";
import type { Pet, ReportReason } from "@/lib/types";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/ui/Toast";
import { Button, ButtonLink } from "@/components/ui/Button";
import { FieldError, Label, Textarea } from "@/components/ui/Field";

export const REPORT_REASONS: { value: ReportReason; label: string; hint: string }[] = [
  { value: "scam", label: "Scam or suspicious payment request", hint: "Asking for deposits, gift cards or money before meeting." },
  { value: "selling_for_profit", label: "Selling for profit", hint: "Breeding or reselling animals for profit." },
  { value: "animal_welfare", label: "Animal welfare concern", hint: "The pet may be unsafe, unwell or neglected." },
  { value: "inappropriate", label: "Inappropriate content", hint: "Offensive photos, language or misleading details." },
  { value: "other", label: "Something else", hint: "Tell us what’s going on." },
];

/** Report-a-listing dialog. Calls store.report() with targetType "pet". */
export function ReportListingModal({ pet, open, onClose }: { pet: Pet; open: boolean; onClose: () => void }) {
  const { report, currentUser } = useStore();
  const toast = useToast();
  const [reason, setReason] = useState<ReportReason | "">("");
  const [details, setDetails] = useState("");
  const [errors, setErrors] = useState<{ reason?: string; details?: string }>({});
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!reason) next.reason = "Choose the reason that fits best.";
    if (reason === "other" && details.trim().length < 10) next.details = "Please add a few details (10+ characters).";
    if (details.length > 1000) next.details = "Please keep details under 1,000 characters.";
    setErrors(next);
    if (Object.keys(next).length) return;
    const r = report({ targetType: "pet", targetId: pet.id, reason: reason as ReportReason, details });
    if (!r.ok) {
      toast(r.error, "error");
      return;
    }
    toast("Thanks — our trust & safety team will review this listing.");
    setReason("");
    setDetails("");
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Report this listing"
      description={`Reports are confidential. ${pet.ownerType === "shelter" ? "The shelter" : "The pet parent"} won’t see who sent it.`}
    >
        <form onSubmit={submit} noValidate>
          <fieldset aria-describedby={errors.reason ? "report-reason-error" : undefined}>
            <legend className="mb-2 text-[13px] font-semibold text-ink">Reason</legend>
            <div className="space-y-2">
              {REPORT_REASONS.map((r) => (
                <label key={r.value} className={`flex cursor-pointer items-start gap-3 rounded-[14px] border p-3 transition ${reason === r.value ? "border-brand bg-sage-50" : "border-line hover:border-brand"}`}>
                  <input
                    type="radio"
                    name="report-reason"
                    value={r.value}
                    checked={reason === r.value}
                    onChange={() => setReason(r.value)}
                    className="mt-1 size-4 accent-brand"
                  />
                  <span>
                    <span className="block text-[14px] font-semibold text-ink">{r.label}</span>
                    <span className="block text-[12px] text-muted">{r.hint}</span>
                  </span>
                </label>
              ))}
            </div>
            <FieldError id="report-reason-error">{errors.reason}</FieldError>
          </fieldset>
          <div className="mt-5">
            <Label htmlFor="report-details" hint={reason === "other" ? "Required" : "Optional"}>Details</Label>
            <Textarea
              id="report-details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="What should our team know?"
              aria-invalid={!!errors.details}
              aria-describedby={errors.details ? "report-details-error" : undefined}
            />
            <FieldError id="report-details-error">{errors.details}</FieldError>
          </div>
          {!currentUser && (
            <p className="mt-5 rounded-[12px] bg-sage-100 px-4 py-3 text-[13px] leading-[1.5] text-ink">
              Please log in to send a report — it helps us follow up and prevents abuse.
            </p>
          )}
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            {currentUser ? (
              <Button type="submit" variant="danger">Send report</Button>
            ) : (
              <ButtonLink href={`/login?next=${encodeURIComponent(`/pets/${pet.id}`)}`}>Log in to send report</ButtonLink>
            )}
          </div>
        </form>
    </Dialog>
  );
}
