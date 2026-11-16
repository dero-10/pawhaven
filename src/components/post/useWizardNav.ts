"use client";

import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

/** Moves keyboard focus to the first invalid field after a failed Continue. */
export function focusFirstError() {
  // setTimeout (not rAF) so it also runs in background tabs; React has committed the errors by then.
  setTimeout(() => {
    const el = document.querySelector<HTMLElement>('[aria-invalid="true"]');
    el?.focus();
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
  });
}

/** Shared navigation handlers for wizard steps. `flush` persists the step's working copy. */
export function useWizardNav(flush: () => void) {
  const router = useRouter();
  const toast = useToast();
  return {
    go(href: string) {
      flush();
      router.push(href);
    },
    saveDraft() {
      flush();
      toast("Draft saved");
    },
    saveExit() {
      flush();
      toast("Draft saved. Pick up where you left off from My listings.");
      router.push("/my-listings");
    },
  };
}
