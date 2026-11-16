/* eslint-disable @next/next/no-img-element */
import type { ReactNode } from "react";

/** Rounded paw emblem used at the top of every state card (frame 14:69 "Paw state emblem"). */
export function PawEmblem({ tone = "sage" }: { tone?: "sage" | "peach" | "danger" }) {
  const bg = tone === "peach" ? "bg-peach-100" : tone === "danger" ? "bg-danger-50" : "bg-sage-150";
  return (
    <span className={`grid h-[58px] w-[62px] shrink-0 place-items-center rounded-[18px] ${bg}`} aria-hidden>
      <img src="/figma/app/paw-artwork.svg" alt="" width={32} height={28.3188} />
    </span>
  );
}

/**
 * Card used for empty, success, error and confirmation states (416×338 in frame 14:69).
 * `action` is usually a full-width button; `children` sits between body and action.
 */
export function StateCard({
  title,
  body,
  action,
  children,
  tone = "sage",
  headingLevel = 2,
  className = "",
}: {
  title: ReactNode;
  body?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
  tone?: "sage" | "peach" | "danger";
  headingLevel?: 1 | 2 | 3;
  className?: string;
}) {
  const H = `h${headingLevel}` as "h1" | "h2" | "h3";
  return (
    <div className={`flex flex-col rounded-[16px] border border-field bg-white p-6 ${className}`}>
      <PawEmblem tone={tone} />
      <H className="mt-[22px] font-serif text-[24px] leading-[1.2] text-ink">{title}</H>
      {body && <p className="mt-4 text-[14px] leading-[1.45] text-muted">{body}</p>}
      {children && <div className="mt-4">{children}</div>}
      {action && <div className="mt-auto flex flex-wrap items-center gap-x-6 gap-y-3 pt-6">{action}</div>}
    </div>
  );
}

/** Wide inline notice (frame 14:69 "Message send failure" / "Profile saved confirmation"). */
export function InlineNotice({
  tone,
  children,
  action,
  className = "",
}: {
  tone: "error" | "success" | "info";
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  const styles =
    tone === "error"
      ? "border-danger/25 bg-danger-50 text-danger-ink"
      : tone === "success"
        ? "border-sage-300 bg-sage-150 text-brand"
        : "border-peach-200 bg-peach-100 text-ink";
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`flex min-h-[68px] items-center justify-between gap-4 rounded-[14px] border px-[18px] py-[14px] text-[14px] font-medium leading-[1.45] ${styles} ${className}`}
    >
      <span>{children}</span>
      {action}
    </div>
  );
}
