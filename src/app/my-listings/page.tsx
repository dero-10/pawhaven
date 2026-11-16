"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { EmptyState, PageShell, RequireAuth } from "@/components/layout/PageShell";
import { ButtonLink } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { PetArt } from "@/components/pets/PetCard";
import { PawArtwork } from "@/components/post/PostWizard";
import { ListingMenu, type MenuItem } from "@/components/post/ListingMenu";
import { useStore } from "@/lib/store";
import { formatDate, PET_STATUS_LABEL } from "@/lib/format";
import type { Pet, PetDraft, PetStatus } from "@/lib/types";

const STATUS_TONE: Record<PetStatus, string> = {
  active: "bg-sage-150 text-brand",
  pending_review: "bg-warning-50 text-warning",
  draft: "bg-sand-200 text-muted",
  paused: "bg-lilac-100 text-ink",
  adopted: "bg-peach-100 text-ink",
  rejected: "bg-danger-50 text-danger",
};

type Tab = "all" | PetStatus;

function StatusBadge({ status }: { status: PetStatus }) {
  return (
    <span className={`inline-flex h-[28px] items-center rounded-full px-[10px] text-[12px] font-semibold md:w-[130px] ${STATUS_TONE[status]}`}>
      {PET_STATUS_LABEL[status]}
    </span>
  );
}

function updatedLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((startOf(today) - startOf(d)) / 86400000);
  if (diff <= 0) return "Today";
  if (diff === 1) return "Yesterday";
  return formatDate(iso);
}

const hasContent = (d: PetDraft | null): boolean => !!d && !d.editingId && !!(d.name.trim() || d.breed.trim() || d.species || d.story.trim());

type Pending =
  | { kind: "delete"; pet: Pet }
  | { kind: "adopted"; pet: Pet }
  | { kind: "discard" }
  | { kind: "replace"; pet: Pet };

function MyListings() {
  const router = useRouter();
  const toast = useToast();
  const { db, myPets, applicationsForPet, startEditing, setPetStatus, deletePet, clearDraft } = useStore();
  const [tab, setTab] = useState<Tab>("all");
  const [pending, setPending] = useState<Pending | null>(null);

  const pets = [...myPets()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const draft = hasContent(db.draft) ? db.draft : null;
  const editingId = db.draft?.editingId;

  const count = (s: PetStatus) => pets.filter((p) => p.status === s).length + (s === "draft" && draft ? 1 : 0);
  const newRequests = pets.reduce((n, p) => n + applicationsForPet(p.id).filter((a) => a.status === "submitted").length, 0);
  const total = pets.length + (draft ? 1 : 0);

  if (total === 0) {
    return (
      <EmptyState
        as="h1"
        title="No listings yet"
        body="When you post a pet, you’ll manage the listing and the people hoping to meet them right here."
        action={<ButtonLink href="/post">+&nbsp;&nbsp;Post a pet</ButtonLink>}
      />
    );
  }

  const tabs: { key: Tab; label: string; n: number }[] = [
    { key: "all", label: "All listings", n: total },
    { key: "active", label: "Live", n: count("active") },
    { key: "pending_review", label: "In review", n: count("pending_review") },
    { key: "draft", label: "Drafts", n: count("draft") },
    ...(["paused", "rejected", "adopted"] as const).filter((s) => count(s) > 0).map((s) => ({ key: s as Tab, label: PET_STATUS_LABEL[s], n: count(s) })),
  ];

  const visible = tab === "all" ? pets : pets.filter((p) => p.status === tab);
  const showDraft = !!draft && (tab === "all" || tab === "draft");

  const edit = (pet: Pet) => {
    if (db.draft && editingId === pet.id) return router.push("/post");
    if (hasContent(db.draft) || (db.draft?.editingId && db.draft.editingId !== pet.id)) return setPending({ kind: "replace", pet });
    startEditing(pet.id);
    router.push("/post");
  };

  const menuFor = (pet: Pet): MenuItem[] => {
    const apps = applicationsForPet(pet.id).length;
    const items: MenuItem[] = [
      { label: "View listing", href: `/pets/${pet.id}` },
      { label: editingId === pet.id ? "Continue editing" : "Edit listing", onSelect: () => edit(pet) },
      { label: `Review requests${apps ? ` (${apps})` : ""}`, href: `/my-listings/${pet.id}/requests` },
    ];
    if (pet.status === "active")
      items.push({ label: "Pause listing", onSelect: () => {
          setPetStatus(pet.id, "paused");
          toast(`${pet.name} is paused and hidden from search`);
        } });
    if (pet.status === "paused")
      items.push({ label: "Resume listing", onSelect: () => {
          setPetStatus(pet.id, "active");
          toast(`${pet.name} is live again`);
        } });
    if (pet.status === "active" || pet.status === "paused" || pet.status === "pending_review")
      items.push({ label: "Mark as adopted", onSelect: () => setPending({ kind: "adopted", pet }) });
    items.push({ label: "Delete listing", tone: "danger", onSelect: () => setPending({ kind: "delete", pet }) });
    return items;
  };

  const primaryAction = (pet: Pet) => {
    const btn = "inline-flex h-[50px] w-full items-center justify-center rounded-full border border-line bg-white px-6 text-[14px] font-semibold text-brand transition hover:border-brand md:w-[164px]";
    if (pet.status === "pending_review" || pet.status === "rejected") {
      return (
        <div className="flex items-center gap-2">
          <button type="button" className={btn} onClick={() => edit(pet)} aria-label={`${editingId === pet.id ? "Continue editing" : "Edit"} ${pet.name}`}>
            {editingId === pet.id ? "Continue" : "Edit"}
          </button>
          <ListingMenu variant="icon" label="⋯" ariaLabel={`More actions for ${pet.name}`} items={menuFor(pet)} />
        </div>
      );
    }
    return <ListingMenu label="Manage" ariaLabel={`Manage ${pet.name}`} items={menuFor(pet)} />;
  };

  const grid = "md:grid md:grid-cols-[368fr_234fr_184fr_222fr_244fr] md:items-center";

  return (
    <div className="container-page pb-10 pt-10 md:pt-12">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="font-serif text-[32px] leading-[1.2] text-ink md:text-[41px]">Their next chapter, in your hands.</h1>
          <p className="mt-4 text-[15px] leading-[1.5] text-muted">Manage your listings and the people hoping to meet your pets.</p>
        </div>
        <ButtonLink href="/post" className="w-full md:mt-1.5 md:w-[208px]">
          +&nbsp;&nbsp;Post a pet
        </ButtonLink>
      </div>

      {/* Stats */}
      <dl className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-6">
        {[
          { label: "Live listings", n: count("active") },
          { label: "Pending review", n: count("pending_review") },
          { label: "Drafts", n: count("draft") },
          { label: "New adoption requests", n: newRequests },
        ].map((s) => (
          <div key={s.label} className="rounded-[16px] border border-line bg-white px-[22px] pb-4 pt-5">
            <dt className="text-[13px] leading-[1.5] text-muted">{s.label}</dt>
            <dd className="mt-2 font-serif text-[36px] leading-[1.5] text-ink">{s.n}</dd>
          </div>
        ))}
      </dl>

      {/* Tabs */}
      <div role="tablist" aria-label="Filter listings by status" className="mt-10 flex gap-x-8 gap-y-2 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            role="tab"
            type="button"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`whitespace-nowrap border-b-2 pb-1.5 text-[14px] leading-[1.5] transition ${
              tab === t.key ? "border-brand font-semibold text-brand" : "border-transparent text-ink hover:text-brand"
            }`}
          >
            {t.label} ({t.n})
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="mt-6 rounded-[16px] border border-line bg-white" role="tabpanel">
        <div className={`hidden rounded-t-[16px] bg-sand-100 px-[22px] py-4 text-[12px] font-semibold uppercase tracking-wide text-muted ${grid}`}>
          <span>Pet</span>
          <span>Status</span>
          <span>Requests</span>
          <span>Last updated</span>
          <span>Actions</span>
        </div>
        <ul className="divide-y divide-line px-4 md:px-[22px]">
          {showDraft && draft && (
            <li className={`flex flex-col gap-4 py-5 ${grid}`}>
              <div className="flex items-center gap-[22px]">
                <div className="grid size-[76px] shrink-0 place-items-center overflow-hidden rounded-[14px] bg-sage-150">
                  {draft.photos[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={draft.photos[0]} alt="" className="size-full object-cover" />
                  ) : (
                    <PawArtwork width={32} />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[19px] font-semibold leading-[1.5] text-ink">{draft.name.trim() || "Untitled draft"}</p>
                  <p className="truncate text-[12px] leading-[1.5] text-muted">{draft.breed.trim() || "Not finished yet"}</p>
                </div>
              </div>
              <div>
                <StatusBadge status="draft" />
              </div>
              <span className="text-[14px] text-muted md:block">—</span>
              <span className="text-[13px] text-muted">Not submitted</span>
              <div className="flex items-center gap-2">
                <Link href="/post" className="inline-flex h-[50px] w-full items-center justify-center rounded-full border border-line bg-white px-6 text-[14px] font-semibold text-brand transition hover:border-brand md:w-[164px]">
                  Continue
                </Link>
                <ListingMenu variant="icon" label="⋯" ariaLabel="More actions for draft" items={[{ label: "Discard draft", tone: "danger", onSelect: () => setPending({ kind: "discard" }) }]} />
              </div>
            </li>
          )}
          {visible.map((pet) => {
            const apps = applicationsForPet(pet.id);
            const fresh = apps.filter((a) => a.status === "submitted").length;
            return (
              <li key={pet.id} className="py-5">
                <div className={`flex flex-col gap-4 ${grid}`}>
                  <div className="flex items-center gap-[22px]">
                    <Link href={`/pets/${pet.id}`} className="size-[76px] shrink-0 overflow-hidden rounded-[14px]" aria-label={`View ${pet.name}`}>
                      <PetArt pet={pet} pawSize={32} />
                    </Link>
                    <div className="min-w-0">
                      <Link href={`/pets/${pet.id}`} className="block truncate text-[19px] font-semibold leading-[1.5] text-ink hover:text-brand">
                        {pet.name}
                      </Link>
                      <p className="truncate text-[12px] leading-[1.5] text-muted">
                        {pet.breed}
                        {pet.fee > 0 ? ` · $${pet.fee} fee` : ""}
                      </p>
                      <p className="text-[12px] leading-[1.5] text-muted">
                        {pet.views} view{pet.views === 1 ? "" : "s"}
                        {editingId === pet.id && <span className="ml-2 font-semibold text-warning">· Edit in progress</span>}
                      </p>
                    </div>
                  </div>
                  <div>
                    <StatusBadge status={pet.status} />
                  </div>
                  <div className="text-[14px] leading-[1.5]">
                    {apps.length === 0 ? (
                      <span className="text-muted">—</span>
                    ) : (
                      <Link href={`/my-listings/${pet.id}/requests`} className="font-semibold text-brand hover:underline">
                        {fresh > 0 ? `${fresh} new` : `${apps.length} total`}
                        <span className="sr-only"> adoption requests for {pet.name}</span>
                      </Link>
                    )}
                  </div>
                  <span className="text-[13px] leading-[1.5] text-ink">
                    <span className="text-muted md:hidden">Updated </span>
                    {updatedLabel(pet.updatedAt)}
                  </span>
                  <div>{primaryAction(pet)}</div>
                </div>
                {pet.status === "rejected" && (
                  <div className="mt-4 rounded-[12px] bg-danger-50 px-4 py-3 text-[13px] leading-[1.5] text-danger">
                    <span className="font-semibold">Moderator note: </span>
                    {pet.moderationNote || "This listing needs changes before it can go live. Edit the listing and submit it again."}
                  </div>
                )}
              </li>
            );
          })}
          {visible.length === 0 && !showDraft && <li className="py-10 text-center text-[14px] text-muted">No listings in this view yet.</li>}
        </ul>
      </div>

      {/* Guidance */}
      <div className="mt-[38px] flex flex-col gap-2 rounded-[16px] bg-sage-150 px-6 py-[17px] md:flex-row md:items-center md:gap-6">
        <p className="shrink-0 text-[18px] font-semibold leading-[1.5] text-ink md:w-[200px]">Found a home?</p>
        <p className="text-[14px] leading-[1.5] text-muted">Open Manage to pause a listing, mark your pet as rehomed, or remove it. Keep availability up to date.</p>
      </div>

      <ConfirmDialog
        open={pending?.kind === "delete"}
        title={pending?.kind === "delete" ? `Delete ${pending.pet.name}’s listing?` : ""}
        body="The listing and its adoption requests will be permanently removed. This can’t be undone."
        confirmLabel="Delete listing"
        tone="danger"
        onClose={() => setPending(null)}
        onConfirm={() => {
          if (pending?.kind === "delete") {
            if (editingId === pending.pet.id) clearDraft();
            deletePet(pending.pet.id);
            toast(`${pending.pet.name}’s listing was deleted`);
          }
          setPending(null);
        }}
      />
      <ConfirmDialog
        open={pending?.kind === "adopted"}
        title={pending?.kind === "adopted" ? `Mark ${pending.pet.name} as adopted?` : ""}
        body="Congratulations! The listing will be hidden from search and no new requests can be sent."
        confirmLabel="Mark as adopted"
        onClose={() => setPending(null)}
        onConfirm={() => {
          if (pending?.kind === "adopted") {
            setPetStatus(pending.pet.id, "adopted");
            toast(`${pending.pet.name} is marked as adopted`);
          }
          setPending(null);
        }}
      />
      <ConfirmDialog
        open={pending?.kind === "discard"}
        title="Discard this draft?"
        body="Everything entered in this draft will be deleted. This can’t be undone."
        confirmLabel="Discard draft"
        tone="danger"
        onClose={() => setPending(null)}
        onConfirm={() => {
          clearDraft();
          toast("Draft discarded");
          setPending(null);
        }}
      />
      <ConfirmDialog
        open={pending?.kind === "replace"}
        title="Replace your current draft?"
        body={
          db.draft?.editingId
            ? `You have unsaved edits to ${db.pets.find((p) => p.id === db.draft?.editingId)?.name ?? "another listing"}. Editing this listing will discard them.`
            : `You have an unfinished draft${db.draft?.name ? ` for ${db.draft.name}` : ""}. Editing this listing will replace it.`
        }
        confirmLabel="Discard and edit"
        tone="danger"
        onClose={() => setPending(null)}
        onConfirm={() => {
          if (pending?.kind === "replace") {
            startEditing(pending.pet.id);
            setPending(null);
            router.push("/post");
          }
        }}
      />
    </div>
  );
}

export default function MyListingsPage() {
  return (
    <PageShell>
      <RequireAuth>
        <MyListings />
      </RequireAuth>
    </PageShell>
  );
}
