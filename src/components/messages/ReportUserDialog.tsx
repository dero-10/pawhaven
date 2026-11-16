"use client";

import { useState } from "react";
import { Dialog } from "@/components/states/Dialog";
import { Button } from "@/components/ui/Button";
import { CheckRow, Field, Select, Textarea } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { useStore } from "@/lib/store";
import type { ReportReason } from "@/lib/types";
import { REPORT_REASON_LABEL, REPORT_REASONS } from "./reportReasons";

/** "Report / block" dialog for a conversation partner → store.report({ targetType: "user" }). */
export function ReportUserDialog({
  open,
  onClose,
  onBlocked,
  userId,
  userName,
}: {
  open: boolean;
  onClose: () => void;
  /** Called after the user is blocked (their conversations are now hidden). */
  onBlocked?: () => void;
  userId: string;
  userName: string;
}) {
  const { report, blockUser } = useStore();
  const toast = useToast();
  const [reason, setReason] = useState<ReportReason | "">("");
  const [details, setDetails] = useState("");
  const [block, setBlock] = useState(false);
  const [errors, setErrors] = useState<{ reason?: string; details?: string; form?: string }>({});

  const close = () => {
    setReason("");
    setDetails("");
    setBlock(false);
    setErrors({});
    onClose();
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!reason) next.reason = "Choose a reason.";
    if (details.trim().length < 10) next.details = "Please add a few details (at least 10 characters).";
    setErrors(next);
    if (next.reason || next.details) return;
    const r = report({ targetType: "user", targetId: userId, reason: reason as ReportReason, details });
    if (!r.ok) {
      setErrors({ form: r.error });
      return;
    }
    if (block) {
      const b = blockUser(userId);
      if (!b.ok) {
        setErrors({ form: b.error });
        return;
      }
      toast(`Report sent and ${userName} is blocked. You won’t see their messages anymore.`);
      close();
      onBlocked?.();
      return;
    }
    toast("Thanks for speaking up. Our moderation team will review this.");
    close();
  };

  return (
    <Dialog
      open={open}
      onClose={close}
      title={`Report or block ${userName}`}
      description="Reports are private and reviewed by our moderation team. If an animal is in immediate danger, contact local authorities."
    >
      <form onSubmit={submit} className="space-y-5" noValidate>
        <Field id="report-reason" label="Reason *" error={errors.reason}>
          <Select
            id="report-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value as ReportReason)}
            aria-invalid={!!errors.reason}
            aria-describedby={errors.reason ? "report-reason-error" : undefined}
          >
            <option value="">Choose a reason</option>
            {REPORT_REASONS.map((r) => (
              <option key={r} value={r}>{REPORT_REASON_LABEL[r]}</option>
            ))}
          </Select>
        </Field>
        <Field id="report-details" label="Tell us what happened *" error={errors.details}>
          <Textarea
            id="report-details"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Include relevant details. Don’t include sensitive personal information."
            aria-invalid={!!errors.details}
            aria-describedby={errors.details ? "report-details-error" : undefined}
          />
        </Field>
        <CheckRow
          id="report-block"
          checked={block}
          onChange={setBlock}
          label={`Also block ${userName}`}
          description="Hides your conversations with them and stops new messages."
        />
        {errors.form && <p role="alert" className="text-[13px] text-danger">{errors.form}</p>}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={close}>Cancel</Button>
          <Button type="submit">Submit report</Button>
        </div>
      </form>
    </Dialog>
  );
}
