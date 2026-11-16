"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { LoadingBlock, PageShell, RequireAuth } from "@/components/layout/PageShell";
import { ConversationList, summarize } from "@/components/messages/ConversationList";
import { ReportUserDialog } from "@/components/messages/ReportUserDialog";
import { Thread } from "@/components/messages/Thread";
import { NoMessagesState } from "@/components/states/states";
import { useToast } from "@/components/ui/Toast";
import { useStore } from "@/lib/store";

function MessagesView() {
  const store = useStore();
  const { currentUser, myConversations, getUser, getPet, markRead, sendMessage, simulateReply, startConversation, db } = store;
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();
  const cParam = params.get("c");
  const petParam = params.get("pet");
  const [query, setQuery] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const startedFor = useRef<string | null>(null);
  const meId = currentUser!.id;

  // `?pet=<id>` starts (or reopens) a conversation about that pet.
  useEffect(() => {
    if (!petParam || startedFor.current === petParam) return;
    startedFor.current = petParam;
    const r = startConversation(petParam);
    if (r.ok) router.replace(`/messages?c=${r.data.id}`);
    else {
      toast(r.error, "error");
      router.replace("/messages");
    }
  }, [petParam, startConversation, router, toast]);

  const summaries = useMemo(
    () => myConversations().map((c) => summarize(c, meId, getUser, getPet)),
    [myConversations, meId, getUser, getPet],
  );

  const selected = summaries.find((s) => s.c.id === cParam);
  const active = selected ?? (cParam ? undefined : summaries[0]);
  const activeId = active?.c.id;
  const activeLen = active?.c.messages.length ?? 0;

  useEffect(() => {
    if (activeId) markRead(activeId);
  }, [activeId, activeLen, markRead]);

  const application = useMemo(() => {
    if (!active) return undefined;
    return db.applications
      .filter((a) => a.petId === active.c.petId && (a.applicantId === meId || a.applicantId === active.otherId))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  }, [active, db.applications, meId]);

  const select = (id: string) => router.push(`/messages?c=${id}`, { scroll: false });

  if (petParam) return <LoadingBlock label="Opening conversation…" />;

  if (summaries.length === 0) {
    return (
      <div className="mx-auto max-w-[416px] pb-10">
        <NoMessagesState />
      </div>
    );
  }

  return (
    <>
      {cParam && !selected && (
        <p role="alert" className="mb-4 rounded-[12px] bg-warning-50 px-4 py-3 text-[13px] text-warning">
          That conversation isn’t available anymore. Choose another one below.
        </p>
      )}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 md:grid-cols-[minmax(0,300px)_minmax(0,1fr)] lg:grid-cols-[360px_minmax(0,1fr)]">
        <div className={selected ? "hidden md:block" : ""}>
          <ConversationList items={summaries} query={query} onQuery={setQuery} activeId={activeId} onSelect={select} />
        </div>
        <div className={selected ? "" : "hidden md:block"}>
          {active ? (
            <Thread
              summary={active}
              meId={meId}
              application={application}
              onSend={(text) => {
                const id = active.c.id;
                const r = sendMessage(id, text);
                // Mock: the other person "replies" a moment later so the thread feels alive.
                if (r.ok) window.setTimeout(() => simulateReply(id), 2000);
                return r.ok ? { ok: true } : { ok: false, error: r.error };
              }}
              onBack={() => router.push("/messages", { scroll: false })}
              onReport={() => setReportOpen(true)}
            />
          ) : (
            <div className="grid h-[729px] place-items-center rounded-[16px] border border-field bg-white text-[14px] text-muted">
              Choose a conversation to read it.
            </div>
          )}
        </div>
      </div>
      {active && (
        <ReportUserDialog
          key={active.otherId}
          open={reportOpen}
          onClose={() => setReportOpen(false)}
          onBlocked={() => router.replace("/messages", { scroll: false })}
          userId={active.otherId}
          userName={active.otherName}
        />
      )}
    </>
  );
}

export default function MessagesPage() {
  return (
    <PageShell>
      <RequireAuth>
        <div className="container-page">
          <div className="pb-8 pt-8 md:pb-[33px] md:pt-[49px]">
            <h1 className="font-serif text-[32px] leading-[1.2] text-ink md:text-[41px]">A little conversation goes a long way.</h1>
            <p className="mt-4 text-[15px] leading-[1.5] text-muted">Keep questions, updates, and meet-and-greet plans in one safe place.</p>
          </div>
          <Suspense fallback={<LoadingBlock />}>
            <MessagesView />
          </Suspense>
        </div>
      </RequireAuth>
    </PageShell>
  );
}
