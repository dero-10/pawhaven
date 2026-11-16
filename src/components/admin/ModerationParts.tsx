"use client";

/* eslint-disable @next/next/no-img-element */
import { useState, type ReactNode } from "react";
import { Dialog } from "@/components/states/Dialog";
import { Button } from "@/components/ui/Button";
import { Field, Textarea } from "@/components/ui/Field";

export function StatCard({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="rounded-[16px] border border-field bg-white px-[22px] pb-5 pt-5">
      <p className="text-[13px] font-medium leading-[1.5] text-muted">{label}</p>
      <p className="mt-1.5 font-serif text-[40px] leading-[1.2] text-ink">{value}</p>
      {hint && <p className="mt-1 text-[11px] text-muted">{hint}</p>}
    </div>
  );
}

export function QueueItem({
  title,
  meta,
  status,
  active,
  onClick,
  tone = "neutral",
}: {
  title: string;
  meta: string;
  status: string;
  active: boolean;
  onClick: () => void;
  tone?: "neutral" | "warning" | "done";
}) {
  const pill = tone === "warning" ? "bg-warning-50 text-warning" : tone === "done" ? "bg-sage-200 text-brand" : "bg-white text-muted";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "true" : undefined}
      className={`w-full rounded-[12px] px-[18px] pb-4 pt-[18px] text-left transition ${active ? "bg-sage-150" : "bg-sand-50 hover:bg-sage-50"}`}
    >
      <span className="flex items-start gap-[17px]">
        <span className="mt-[5px] shrink-0" aria-hidden>
          <img src="/figma/app/paw-artwork.svg" alt="" width={38} height={33.63} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[18px] font-semibold leading-[1.5] text-ink">{title}</span>
          <span className="mt-2 block truncate text-[12px] leading-[1.5] text-muted">{meta}</span>
        </span>
      </span>
      <span className={`mt-[18px] inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium ${pill}`}>{status}</span>
    </button>
  );
}

/** Dialog that collects a required moderator note before running `onSubmit(note)`. */
export function NoteDialog({
  open,
  onClose,
  title,
  description,
  label,
  placeholder,
  confirmLabel,
  danger = false,
  onSubmit,
  extra,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description: ReactNode;
  label: string;
  placeholder?: string;
  confirmLabel: string;
  danger?: boolean;
  onSubmit: (note: string) => void;
  extra?: ReactNode;
}) {
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const close = () => {
    setNote("");
    setError("");
    onClose();
  };
  return (
    <Dialog open={open} onClose={close} title={title} description={description}>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (note.trim().length < 10) {
            setError("Add a short note for the owner (at least 10 characters).");
            return;
          }
          onSubmit(note.trim());
          setNote("");
          setError("");
        }}
        className="space-y-5"
      >
        <Field id="mod-note" label={label} error={error}>
          <Textarea
            id="mod-note"
            value={note}
            onChange={(e) => { setNote(e.target.value); setError(""); }}
            placeholder={placeholder}
            aria-invalid={!!error}
            aria-describedby={error ? "mod-note-error" : undefined}
          />
        </Field>
        {extra}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={close}>Cancel</Button>
          <Button type="submit" variant={danger ? "danger" : "primary"}>{confirmLabel}</Button>
        </div>
      </form>
    </Dialog>
  );
}

export function ChecklistRow({ id, checked, onChange, label }: { id: string; checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-[14px] text-[14px] leading-[1.45] text-ink">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-[2px] size-[18px] shrink-0 cursor-pointer rounded accent-brand"
      />
      {label}
    </label>
  );
}
