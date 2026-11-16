"use client";

import { PageShell } from "@/components/layout/PageShell";
import { NotFoundState } from "@/components/states/states";

export default function NotFound() {
  return (
    <PageShell>
      <div className="container-page flex justify-center py-16 md:py-24">
        <div className="w-full max-w-[520px]">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-brand">Error 404</p>
          <NotFoundState headingLevel={1} />
        </div>
      </div>
    </PageShell>
  );
}
