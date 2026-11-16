"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

export type MenuItem =
  | { label: string; href: string; tone?: "danger" }
  | { label: string; onSelect: () => void; tone?: "danger" };

/** Disclosure-style action menu used by "Manage" on My listings. */
export function ListingMenu({ label, ariaLabel, items, variant = "outline" }: { label: ReactNode; ariaLabel?: string; items: MenuItem[]; variant?: "outline" | "icon" }) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        btn.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    wrap.current?.querySelector<HTMLElement>("[data-menu-item]")?.focus();
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const itemCls = (tone?: "danger") =>
    `block w-full rounded-[10px] px-3 py-2.5 text-left text-[14px] font-medium transition ${tone === "danger" ? "text-danger hover:bg-danger-50" : "text-ink hover:bg-sage-50"}`;

  return (
    <div ref={wrap} className="relative">
      <button
        ref={btn}
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
        className={
          variant === "icon"
            ? "grid size-[50px] place-items-center rounded-full border border-line bg-white text-[18px] font-semibold leading-none text-brand transition hover:border-brand"
            : "inline-flex h-[50px] w-full items-center justify-center gap-2 rounded-full border border-line bg-white px-6 text-[14px] font-semibold text-brand transition hover:border-brand md:w-[164px]"
        }
      >
        {label}
      </button>
      {open && (
        <div id={menuId} className="absolute right-0 top-[calc(100%+6px)] z-30 w-[230px] rounded-[14px] border border-line bg-white p-2 shadow-float">
          <ul>
            {items.map((it) => (
              <li key={it.label}>
                {"href" in it ? (
                  <Link data-menu-item href={it.href} className={itemCls(it.tone)} onClick={() => setOpen(false)}>
                    {it.label}
                  </Link>
                ) : (
                  <button
                    data-menu-item
                    type="button"
                    className={itemCls(it.tone)}
                    onClick={() => {
                      setOpen(false);
                      it.onSelect();
                    }}
                  >
                    {it.label}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
