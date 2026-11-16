"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

/**
 * Lightweight modal dialog (overlay + panel). Closes on Escape and backdrop click,
 * moves focus inside on open and restores it on close.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = 520,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  width?: number;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();
  // Callers usually pass an inline `onClose`; keep it in a ref so re-renders (e.g. typing)
  // don't re-run the open effect, which would steal focus back to the first field.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const first = panel?.querySelector<HTMLElement>("input, textarea, select, button:not([data-dialog-close])");
    (first ?? panel)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key === "Tab" && panel) {
        const items = Array.from(panel.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), input, textarea, select")).filter((el) => !el.hasAttribute("disabled"));
        if (!items.length) return;
        const a = items[0];
        const z = items[items.length - 1];
        if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
        else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      prev?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-ink/40 p-4 sm:items-center" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className="max-h-[calc(100dvh-32px)] w-full overflow-y-auto rounded-[20px] border border-line bg-white p-6 shadow-float outline-none sm:p-7"
        style={{ maxWidth: width }}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="font-serif text-[24px] leading-[1.25] text-ink">{title}</h2>
          <button
            type="button"
            data-dialog-close
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 -mt-1 grid size-9 shrink-0 place-items-center rounded-full text-[20px] leading-none text-muted hover:bg-sand-100 hover:text-ink"
          >
            ×
          </button>
        </div>
        {description && <p id={descId} className="mt-2 text-[14px] leading-[1.55] text-muted">{description}</p>}
        {children && <div className="mt-5">{children}</div>}
        {footer && <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">{footer}</div>}
      </div>
    </div>
  );
}
