"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { Fragment, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { MessageFailedNotice } from "@/components/states/states";
import type { Application } from "@/lib/types";
import type { ConversationSummary } from "./ConversationList";
import { clockTime, dayKey, dayLabel } from "./time";

const APP_LINE: Record<Application["status"], string> = {
  submitted: "Adoption request submitted",
  in_review: "Adoption request in review",
  meet_greet: "Meet & greet planned",
  approved: "Adoption request approved",
  declined: "Adoption request not a match",
  withdrawn: "Adoption request withdrawn",
};

export function Thread({
  summary,
  meId,
  application,
  onSend,
  onBack,
  onReport,
}: {
  summary: ConversationSummary;
  meId: string;
  application?: Application;
  onSend: (text: string) => { ok: boolean; error?: string };
  onBack: () => void;
  onReport: () => void;
}) {
  const { c, otherName, otherId, pet, petName } = summary;
  const [draft, setDraft] = useState("");
  const [failed, setFailed] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const otherRead = c.lastReadAt[otherId] ?? "";

  // Reset composer when switching conversations.
  useEffect(() => {
    setDraft("");
    setFailed(null);
  }, [c.id]);

  // Auto-scroll to newest message.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [c.id, c.messages.length]);

  // Auto-grow the composer.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [draft]);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    const r = onSend(text);
    if (r.ok) {
      setDraft("");
      setFailed(null);
    } else {
      setFailed(r.error ?? "Message couldn’t send.");
    }
    inputRef.current?.focus();
  };

  const subtitle = [`About ${petName}`, application ? APP_LINE[application.status] : null].filter(Boolean).join(" · ");
  const lastMine = [...c.messages].reverse().find((m) => m.fromId === meId)?.id;

  return (
    <section aria-label={`Conversation with ${otherName}`} className="flex h-[calc(100dvh-120px)] min-h-[520px] flex-col rounded-[16px] border border-field bg-white md:h-[729px]">
      {/* Header */}
      <header className="flex items-start gap-3 px-4 pt-4 sm:gap-[19px] sm:px-[19px] sm:pt-[19px]">
        <button
          type="button"
          onClick={onBack}
          className="-ml-1 grid size-10 shrink-0 place-items-center rounded-full text-[20px] text-brand hover:bg-sage-100 md:hidden"
          aria-label="Back to conversations"
        >
          ←
        </button>
        <span className="mt-1.5 hidden shrink-0 sm:block" aria-hidden>
          <img src="/figma/app/paw-artwork-lg.svg" alt="" width={36} height={31.8586} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[19px] font-semibold leading-[1.5] text-ink">{otherName}</h2>
          <p className="mt-1.5 text-[12px] leading-[1.5] text-muted">
            {pet ? (
              <>
                About{" "}
                <Link href={`/pets/${pet.id}`} className="hover:text-brand hover:underline">{petName}</Link>
                {application ? ` · ${APP_LINE[application.status]}` : ""}
              </>
            ) : (
              subtitle
            )}
          </p>
        </div>
        <button type="button" onClick={onReport} className="mt-2.5 shrink-0 rounded-full px-2 py-1 text-[12px] font-medium text-brand hover:bg-sage-100 sm:mr-3">
          Report / block
        </button>
      </header>

      {/* Safety notice */}
      <div className="mx-4 mt-5 rounded-[10px] bg-peach-100 px-4 py-[13px] text-[12px] leading-[1.5] text-muted sm:mx-[19px]">
        Keep it safe: meet in person, verify records, and never send a deposit
        <br className="hidden lg:block" /> before meeting. Don’t share passwords or payment information.
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 sm:px-6" aria-live="polite">
        {c.messages.length === 0 && (
          <p className="py-12 text-center text-[13px] text-muted">Say hello and ask {otherName} a thoughtful first question about {petName}.</p>
        )}
        {c.messages.map((m, i) => {
          const mine = m.fromId === meId;
          const newDay = i === 0 || dayKey(c.messages[i - 1].at) !== dayKey(m.at);
          return (
            <Fragment key={m.id}>
              {newDay && (
                <p className="pb-[22px] pt-[26px] text-center text-[10px] font-medium uppercase leading-[1.5] text-muted">
                  {dayLabel(m.at)}
                </p>
              )}
              <div className={`mb-[18px] flex flex-col ${mine ? "items-end" : "items-start"}`}>
                <div
                  className={`max-w-[86%] whitespace-pre-wrap break-words rounded-[14px] px-[18px] py-4 text-[14px] leading-[1.5] text-ink sm:max-w-[641px] ${
                    mine ? "bg-sage-150" : "bg-sage-50"
                  }`}
                >
                  {m.text}
                </div>
                <p className={`mt-2 text-[10px] leading-[1.5] text-muted ${mine ? "text-right" : ""}`}>
                  {mine ? "You" : otherName} · {clockTime(m.at)}
                  {mine && m.id === lastMine ? (otherRead >= m.at ? " · Read" : " · Sent") : ""}
                </p>
              </div>
            </Fragment>
          );
        })}
      </div>

      {failed && <MessageFailedNotice className="mx-4 mb-3 sm:mx-[19px]" onRetry={send} />}

      {/* Composer */}
      <form
        className="flex items-end gap-3 px-4 pb-4 sm:gap-[18px] sm:px-[19px] sm:pb-[24px]"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <label htmlFor="message-composer" className="sr-only">Message {otherName}</label>
        <textarea
          id="message-composer"
          ref={inputRef}
          rows={1}
          value={draft}
          maxLength={2000}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Write a thoughtful message…"
          className="min-h-[61px] flex-1 resize-none rounded-[16px] border border-field bg-white px-[17px] py-[18px] text-[14px] leading-[1.5] text-ink outline-none placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/15"
        />
        <Button type="submit" disabled={!draft.trim()} className="mb-[5px] w-[96px] shrink-0 !text-[14px] sm:w-[153px]">
          Send
        </Button>
      </form>
    </section>
  );
}
