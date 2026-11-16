"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { LoadingBlock, PageShell, RequireAuth } from "@/components/layout/PageShell";
import { ButtonLink } from "@/components/ui/Button";
import { PawArtwork } from "@/components/post/PostWizard";
import { possessive } from "@/components/post/wizard";
import { useStore } from "@/lib/store";
import { PET_STATUS_LABEL } from "@/lib/format";

function Submitted() {
  const params = useSearchParams();
  const { getPet, currentUser } = useStore();
  const id = params.get("id") ?? "";
  const updated = params.get("updated") === "1";
  const pet = id ? getPet(id) : undefined;
  const mine = pet && pet.ownerId === currentUser?.id ? pet : undefined;
  const name = mine?.name ?? "";
  const pending = !mine || mine.status === "pending_review";

  return (
    <div className="container-page pb-10 pt-12 md:pt-[69px]">
      <section className="mx-auto max-w-[856px] rounded-[24px] border border-line bg-white px-5 pb-12 pt-10 text-center sm:px-10">
        <div className="mx-auto grid h-[118px] w-[128px] place-items-center rounded-[32px] bg-sage-150">
          <PawArtwork width={64} />
        </div>
        <h1 className="mt-[39px] font-serif text-[32px] leading-[1.2] text-ink md:text-[40px]">
          {name ? `${possessive(name)} next chapter starts here.` : "Their next chapter starts here."}
        </h1>
        <p className="mt-5 text-[17px] leading-[1.5] text-ink">
          {updated ? "Your changes have been submitted for review." : "Your listing has been submitted for review."}
        </p>
        <span className="mt-[26px] inline-flex h-[34px] items-center rounded-full bg-warning-50 px-4 text-[13px] font-semibold text-warning">
          {pending ? "Pending review" : PET_STATUS_LABEL[mine.status]}
        </span>
        <p className="mx-auto mt-[35px] max-w-[736px] text-[15px] leading-[1.55] text-muted">
          It isn’t public yet. We’ll notify you when the review is complete. You can edit your details or follow its status from My listings.
        </p>
        <div className="mx-auto mt-[54px] flex max-w-[486px] flex-col gap-4">
          <ButtonLink href="/my-listings" className="w-full">
            Go to My listings
          </ButtonLink>
          {mine && (
            <ButtonLink href={`/pets/${mine.id}`} variant="outline" className="w-full">
              Preview {possessive(name)} listing
            </ButtonLink>
          )}
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[14px] font-semibold text-brand">
          <Link href="/post" className="hover:underline">
            Post another pet
          </Link>
          <Link href="/" className="hover:underline">
            Back to home
          </Link>
        </div>
      </section>
      <p className="mt-12 text-center text-[14px] leading-[1.5] text-muted">A little care now makes a big difference later.</p>
    </div>
  );
}

export default function ListingSubmittedPage() {
  return (
    <PageShell>
      <RequireAuth>
        <Suspense fallback={<LoadingBlock />}>
          <Submitted />
        </Suspense>
      </RequireAuth>
    </PageShell>
  );
}
