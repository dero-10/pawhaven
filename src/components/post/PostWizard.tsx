"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import type { ReactNode } from "react";
import { STEPS, type StepNumber } from "./wizard";

/** Paw artwork used across the post-a-pet frames (Figma "Your paw artwork", 52×46). */
export function PawArtwork({ width = 52, className = "" }: { width?: number; className?: string }) {
  const height = Math.round(width * (46.018 / 52) * 10) / 10;
  return <img src="/figma/post/paw-artwork.svg" alt="" width={width} height={height} className={`shrink-0 ${className}`} style={{ width, height }} />;
}

/** Step indicator 1–4 (Figma: 306×58 tiles, active = sage-150, others = sand-100). */
export function StepIndicator({ current, maxReachable, onLeave }: { current: StepNumber; maxReachable: number; onLeave?: () => void }) {
  return (
    <nav aria-label="Listing steps">
      <ol className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-6">
        {STEPS.map((s) => {
          const isCurrent = s.n === current;
          const done = s.n < current;
          const reachable = !isCurrent && s.n <= maxReachable;
          const inner = (
            <>
              <span className="w-[28px] shrink-0 text-[18px] font-semibold text-brand" aria-hidden>
                {done ? "✓" : s.n}
              </span>
              <span className={`text-[14px] text-ink ${isCurrent ? "font-semibold" : ""}`}>
                {s.label}
                {done && <span className="sr-only"> (completed)</span>}
              </span>
            </>
          );
          const cls = `flex h-[58px] items-center gap-[11px] rounded-[12px] px-4 leading-[1.5] ${isCurrent ? "bg-sage-150" : "bg-sand-100"}`;
          return (
            <li key={s.n}>
              {reachable ? (
                <Link href={s.href} onClick={onLeave} className={`${cls} transition hover:bg-sage-100`}>
                  {inner}
                </Link>
              ) : (
                <div className={cls} aria-current={isCurrent ? "step" : undefined}>
                  {inner}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** Green guidance card on the right column. */
export function GuidanceCard({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded-[20px] bg-sage-150 px-7 pb-9 pt-7">
      <PawArtwork />
      <h2 className="mt-[43px] font-serif text-[28px] leading-[1.2] text-ink">{title}</h2>
      <div className="mt-6 max-w-[352px] text-[14px] leading-[1.5] text-muted">{children}</div>
    </div>
  );
}

/** White form card on the left column. */
export function FormCard({ title, children }: { title?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-[16px] border border-line bg-white px-5 pb-10 pt-6 sm:px-7">
      {title && <h2 className="font-serif text-[26px] leading-[1.2] text-ink">{title}</h2>}
      {children}
    </section>
  );
}

export interface WizardActions {
  backLabel: string;
  onBack: () => void;
  continueLabel: string;
  onContinue: () => void;
  onSaveDraft?: () => void;
  busy?: boolean;
}

/** Shared chrome for every wizard step: heading, Save and exit, stepper, two-column body, footer actions. */
export function PostWizard({
  step,
  maxReachable,
  editingName,
  onSaveExit,
  onLeave,
  aside,
  children,
  actions,
  notice,
}: {
  step: StepNumber;
  maxReachable: number;
  editingName?: string;
  onSaveExit: () => void;
  /** Called before the stepper navigates (flush unsaved edits). */
  onLeave?: () => void;
  aside: ReactNode;
  children: ReactNode;
  actions: WizardActions;
  notice?: ReactNode;
}) {
  return (
    <div className="container-page pb-8 pt-10 md:pb-6 md:pt-12">
      <div className="flex flex-col-reverse gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {editingName !== undefined && (
            <p className="mb-3 inline-flex h-[28px] items-center rounded-full bg-peach-100 px-3 text-[12px] font-semibold text-ink">
              Editing {editingName || "your listing"}
            </p>
          )}
          <h1 className="font-serif text-[32px] leading-[1.2] text-ink md:text-[41px]">A thoughtful listing. A loving home.</h1>
          <p className="mt-4 text-[15px] leading-[1.5] text-muted">Tell their story honestly. Help the right people find them.</p>
        </div>
        <button type="button" onClick={onSaveExit} className="self-end text-[13px] font-semibold leading-[1.5] text-brand hover:underline sm:mt-[3px] sm:w-[138px] sm:self-auto">
          Save and exit
        </button>
      </div>

      <div className="mt-9">
        <StepIndicator current={step} maxReachable={maxReachable} onLeave={onLeave} />
      </div>

      {notice && <div className="mt-6">{notice}</div>}

      <div className="mt-[34px] grid gap-8 lg:grid-cols-[minmax(0,840px)_408px] lg:justify-between lg:gap-12">
        <div className="min-w-0">
          {children}
          <div className="mt-[46px] flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={actions.onBack}
              className="inline-flex h-[50px] items-center justify-center rounded-full border border-line bg-white px-8 text-[14px] font-semibold text-brand transition hover:border-brand sm:w-[164px]"
            >
              {actions.backLabel}
            </button>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
              {actions.onSaveDraft && (
                <button
                  type="button"
                  onClick={actions.onSaveDraft}
                  className="inline-flex h-[50px] items-center justify-center rounded-full px-5 text-[14px] font-semibold text-brand transition hover:bg-sage-100"
                >
                  Save draft
                </button>
              )}
              <button
                type="button"
                onClick={actions.onContinue}
                disabled={actions.busy}
                className="inline-flex h-[50px] items-center justify-center rounded-full bg-brand px-6 text-[14px] font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50 sm:w-[328px]"
              >
                {actions.continueLabel}
              </button>
            </div>
          </div>
        </div>
        <aside className="min-w-0">{aside}</aside>
      </div>
    </div>
  );
}
