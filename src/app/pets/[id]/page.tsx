"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { EmptyState, LoadingBlock, PageShell } from "@/components/layout/PageShell";
import { ButtonLink, buttonClass } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { SaveButton } from "@/components/pets/PetCard";
import { ListingPill } from "@/components/pets/PetListingCard";
import { ReportListingModal } from "@/components/pets/ReportListingModal";
import { useStore } from "@/lib/store";
import type { ArtTone, Pet } from "@/lib/types";
import { formatAge, formatFee, PET_STATUS_LABEL, sexLabel, SPECIES_LABEL, SPECIES_SINGULAR, TONE_BG } from "@/lib/format";

const STATE_NAMES: Record<string, string> = { TX: "Texas", CA: "California", NY: "New York", FL: "Florida", WA: "Washington", OR: "Oregon", CO: "Colorado", IL: "Illinois" };
const longCity = (city: string) => city.replace(/,\s*([A-Z]{2})$/, (_, s: string) => `, ${STATE_NAMES[s] ?? s}`);

const GOOD_WITH_LABEL: Record<string, string> = {
  kids: "Good with kids",
  dogs: "Good with dogs",
  cats: "Good with cats",
  "first-time owners": "Great for first-time owners",
};

type GalleryItem = { kind: "photo"; src: string } | { kind: "art"; tone: ArtTone };

function galleryFor(pet: Pet): GalleryItem[] {
  if (pet.photos.length) return pet.photos.map((src) => ({ kind: "photo", src }));
  const alt: ArtTone = pet.tone === "peach" ? "green" : "peach";
  return [pet.tone, alt, pet.tone].map((tone) => ({ kind: "art", tone }));
}

function Gallery({ pet }: { pet: Pet }) {
  const items = galleryFor(pet);
  const [index, setIndex] = useState(0);
  const current = items[Math.min(index, items.length - 1)];
  return (
    <div>
      <div className={`relative h-[260px] overflow-hidden rounded-[24px] sm:h-[388px] ${current.kind === "art" ? TONE_BG[current.tone] : "bg-sand-100"}`}>
        {current.kind === "photo" ? (
          <img src={current.src} alt={`Photo of ${pet.name}`} className="size-full object-cover" />
        ) : (
          <div className="grid size-full place-items-center">
            <img src="/figma/discover/profile-paw-hero.svg" alt="" width={174} height={154} className="w-[120px] sm:w-[174px]" style={{ height: "auto" }} />
          </div>
        )}
        <div className="absolute left-5 top-5">
          <ListingPill type={pet.listingType} onArt="white" />
        </div>
        <div className="absolute right-5 top-5">
          <SaveButton pet={pet} size={32} tone="brand" />
        </div>
      </div>
      {items.length > 1 && (
        <div className="mt-5 flex gap-4 overflow-x-auto pb-1" role="group" aria-label={`${pet.name}’s gallery`}>
          {items.map((it, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show view ${i + 1} of ${items.length}`}
              aria-pressed={i === index}
              className={`grid h-[84px] w-[128px] shrink-0 place-items-center overflow-hidden rounded-[12px] transition ${
                it.kind === "art" ? TONE_BG[it.tone] : "bg-sand-100"
              } ${i === index ? "ring-2 ring-brand ring-offset-2 ring-offset-canvas" : "hover:opacity-80"}`}
            >
              {it.kind === "photo" ? (
                <img src={it.src} alt="" className="size-full object-cover" />
              ) : (
                <img src="/figma/discover/profile-paw-thumb.svg" alt="" width={34} height={30} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CareRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,140px)_1fr] gap-4 border-b border-field py-[13px] sm:grid-cols-[338px_1fr] sm:gap-0">
      <dt className="text-[14px] leading-[1.5] text-muted">{label}</dt>
      <dd className="text-[14px] font-medium leading-[1.5] text-ink">{value}</dd>
    </div>
  );
}

const yesNo = (v: boolean) => (v ? "Yes" : "No");

export default function PetProfilePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const toast = useToast();
  const { ready, getPet, currentUser, incrementViews, startConversation, startEditing, applicationsForPet } = useStore();
  const [reportOpen, setReportOpen] = useState(false);
  const viewed = useRef(false);

  const pet = getPet(id);
  const isOwner = !!pet && !!currentUser && pet.ownerId === currentUser.id;
  const visible = !!pet && (pet.status === "active" || isOwner);

  useEffect(() => {
    if (!ready || viewed.current || !pet || pet.status !== "active" || isOwner) return;
    viewed.current = true;
    incrementViews(pet.id);
  }, [ready, pet, isOwner, incrementViews]);

  if (!ready) {
    return (
      <PageShell>
        <LoadingBlock label="Fetching this companion…" />
      </PageShell>
    );
  }

  if (!pet || !visible) {
    const adopted = pet?.status === "adopted";
    return (
      <PageShell>
        <EmptyState
          as="h1"
          title={adopted ? `${pet!.name} has found a home` : "We couldn’t find that pet"}
          body={adopted ? "This companion has already been adopted. There are plenty more friends waiting to meet you." : "This listing may have been adopted, paused or removed by its owner."}
          action={<ButtonLink href="/pets">Find a pet</ButtonLink>}
          secondary={currentUser ? <Link href="/saved" className="text-[14px] font-semibold text-brand">View saved pets</Link> : undefined}
        />
      </PageShell>
    );
  }

  const isShelter = pet.ownerType === "shelter";
  const pronoun = pet.sex === "female" ? "her" : "his";
  const ownerLabel = isShelter ? "the shelter" : "the pet parent";
  const loginFor = (next: string) => `/login?next=${encodeURIComponent(next)}`;
  const requests = isOwner ? applicationsForPet(pet.id).filter((a) => a.status !== "withdrawn").length : 0;
  const lead = pet.temperament[0]?.toLowerCase() ?? "lovely";

  const onApply = () => {
    const target = `/pets/${pet.id}/apply`;
    router.push(currentUser ? target : loginFor(target));
  };

  const onMessage = () => {
    if (!currentUser) {
      toast("Log in to message " + ownerLabel + ".", "info");
      router.push(loginFor(`/pets/${pet.id}`));
      return;
    }
    const r = startConversation(pet.id);
    if (!r.ok) {
      toast(r.error, "error");
      return;
    }
    router.push(`/messages?c=${r.data.id}`);
  };

  const onShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast("Link copied to clipboard");
      return;
    } catch {
      /* Clipboard API blocked (permissions / embedded browser) — fall back below. */
    }
    const ta = document.createElement("textarea");
    ta.value = url;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const copied = document.execCommand("copy");
    ta.remove();
    if (copied) toast("Link copied to clipboard");
    else toast("Couldn’t copy the link — copy it from your address bar.", "error");
  };

  // Logged-out visitors can open the dialog; it asks them to log in before submitting.
  const onReport = () => setReportOpen(true);

  const onEdit = () => {
    startEditing(pet.id);
    router.push("/post");
  };

  const careNeeds = pet.health.notes.trim() || (pet.health.specialNeeds ? "Has special needs — ask " + ownerLabel + " for details" : "No special care needs");

  return (
    <PageShell>
      <div className="container-page pb-16 pt-6 md:pt-[29px]">
        <nav aria-label="Breadcrumb" className="text-[12px] leading-[1.5] text-muted">
          <ol className="flex flex-wrap items-center gap-x-2">
            <li><Link href="/pets" className="hover:text-brand">Find a pet</Link></li>
            <li aria-hidden>/</li>
            <li><Link href={`/pets?species=${pet.species}`} className="hover:text-brand">{SPECIES_LABEL[pet.species]}</Link></li>
            <li aria-hidden>/</li>
            <li aria-current="page">{pet.name}</li>
          </ol>
        </nav>

        <div className="mt-5 grid gap-10 lg:mt-[22px] lg:grid-cols-[minmax(0,840px)_minmax(0,408px)] lg:grid-rows-[auto_1fr] lg:justify-between lg:gap-x-12 lg:gap-y-0">
          {/* Top: title + gallery */}
          <div className="min-w-0">
            <h1 className="font-serif text-[38px] leading-[1.2] text-ink md:text-[48px]">Meet {pet.name}.</h1>
            <p className="mt-[14px] text-[16px] leading-[1.5] text-muted">
              {pet.breed} · {formatAge(pet.ageMonths)} · {sexLabel(pet.sex)} · {pet.city}
            </p>
            <div className="mt-7">
              <Gallery pet={pet} />
            </div>
          </div>

          {/* Aside: adopt card + guidance */}
          <aside className="min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-1" aria-label={`Adopt ${pet.name}`}>
            <div className="rounded-[16px] border border-field bg-white p-6 sm:p-[27px]">
              {isOwner ? (
                <>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-brand">Your listing · {PET_STATUS_LABEL[pet.status]}</p>
                  <h2 className="mt-3 font-serif text-[26px] leading-[1.2] text-ink">A home for {pet.name}</h2>
                  <p className="mt-6 text-[13px] leading-[1.5] text-muted">{pet.listingType === "adoption" ? "Adoption fee" : "Rehoming fee"}</p>
                  <p className="text-[40px] font-semibold leading-[1.5] text-ink">{formatFee(pet.fee)}</p>
                  <p className="mt-1 text-[13px] leading-[1.5] text-muted">
                    {pet.views} {pet.views === 1 ? "view" : "views"} · {requests} adoption {requests === 1 ? "request" : "requests"}
                  </p>
                  {pet.status !== "active" && (
                    <p className="mt-4 rounded-[12px] bg-warning-50 px-4 py-3 text-[13px] leading-[1.5] text-warning">
                      Only you can see this page while the listing is {PET_STATUS_LABEL[pet.status].toLowerCase()}.
                    </p>
                  )}
                  <button type="button" onClick={onEdit} className={buttonClass("primary", "md", "mt-6 w-full text-[14px]")}>
                    Edit listing
                  </button>
                  <ButtonLink href={`/my-listings/${pet.id}/requests`} variant="outline" className="mt-4 w-full text-[14px] !text-brand">
                    View requests{requests ? ` (${requests})` : ""}
                  </ButtonLink>
                  <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 border-t border-field pt-5">
                    <Link href="/my-listings" className="text-[12px] font-medium text-brand hover:underline">Manage all listings</Link>
                    <button type="button" onClick={onShare} className="text-[12px] font-medium text-brand hover:underline">Copy link</button>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="font-serif text-[26px] leading-[1.2] text-ink">A home for {pet.name}</h2>
                  <p className="mt-[25px] text-[13px] leading-[1.5] text-muted">{pet.listingType === "adoption" ? "Adoption fee" : "Rehoming fee"}</p>
                  <p className="text-[40px] font-semibold leading-[1.5] text-ink">{formatFee(pet.fee)}</p>
                  <p className="mt-[7px] text-[13px] leading-[1.5] text-muted">
                    {isShelter ? "Helps cover veterinary care and rescue costs." : "Helps make sure every new home is a committed one."}
                    <br />
                    No payment is collected on Pawhaven.
                  </p>
                  <button type="button" onClick={onApply} className={buttonClass("primary", "md", "mt-[23px] w-full text-[14px]")}>
                    Apply to adopt {pet.name}
                  </button>
                  <button type="button" onClick={onMessage} className="mt-4 h-[50px] w-full rounded-full border border-field bg-white text-[14px] font-semibold text-brand transition hover:border-brand">
                    Message {ownerLabel}
                  </button>
                  <div className="mt-[30px] border-t border-field pt-[23px]">
                    <div className="flex items-center gap-[18px]">
                      <img src="/figma/discover/profile-paw-owner.svg" alt="" width={41} height={36} className="shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[16px] font-semibold leading-[1.5] text-ink">{isShelter ? pet.ownerName : pet.ownerName.split(" ")[0]}</p>
                        <p className="text-[12px] leading-[1.5] text-muted">
                          {longCity(pet.city)} · {isShelter ? "Shelter / rescue" : "Private pet parent"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="mt-8 text-[13px] leading-[1.5] text-muted">
                    Meet first. Ask for health records.
                    <br />
                    Never send money before meeting a pet.
                  </p>
                  <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2">
                    <button type="button" onClick={onReport} className="text-[12px] font-medium text-brand hover:underline">
                      Report this listing
                    </button>
                    <button type="button" onClick={onShare} className="text-[12px] font-medium text-brand hover:underline">
                      Share
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="mt-7 rounded-[16px] bg-peach-100 p-6">
              <h2 className="font-serif text-[24px] leading-[1.2] text-ink">A match, not a transaction.</h2>
              <p className="mt-[46px] max-w-[300px] text-[14px] leading-[1.5] text-muted">
                An application starts a conversation. The {isShelter ? "shelter" : "pet parent"} will review your home and lifestyle before arranging a meeting.
              </p>
            </div>
          </aside>

          {/* Bottom: story, traits, health */}
          <div className="min-w-0 lg:pt-[37px]">
            <h2 className="font-serif text-[26px] leading-[1.2] text-ink md:text-[30px]">
              A {lead} soul, ready for {pronoun} people.
            </h2>
            <p className="mt-[23px] max-w-[600px] whitespace-pre-line text-[16px] leading-[1.5] text-muted">{pet.story}</p>

            {(pet.temperament.length > 0 || pet.goodWith.length > 0) && (
              <ul className="mt-[39px] flex flex-wrap gap-3" aria-label="Temperament and good with">
                {pet.temperament.map((t) => (
                  <li key={t} className="inline-flex h-7 min-w-[86px] items-center rounded-[14px] bg-sage-150 px-2.5 text-[11px] font-medium text-ink">{t}</li>
                ))}
                {pet.goodWith.map((g) => (
                  <li key={g} className="inline-flex h-7 min-w-[86px] items-center rounded-[14px] bg-sage-150 px-2.5 text-[11px] font-medium text-ink">{GOOD_WITH_LABEL[g] ?? `Good with ${g}`}</li>
                ))}
              </ul>
            )}

            {pet.listingType === "rehoming" && pet.reasonForRehoming && (
              <div className="mt-10 rounded-[16px] bg-peach-50 p-6">
                <h3 className="text-[16px] font-semibold leading-[1.5] text-ink">Why {pet.name} needs a new home</h3>
                <p className="mt-2 text-[14px] leading-[1.55] text-muted">{pet.reasonForRehoming}</p>
              </div>
            )}

            <h2 className="mt-[43px] text-[24px] font-semibold leading-[1.5] text-ink">About {pet.name}</h2>
            <dl className="mt-[14px]">
              <CareRow label="Species" value={SPECIES_SINGULAR[pet.species]} />
              <CareRow label="Breed" value={pet.breed} />
              <CareRow label="Age" value={formatAge(pet.ageMonths)} />
              <CareRow label="Sex" value={sexLabel(pet.sex)} />
              <CareRow label="Size" value={pet.size[0].toUpperCase() + pet.size.slice(1)} />
              {pet.color && <CareRow label="Colour" value={pet.color} />}
            </dl>

            <h2 className="mt-[43px] text-[24px] font-semibold leading-[1.5] text-ink">Health &amp; everyday care</h2>
            <dl className="mt-[14px]">
              <CareRow label="Vaccinated" value={yesNo(pet.health.vaccinated)} />
              <CareRow label="Spayed / neutered" value={yesNo(pet.health.spayedNeutered)} />
              <CareRow label="Microchipped" value={yesNo(pet.health.microchipped)} />
              <CareRow label="Dewormed" value={yesNo(pet.health.dewormed)} />
              <CareRow label="Care needs" value={careNeeds} />
            </dl>
          </div>
        </div>
      </div>

      <ReportListingModal pet={pet} open={reportOpen} onClose={() => setReportOpen(false)} />
    </PageShell>
  );
}
