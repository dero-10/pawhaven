"use client";

import { useEffect } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { ErrorState } from "@/components/states/states";

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <PageShell>
      <div className="container-page flex justify-center py-16 md:py-24">
        <div className="w-full max-w-[520px]">
          <ErrorState headingLevel={1} onRetry={reset} />
          {error.digest && <p className="mt-4 text-center text-[11px] text-muted">Reference: {error.digest}</p>}
        </div>
      </div>
    </PageShell>
  );
}
