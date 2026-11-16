"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { emptyDraft, useStore } from "@/lib/store";
import type { PetDraft } from "@/lib/types";

/**
 * Local working copy of the store draft for one wizard step.
 * Edits autosave to the store (debounced) and are flushed when the step unmounts,
 * so refresh / browser back never loses data. Must be mounted after `ready`.
 */
export function useWizardDraft() {
  const { db, saveDraft } = useStore();
  const [draft, setDraft] = useState<PetDraft>(() => (db.draft ? structuredClone(db.draft) : emptyDraft()));
  const dirty = useRef(false);
  const stopped = useRef(false);
  const latest = useRef(draft);
  const saveRef = useRef(saveDraft);

  useEffect(() => {
    latest.current = draft;
    saveRef.current = saveDraft;
  });

  const update = useCallback((patch: Partial<PetDraft>) => {
    dirty.current = true;
    setDraft((d) => ({ ...d, ...patch }));
  }, []);

  /** Persist now (synchronously). */
  const flush = useCallback((extra?: Partial<PetDraft>) => {
    if (stopped.current) return;
    const next = extra ? { ...latest.current, ...extra } : latest.current;
    saveRef.current(next);
    dirty.current = false;
  }, []);

  /** Stop autosaving (after submit / discard, so the cleared draft isn't resurrected). */
  const stop = useCallback(() => {
    stopped.current = true;
    dirty.current = false;
  }, []);

  // Debounced autosave while typing.
  useEffect(() => {
    if (!dirty.current || stopped.current) return;
    const t = setTimeout(() => {
      if (!stopped.current) {
        saveRef.current(latest.current);
        dirty.current = false;
      }
    }, 600);
    return () => clearTimeout(t);
  }, [draft]);

  // Flush pending edits on unmount (e.g. header navigation) and when the page is
  // refreshed or closed inside the debounce window.
  useEffect(() => {
    const flushPending = () => {
      if (dirty.current && !stopped.current) {
        saveRef.current(latest.current);
        dirty.current = false;
      }
    };
    window.addEventListener("pagehide", flushPending);
    return () => {
      window.removeEventListener("pagehide", flushPending);
      flushPending();
    };
  }, []);

  return { draft, update, flush, stop };
}
