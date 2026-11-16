"use client";

/* eslint-disable @next/next/no-img-element */
import type { Conversation, Pet, User } from "@/lib/types";
import { listTime } from "./time";

export interface ConversationSummary {
  c: Conversation;
  other?: User;
  otherId: string;
  otherName: string;
  pet?: Pet;
  petName: string;
  lastAt?: string;
  preview: string;
  unread: boolean;
}

export function summarize(c: Conversation, meId: string, getUser: (id: string) => User | undefined, getPet: (id: string) => Pet | undefined): ConversationSummary {
  const otherId = c.participantIds.find((p) => p !== meId) ?? c.participantIds[0];
  const other = getUser(otherId);
  const pet = getPet(c.petId);
  const last = c.messages.at(-1);
  return {
    c,
    other,
    otherId,
    otherName: other?.name ?? "Pawhaven member",
    pet,
    petName: pet?.name ?? "a past listing",
    lastAt: last?.at,
    preview: last ? `${last.fromId === meId ? "You: " : ""}${last.text}` : "No messages yet — say hello.",
    unread: c.messages.some((m) => m.fromId !== meId && m.at > (c.lastReadAt[meId] ?? "")),
  };
}

export function ConversationList({
  items,
  query,
  onQuery,
  activeId,
  onSelect,
}: {
  items: ConversationSummary[];
  query: string;
  onQuery: (q: string) => void;
  activeId?: string;
  onSelect: (id: string) => void;
}) {
  const q = query.trim().toLowerCase();
  const filtered = q ? items.filter((s) => s.otherName.toLowerCase().includes(q) || s.petName.toLowerCase().includes(q)) : items;

  return (
    <section aria-label="Conversations" className="flex min-h-0 flex-col rounded-[16px] border border-field bg-white md:h-[729px]">
      <div className="px-[17px] pb-4 pt-[19px]">
        <label htmlFor="conversation-search" className="block text-[13px] font-medium leading-[1.5] text-ink">
          Search conversations
        </label>
        <input
          id="conversation-search"
          type="search"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Search by pet or person"
          className="mt-2 h-[50px] w-full rounded-[16px] border border-field bg-white px-[13px] text-[14px] text-ink outline-none placeholder:text-ink transition focus:border-brand focus:ring-2 focus:ring-brand/15"
        />
      </div>
      <ul className="flex min-h-0 flex-1 flex-col gap-[14px] overflow-y-auto px-[11px] pb-4 pt-[14px]">
        {filtered.map((s) => {
          const active = s.c.id === activeId;
          return (
            <li key={s.c.id}>
              <button
                type="button"
                onClick={() => onSelect(s.c.id)}
                aria-current={active ? "true" : undefined}
                className={`relative w-full rounded-[12px] px-4 pb-[18px] pt-[18px] text-left transition ${
                  active ? "bg-sage-150" : "bg-sand-50 hover:bg-sage-50"
                }`}
              >
                <span className="flex items-start gap-4">
                  <span className="grid h-8 w-8 shrink-0 place-items-center pt-0.5" aria-hidden>
                    <img src="/figma/app/paw-artwork.svg" alt="" width={32} height={28.3188} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate text-[15px] leading-[1.5] text-ink ${s.unread ? "font-bold" : "font-semibold"}`}>{s.otherName}</span>
                    <span className="mt-[9px] block truncate text-[11px] leading-[1.5] text-muted">
                      About {s.petName}
                      {s.lastAt ? ` · ${listTime(s.lastAt)}` : ""}
                    </span>
                  </span>
                  {s.unread && (
                    <span className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase text-brand">
                      <span className="size-2 rounded-full bg-brand" aria-hidden />
                      <span className="sr-only">Unread</span>
                    </span>
                  )}
                </span>
                <span className={`mt-[15px] block truncate text-[12px] leading-[1.5] ${s.unread ? "font-semibold text-ink" : "text-muted"}`}>{s.preview}</span>
              </button>
            </li>
          );
        })}
        {filtered.length === 0 && (
          <li className="px-3 py-8 text-center text-[13px] text-muted">
            No conversations match “{query.trim()}”.
          </li>
        )}
      </ul>
    </section>
  );
}
