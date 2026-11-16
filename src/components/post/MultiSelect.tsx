"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useId, useRef, useState } from "react";

/** Dropdown with checkboxes, styled like the shared `Select` (used for "Comfortable with"). */
export function MultiSelect({
  id,
  options,
  value,
  onChange,
  placeholder = "Select",
  describedBy,
}: {
  id: string;
  options: readonly { value: string; label: string }[];
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  describedBy?: string;
}) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        document.getElementById(id)?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, id]);

  const labels = options.filter((o) => value.includes(o.value)).map((o) => o.label);
  const summary = labels.length ? labels.map((l, i) => (i === 0 ? l : l.toLowerCase())).join(", ") : placeholder;

  return (
    <div ref={wrap} className="relative">
      <button
        id={id}
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={listId}
        aria-describedby={describedBy}
        onClick={() => setOpen((o) => !o)}
        className={`flex h-[52px] w-full items-center rounded-[14px] border bg-white pl-4 pr-10 text-left text-[15px] outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15 ${
          open ? "border-brand" : "border-line"
        } ${labels.length ? "text-ink" : "text-muted"}`}
      >
        <span className="truncate">{summary}</span>
      </button>
      <img src="/icons/chevron-down.svg" alt="" width={20} height={20} className="pointer-events-none absolute right-4 top-[26px] size-5 -translate-y-1/2" />
      {open && (
        <div id={listId} role="group" aria-label="Comfortable with" className="absolute inset-x-0 top-[calc(100%+6px)] z-20 rounded-[14px] border border-line bg-white p-2 shadow-float">
          {options.map((o) => {
            const checked = value.includes(o.value);
            return (
              <label key={o.value} className="flex cursor-pointer items-center gap-3 rounded-[10px] px-3 py-2.5 text-[14px] text-ink hover:bg-sage-50">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onChange(checked ? value.filter((v) => v !== o.value) : [...value, o.value])}
                  className="size-4 accent-brand"
                />
                {o.label}
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
