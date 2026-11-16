"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { EmptyState, PageShell, RequireAuth } from "@/components/layout/PageShell";
import { Button, ButtonLink } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { ownerNoun } from "@/components/adoption/shared";
import { useStore } from "@/lib/store";

function SentContent() {
  const { id } = useParams<{ id: string }>();
  const { getPet, myApplications, startConversation } = useStore();
  const router = useRouter();
  const toast = useToast();
  const pet = getPet(id);
  const app = myApplications().find((a) => a.petId === id);

  if (!pet || !app) {
    return (
      <EmptyState
        as="h1"
        title="We couldn’t find that application"
        body="It may have been withdrawn, or the listing is no longer available."
        action={<ButtonLink href="/applications">See your requests</ButtonLink>}
        secondary={<Link href="/pets" className="text-[14px] font-semibold text-brand">Keep browsing</Link>}
      />
    );
  }

  const noun = ownerNoun(pet);

  const goToMessages = () => {
    const r = startConversation(pet.id);
    if (!r.ok) {
      toast(r.error, "error");
      return;
    }
    router.push(`/messages?c=${r.data.id}`);
  };

  return (
    <div className="container-page pb-14 pt-10">
      <section className="mx-auto flex max-w-[940px] flex-col items-center rounded-[24px] border border-line bg-white px-5 pb-12 pt-[43px] text-center sm:px-[71px] sm:pb-[69px]">
        <div className="grid h-[156px] w-[176px] place-items-center rounded-[60px] bg-sage-125">
          <img src="/figma/adoption/paw-confirmation.svg" alt="" width={82} height={72.5669} className="h-[72.5669px] w-[82px]" />
        </div>
        <h1 className="mt-[34px] font-serif text-[36px] leading-[1.45] text-ink sm:text-[46px]">A lovely first step.</h1>
        <p className="mt-3 max-w-[796px] text-[16px] leading-[1.45] text-muted">
          Your application to meet {pet.name} has been sent to {pet.ownerName}.
          <br className="hidden sm:block" /> You can follow the conversation in your messages.
        </p>
        <p className="mt-[47px] inline-flex h-[30px] items-center rounded-full bg-sage-125 px-3 text-[12px] font-medium text-brand sm:w-[260px]" role="status">
          Application received
        </p>
        <div className="mt-10 w-full rounded-[16px] bg-sage-125 p-6 text-left">
          <h2 className="font-serif text-[22px] leading-[1.45] text-ink">Your next chapter</h2>
          <ol className="mt-[19px] space-y-0 text-[14px] leading-[1.45] text-muted">
            <li className="flex gap-3">
              <span className="w-5 shrink-0 tabular-nums">01</span>
              The {noun} reviews your home and care details.
            </li>
            <li className="flex gap-3">
              <span className="w-5 shrink-0 tabular-nums">02</span>
              They’ll contact you through Pawhaven with next steps.
            </li>
            <li className="flex gap-3">
              <span className="w-5 shrink-0 tabular-nums">03</span>
              Meet {pet.name} in person before making any commitment.
            </li>
          </ol>
        </div>
        <div className="mt-[46px] flex w-full flex-col justify-center gap-4 sm:flex-row sm:gap-6">
          <Button onClick={goToMessages} className="w-full !text-[14px] sm:w-[290px]">
            Go to messages
          </Button>
          <ButtonLink href="/pets" variant="outline" className="w-full !text-[14px] !text-brand sm:w-[290px]">
            Keep browsing
          </ButtonLink>
        </div>
        <Link href="/applications" className="mt-6 text-[14px] font-semibold text-brand hover:underline">
          Track your request
        </Link>
      </section>
    </div>
  );
}

export default function ApplicationSentPage() {
  return (
    <PageShell>
      <RequireAuth>
        <SentContent />
      </RequireAuth>
    </PageShell>
  );
}
