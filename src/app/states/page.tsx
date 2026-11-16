"use client";

import { useState } from "react";
import { LoadingBlock, PageShell } from "@/components/layout/PageShell";
import { useToast } from "@/components/ui/Toast";
import {
  CheckEmailState,
  DeleteAccountState,
  ErrorState,
  LoginErrorState,
  MarkRehomedState,
  MessageFailedNotice,
  NeedsChangesState,
  NoMatchesState,
  NoMessagesState,
  NoSavedState,
  NotFoundState,
  OfflineNotice,
  PasswordResetState,
  PetUnavailableState,
  ProfileSavedNotice,
  ReportThanksState,
  SessionExpiredState,
} from "@/components/states/states";

/** Showcase for frame 14:69 "22 · Essential states". Destructive actions are demo-only here. */
export default function StatesPage() {
  const toast = useToast();
  const [resetKey, setResetKey] = useState(0);
  const demo = (what: string) => toast(`${what} — demo only on this page.`, "info");

  return (
    <PageShell>
      <div className="container-page">
        <div className="pb-10 pt-10 md:pt-12">
          <h1 className="font-serif text-[34px] leading-[1.2] text-ink md:text-[41px]">Care in every state.</h1>
          <p className="mt-4 text-[15px] leading-[1.5] text-muted">
            Empty, success, error, and confirmation states for the moments between the main journeys.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <NoMatchesState className="min-h-[338px]" />
          <NoSavedState className="min-h-[338px]" />
          <NoMessagesState className="min-h-[338px]" />
          <CheckEmailState className="min-h-[338px]" />
          <PasswordResetState className="min-h-[338px]" />
          <PetUnavailableState className="min-h-[338px]" />
          <LoginErrorState className="min-h-[338px]" />
          <DeleteAccountState
            key={resetKey}
            className="min-h-[338px]"
            onConfirm={() => { demo("Account deletion"); setResetKey((k) => k + 1); }}
            onCancel={() => setResetKey((k) => k + 1)}
          />
          <ReportThanksState className="min-h-[338px]" />
          <MarkRehomedState className="min-h-[338px]" onConfirm={() => demo("Marked Teddy as rehomed")} />
          <NeedsChangesState className="min-h-[338px]" />
          <SessionExpiredState className="min-h-[338px]" next="/states" />
        </div>

        <div className="mt-[51px] grid gap-6 lg:grid-cols-2">
          <MessageFailedNotice onRetry={() => toast("Message sent")} />
          <ProfileSavedNotice />
        </div>

        <h2 className="mt-16 font-serif text-[28px] leading-[1.2] text-ink">System states</h2>
        <p className="mt-2 text-[14px] text-muted">Shown by the app router for missing pages, unexpected errors, loading, and lost connections.</p>
        <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <NotFoundState className="min-h-[338px]" headingLevel={3} />
          <ErrorState className="min-h-[338px]" headingLevel={3} onRetry={() => toast("Retried successfully")} />
          <div className="flex min-h-[338px] flex-col rounded-[16px] border border-field bg-white">
            <LoadingBlock label="Fetching a few good friends…" />
            <div className="mt-auto p-6 pt-0">
              <OfflineNotice force />
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
