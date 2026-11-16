"use client";

import { useId, useState, type ReactNode } from "react";

/** Simple disclosure list. Items can start open; each toggles independently. */
export function Accordion({ items, defaultOpen = [] }: { items: { q: string; a: ReactNode }[]; defaultOpen?: number[] }) {
  const [open, setOpen] = useState<Set<number>>(() => new Set(defaultOpen));
  const base = useId();
  return (
    <ul className="divide-y divide-line">
      {items.map((it, i) => {
        const isOpen = open.has(i);
        const panelId = `${base}-panel-${i}`;
        return (
          <li key={it.q} className="py-3 first:pt-0">
            <h3>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen((s) => { const n = new Set(s); if (n.has(i)) n.delete(i); else n.add(i); return n; })}
                className="flex w-full items-center justify-between gap-4 py-1 text-left text-[16px] font-semibold leading-[1.5] text-ink hover:text-brand"
              >
                {it.q}
                <span aria-hidden className={`grid size-7 shrink-0 place-items-center rounded-full bg-sage-100 text-[16px] text-brand transition-transform ${isOpen ? "rotate-45" : ""}`}>+</span>
              </button>
            </h3>
            <div id={panelId} hidden={!isOpen} className="pb-5 pt-3 text-[14px] leading-[1.45] text-muted">
              {it.a}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
