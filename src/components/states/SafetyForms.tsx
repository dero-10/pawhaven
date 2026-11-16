"use client";

import Link from "next/link";
import { useState } from "react";
import { REPORT_REASON_LABEL, REPORT_REASONS } from "@/components/messages/reportReasons";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { useStore } from "@/lib/store";
import type { Report, ReportReason } from "@/lib/types";
import { ReportThanksState } from "./states";
import { StateCard } from "./StateCard";

const TARGETS: { value: Report["targetType"]; label: string }[] = [
  { value: "pet", label: "A listing" },
  { value: "user", label: "A person" },
  { value: "message", label: "A message or conversation" },
];

/** Pulls an id out of a pasted Pawhaven link (or accepts a bare id). */
function parseTarget(type: Report["targetType"], raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  const pet = s.match(/\/pets\/([\w-]+)/);
  const conv = s.match(/[?&]c=([\w-]+)/);
  const user = s.match(/\/users?\/([\w-]+)/);
  if (type === "pet" && pet) return pet[1];
  if (type === "message" && conv) return conv[1];
  if (type === "user" && user) return user[1];
  if (/^[\w-]+$/.test(s)) return s;
  return pet?.[1] ?? conv?.[1] ?? user?.[1] ?? s;
}

type ReportErrors = { link?: string; reason?: string; details?: string; form?: string };

export function ReportForm({ initialType = "pet", initialLink = "" }: { initialType?: Report["targetType"]; initialLink?: string }) {
  const { currentUser, report, getPet, ready } = useStore();
  const [type, setType] = useState<Report["targetType"]>(initialType);
  const [link, setLink] = useState(initialLink);
  const [reason, setReason] = useState<ReportReason | "">("");
  const [details, setDetails] = useState("");
  const [errors, setErrors] = useState<ReportErrors>({});
  const [done, setDone] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const er: ReportErrors = {};
    const target = parseTarget(type, link);
    if (!target) er.link = "Paste the link to the listing, profile, or conversation.";
    else if (type === "pet" && !getPet(target)) er.link = "We couldn’t find that listing. Check the link and try again.";
    if (!reason) er.reason = "Choose a reason.";
    if (details.trim().length < 20) er.details = "Please describe what happened (at least 20 characters).";
    if (!currentUser) er.form = "Please log in to submit a report.";
    setErrors(er);
    if (Object.keys(er).length) return;
    const r = report({ targetType: type, targetId: target!, reason: reason as ReportReason, details });
    if (!r.ok) {
      setErrors({ form: r.error });
      return;
    }
    setDone(true);
  };

  if (done) {
    return (
      <ReportThanksState
        className="h-full border-0 !p-0"
        action={
          <>
            <ButtonLink href="/" className="w-full">Return to Pawhaven</ButtonLink>
            <button
              type="button"
              onClick={() => { setDone(false); setLink(""); setReason(""); setDetails(""); }}
              className="text-[14px] font-semibold text-brand hover:underline"
            >
              Report something else
            </button>
          </>
        }
      />
    );
  }

  const aria = (k: keyof ReportErrors, id: string) => ({ "aria-invalid": !!errors[k], "aria-describedby": errors[k] ? `${id}-error` : undefined });

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-[22px]">
      <Field id="rep-type" label="What are you reporting? *">
        <Select id="rep-type" value={type} onChange={(e) => setType(e.target.value as Report["targetType"])} className="!h-[50px] text-[14px]">
          {TARGETS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </Select>
      </Field>
      <Field id="rep-link" label="Listing or conversation link *" error={errors.link}>
        <Input id="rep-link" value={link} onChange={(e) => setLink(e.target.value)} placeholder="Paste the Pawhaven link" className="!h-[50px] text-[14px]" {...aria("link", "rep-link")} />
      </Field>
      <Field id="rep-reason" label="Reason *" error={errors.reason}>
        <Select id="rep-reason" value={reason} onChange={(e) => setReason(e.target.value as ReportReason)} className="!h-[50px] text-[14px]" {...aria("reason", "rep-reason")}>
          <option value="">Choose a reason</option>
          {REPORT_REASONS.map((r) => <option key={r} value={r}>{REPORT_REASON_LABEL[r]}</option>)}
        </Select>
      </Field>
      <Field id="rep-details" label="Tell us what happened *" error={errors.details}>
        <Textarea
          id="rep-details"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Include relevant details. Don’t include sensitive personal information."
          className="!min-h-[86px] text-[14px]"
          {...aria("details", "rep-details")}
        />
      </Field>
      {ready && !currentUser && (
        <p className="rounded-[12px] bg-sage-50 px-4 py-3 text-[13px] text-muted">
          You’ll need to{" "}
          <Link href="/login?next=%2Fsafety%23report" className="font-semibold text-brand hover:underline">log in</Link>{" "}
          to submit a report, so our team can follow up with you.
        </p>
      )}
      {errors.form && <p role="alert" className="-mt-2 text-[13px] text-danger">{errors.form}</p>}
      <Button type="submit" className="w-full !text-[14px]">Submit report</Button>
    </form>
  );
}

const TOPICS = ["Adoption help", "Listing help", "Account & login", "Safety concern", "Accessibility", "Something else"];
type ContactErrors = { name?: string; email?: string; topic?: string; message?: string };

export function ContactForm() {
  const { currentUser, submitTicket } = useStore();
  const toast = useToast();
  // null = untouched → fall back to the signed-in user's details.
  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<ContactErrors>({});
  const [done, setDone] = useState(false);

  const nameValue = name ?? currentUser?.name ?? "";
  const emailValue = email ?? currentUser?.email ?? "";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const er: ContactErrors = {};
    if (nameValue.trim().length < 2) er.name = "Tell us your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue.trim())) er.email = "Enter a valid email so we can reply.";
    if (!topic) er.topic = "Choose a topic.";
    if (message.trim().length < 10) er.message = "Please add a little more detail (at least 10 characters).";
    setErrors(er);
    if (Object.keys(er).length) return;
    submitTicket(topic, `${message.trim()}\n\n— ${nameValue.trim()} <${emailValue.trim()}>`);
    toast("Message sent. We’ll reply by email.");
    setDone(true);
  };

  if (done) {
    return (
      <StateCard
        className="border-0 !p-0"
        title="Thanks — we’ve got it."
        body="Our support team usually replies within one business day. Keep an eye on your inbox (and spam folder)."
        action={
          <button type="button" onClick={() => { setDone(false); setMessage(""); setTopic(""); }} className="text-[14px] font-semibold text-brand hover:underline">
            Send another message
          </button>
        }
      />
    );
  }

  const aria = (k: keyof ContactErrors, id: string) => ({ "aria-invalid": !!errors[k], "aria-describedby": errors[k] ? `${id}-error` : undefined });

  return (
    <form onSubmit={submit} noValidate className="grid gap-[22px] sm:grid-cols-2">
      <Field id="ct-name" label="Your name *" error={errors.name}>
        <Input id="ct-name" autoComplete="name" value={nameValue} onChange={(e) => setName(e.target.value)} className="!h-[50px] text-[14px]" {...aria("name", "ct-name")} />
      </Field>
      <Field id="ct-email" label="Email address *" error={errors.email}>
        <Input id="ct-email" type="email" autoComplete="email" value={emailValue} onChange={(e) => setEmail(e.target.value)} className="!h-[50px] text-[14px]" {...aria("email", "ct-email")} />
      </Field>
      <div className="sm:col-span-2">
        <Field id="ct-topic" label="Topic *" error={errors.topic}>
          <Select id="ct-topic" value={topic} onChange={(e) => setTopic(e.target.value)} className="!h-[50px] text-[14px]" {...aria("topic", "ct-topic")}>
            <option value="">Choose a topic</option>
            {TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
        </Field>
      </div>
      <div className="sm:col-span-2">
        <Field id="ct-message" label="How can we help? *" error={errors.message}>
          <Textarea id="ct-message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Share as much detail as you can. Don’t include passwords or payment information." className="text-[14px]" {...aria("message", "ct-message")} />
        </Field>
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" className="w-full !text-[14px] sm:w-[240px]">Send message</Button>
      </div>
    </form>
  );
}
