"use client";

/**
 * Mock data layer. All app state lives in one localStorage-backed DB object.
 * Every mutation goes through an action below, so swapping to Supabase later
 * means re-implementing these actions — pages never touch localStorage directly.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createSeed } from "./seed";
import type {
  Application,
  ApplicationStatus,
  Conversation,
  DB,
  Pet,
  PetDraft,
  PetStatus,
  Report,
  ReportReason,
  User,
} from "./types";

const STORAGE_KEY = "pawhaven-db-v1";

export const uid = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
const nowIso = () => new Date().toISOString();

export const emptyDraft = (): PetDraft => ({
  name: "",
  species: "",
  breed: "",
  ageMonths: "",
  sex: "",
  size: "",
  color: "",
  city: "",
  listingType: "rehoming",
  fee: "",
  health: { vaccinated: false, spayedNeutered: false, microchipped: false, dewormed: false, specialNeeds: false, notes: "" },
  temperament: [],
  goodWith: [],
  story: "",
  reasonForRehoming: "",
  photos: [],
});

type Result<T = void> = { ok: true; data: T } | { ok: false; error: string };
const ok = <T,>(data: T): Result<T> => ({ ok: true, data });
const fail = (error: string): Result<never> => ({ ok: false, error });

export interface StoreValue {
  db: DB;
  /** false until localStorage has been read on the client. Render skeletons/loading until true. */
  ready: boolean;
  currentUser: User | null;

  // auth
  login(email: string, password: string): Result<User>;
  signup(input: { name: string; email: string; password: string; city: string; accountType: "private" | "shelter" }): Result<User>;
  logout(): void;
  verifyEmail(code: string): Result;
  resendVerification(): void;
  requestPasswordReset(email: string): Result<string>; // returns mock token
  resetPassword(token: string, password: string): Result;

  // account
  updateProfile(patch: Partial<Pick<User, "name" | "email" | "city" | "phone" | "bio" | "preferences">>): Result;
  changePassword(current: string, next: string): Result;
  deleteAccount(): void;

  // pets
  getPet(id: string): Pet | undefined;
  publicPets(): Pet[]; // active only
  myPets(): Pet[];
  isSaved(petId: string): boolean;
  toggleSave(petId: string): boolean; // returns new saved state; false + no-op if logged out
  savedPets(): Pet[];
  incrementViews(petId: string): void;

  // post-a-pet wizard
  saveDraft(patch: Partial<PetDraft>): void;
  startEditing(petId: string): void;
  clearDraft(): void;
  submitDraft(): Result<Pet>;
  setPetStatus(petId: string, status: PetStatus, note?: string): void;
  deletePet(petId: string): void;

  // applications
  submitApplication(petId: string, answers: Application["answers"]): Result<Application>;
  myApplications(): Application[];
  applicationsForPet(petId: string): Application[];
  incomingApplications(): Application[]; // across all my listings
  setApplicationStatus(appId: string, status: ApplicationStatus): void;
  /** Application drafts ("Save draft" on the apply form). Pass null to clear. */
  getApplicationDraft(petId: string): Application["answers"] | undefined;
  saveApplicationDraft(petId: string, answers: Application["answers"] | null): Result;

  // messages
  myConversations(): Conversation[];
  startConversation(petId: string): Result<Conversation>;
  /** Owner-side: open (or create) the conversation about `petId` with another user, e.g. an applicant. */
  startConversationWith(petId: string, otherUserId: string): Result<Conversation>;
  sendMessage(conversationId: string, text: string): Result;
  markRead(conversationId: string): void;
  unreadCount(): number;
  getUser(id: string): User | undefined;
  /** Hide every conversation with `userId` for the current user and stop new ones from being started. */
  blockUser(userId: string): Result;
  isBlocked(userId: string): boolean;
  /** Mock only: the other participant answers with a canned reply (Supabase will deliver real messages). */
  simulateReply(conversationId: string): void;

  // trust & safety
  report(input: { targetType: Report["targetType"]; targetId: string; reason: ReportReason; details: string }): Result;
  setReportStatus(reportId: string, status: Report["status"]): void;
  submitTicket(topic: string, message: string): void;

  // dev
  resetDemoData(): void;
}

const StoreContext = createContext<StoreValue | null>(null);

function load(): DB {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DB;
      if (parsed && parsed.version === 1) return parsed;
    }
  } catch {
    /* ignore */
  }
  return createSeed();
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<DB>(() => createSeed());
  const [ready, setReady] = useState(false);
  const dbRef = useRef(db);
  dbRef.current = db;

  useEffect(() => {
    const loaded = load();
    dbRef.current = loaded;
    setDb(loaded);
    setReady(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        const next = load();
        dbRef.current = next;
        setDb(next);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  /** Synchronous update: mutates a clone, persists, and re-renders. */
  const update = useCallback((fn: (d: DB) => void) => {
    const next = structuredClone(dbRef.current);
    fn(next);
    dbRef.current = next;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* quota (large photos) — state still updates in memory */
    }
    setDb(next);
  }, []);

  const value = useMemo<StoreValue>(() => {
    const d = db;
    const me = d.users.find((u) => u.id === d.sessionUserId) ?? null;
    const meId = me?.id ?? null;

    const requireUser = (): Result<User> => (me ? ok(me) : fail("Please log in to continue."));
    const myBlocks = meId ? d.blocks?.[meId] ?? [] : [];
    const visibleTo = (c: Conversation, userId: string) =>
      c.participantIds.includes(userId) && !c.participantIds.some((p) => p !== userId && myBlocks.includes(p));
    const blockedNow = (userId: string, otherId: string) => (dbRef.current.blocks?.[userId] ?? []).includes(otherId);

    return {
      db: d,
      ready,
      currentUser: me,

      login(email, password) {
        const u = dbRef.current.users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
        if (!u || u.password !== password) return fail("That email and password don't match our records.");
        if (!u.emailVerified) {
          update((n) => { n.pendingVerificationEmail = u.email; });
          return fail("Please verify your email before logging in.");
        }
        update((n) => { n.sessionUserId = u.id; });
        return ok(u);
      },
      signup({ name, email, password, city, accountType }) {
        const e = email.trim().toLowerCase();
        if (dbRef.current.users.some((x) => x.email.toLowerCase() === e)) return fail("An account with this email already exists.");
        const u: User = {
          id: uid("u"), name: name.trim(), email: e, password, city: city.trim(), role: "user", accountType,
          emailVerified: false, createdAt: nowIso(),
          preferences: { emailNotifications: true, messageNotifications: true, showCity: true, profileVisible: true },
        };
        update((n) => { n.users.push(u); n.pendingVerificationEmail = e; });
        return ok(u);
      },
      logout() {
        update((n) => { n.sessionUserId = null; });
      },
      verifyEmail(code) {
        const email = dbRef.current.pendingVerificationEmail;
        if (!email) return fail("There's no email waiting to be verified.");
        if (!/^\d{6}$/.test(code)) return fail("Enter the 6-digit code from your email.");
        // Mock: any 6 digits are accepted.
        update((n) => {
          const u = n.users.find((x) => x.email === email);
          if (u) { u.emailVerified = true; n.sessionUserId = u.id; }
          n.pendingVerificationEmail = null;
        });
        return ok(undefined);
      },
      resendVerification() {
        /* mock no-op */
      },
      requestPasswordReset(email) {
        const e = email.trim().toLowerCase();
        const token = uid("rt");
        // Always "succeed" to avoid account enumeration; only store a token if the user exists.
        if (dbRef.current.users.some((x) => x.email.toLowerCase() === e)) {
          update((n) => { n.resetTokens[token] = e; });
        }
        return ok(token);
      },
      resetPassword(token, password) {
        const email = dbRef.current.resetTokens[token];
        if (!email) return fail("This reset link has expired. Please request a new one.");
        update((n) => {
          const u = n.users.find((x) => x.email === email);
          if (u) u.password = password;
          delete n.resetTokens[token];
        });
        return ok(undefined);
      },

      updateProfile(patch) {
        const r = requireUser(); if (!r.ok) return r;
        if (patch.email && dbRef.current.users.some((x) => x.id !== meId && x.email.toLowerCase() === patch.email!.toLowerCase())) {
          return fail("That email is already in use.");
        }
        update((n) => {
          const u = n.users.find((x) => x.id === meId)!;
          Object.assign(u, patch, patch.preferences ? { preferences: { ...u.preferences, ...patch.preferences } } : {});
          n.pets.forEach((p) => { if (p.ownerId === meId && patch.name) p.ownerName = patch.name; });
        });
        return ok(undefined);
      },
      changePassword(current, next) {
        const r = requireUser(); if (!r.ok) return r;
        if (r.data.password !== current) return fail("Your current password is incorrect.");
        update((n) => { n.users.find((x) => x.id === meId)!.password = next; });
        return ok(undefined);
      },
      deleteAccount() {
        if (!meId) return;
        update((n) => {
          n.users = n.users.filter((u) => u.id !== meId);
          const myPetIds = new Set(n.pets.filter((p) => p.ownerId === meId).map((p) => p.id));
          n.pets = n.pets.filter((p) => p.ownerId !== meId);
          n.applications = n.applications.filter((a) => a.applicantId !== meId && !myPetIds.has(a.petId));
          Object.keys(n.saved).forEach((k) => { n.saved[k] = n.saved[k].filter((x) => !myPetIds.has(x)); });
          n.conversations = n.conversations.filter((c) => !c.participantIds.includes(meId));
          delete n.saved[meId];
          if (n.blocks) delete n.blocks[meId];
          n.sessionUserId = null;
        });
      },

      getPet: (id) => d.pets.find((p) => p.id === id),
      publicPets: () => d.pets.filter((p) => p.status === "active"),
      myPets: () => (meId ? d.pets.filter((p) => p.ownerId === meId) : []),
      isSaved: (petId) => (meId ? (d.saved[meId] ?? []).includes(petId) : false),
      toggleSave(petId) {
        if (!meId) return false;
        let saved = false;
        update((n) => {
          const list = n.saved[meId] ?? [];
          saved = !list.includes(petId);
          n.saved[meId] = saved ? [...list, petId] : list.filter((x) => x !== petId);
        });
        return saved;
      },
      savedPets: () => (meId ? (d.saved[meId] ?? []).map((id) => d.pets.find((p) => p.id === id)).filter((p): p is Pet => !!p) : []),
      incrementViews(petId) {
        update((n) => { const p = n.pets.find((x) => x.id === petId); if (p) p.views += 1; });
      },

      saveDraft(patch) {
        update((n) => { n.draft = { ...(n.draft ?? emptyDraft()), ...patch }; });
      },
      startEditing(petId) {
        const p = dbRef.current.pets.find((x) => x.id === petId);
        if (!p) return;
        update((n) => {
          n.draft = {
            editingId: p.id, name: p.name, species: p.species, breed: p.breed, ageMonths: p.ageMonths, sex: p.sex, size: p.size,
            color: p.color, city: p.city, listingType: p.listingType, fee: p.fee, health: { ...p.health },
            temperament: [...p.temperament], goodWith: [...p.goodWith], story: p.story, reasonForRehoming: p.reasonForRehoming ?? "", photos: [...p.photos],
            ageUnit: p.ageMonths >= 12 && p.ageMonths % 12 === 0 ? "years" : "months",
            details: p.details ? { ...p.details } : undefined,
          };
        });
      },
      clearDraft() {
        update((n) => { n.draft = null; });
      },
      submitDraft() {
        const r = requireUser(); if (!r.ok) return r;
        const dr = dbRef.current.draft;
        if (!dr) return fail("Nothing to submit yet.");
        if (!dr.name || !dr.species || !dr.breed || dr.ageMonths === "" || !dr.sex || !dr.size || !dr.city) return fail("Please complete the basics step.");
        if (dr.story.trim().length < 40) return fail("Please tell us a little more about your pet's story (40+ characters).");
        const tones = ["green", "peach", "lilac", "sage"] as const;
        let saved: Pet | null = null;
        update((n) => {
          const base = {
            name: dr.name.trim(), species: dr.species as Pet["species"], breed: dr.breed.trim(), ageMonths: Number(dr.ageMonths),
            sex: dr.sex as Pet["sex"], size: dr.size as Pet["size"], color: dr.color.trim(), city: dr.city.trim(),
            listingType: dr.listingType, fee: Number(dr.fee || 0), health: dr.health, temperament: dr.temperament,
            goodWith: dr.goodWith, story: dr.story.trim(), reasonForRehoming: dr.reasonForRehoming.trim() || undefined, photos: dr.photos,
            details: dr.details,
          };
          if (dr.editingId) {
            const p = n.pets.find((x) => x.id === dr.editingId);
            if (p) { Object.assign(p, base, { status: "pending_review" as PetStatus, updatedAt: nowIso() }); saved = p; }
          } else {
            const p: Pet = {
              ...base, id: uid("p"), ownerId: r.data.id, ownerName: r.data.name, ownerType: r.data.accountType,
              distanceMiles: 0, status: "pending_review", tone: tones[n.pets.length % 4],
              createdAt: nowIso(), updatedAt: nowIso(), views: 0,
            };
            n.pets.unshift(p);
            saved = p;
          }
          n.draft = null;
        });
        return saved ? ok(saved) : fail("Listing not found.");
      },
      setPetStatus(petId, status, note) {
        update((n) => {
          const p = n.pets.find((x) => x.id === petId);
          if (p) { p.status = status; p.updatedAt = nowIso(); if (note !== undefined) p.moderationNote = note; }
        });
      },
      deletePet(petId) {
        update((n) => {
          n.pets = n.pets.filter((p) => p.id !== petId);
          n.applications = n.applications.filter((a) => a.petId !== petId);
          Object.keys(n.saved).forEach((k) => { n.saved[k] = n.saved[k].filter((x) => x !== petId); });
        });
      },

      submitApplication(petId, answers) {
        const r = requireUser(); if (!r.ok) return r;
        const pet = dbRef.current.pets.find((p) => p.id === petId);
        if (!pet) return fail("This pet is no longer listed.");
        if (pet.ownerId === r.data.id) return fail("You can't apply for your own listing.");
        if (dbRef.current.applications.some((a) => a.petId === petId && a.applicantId === r.data.id && a.status !== "withdrawn" && a.status !== "declined")) {
          return fail("You've already applied for this pet.");
        }
        const app: Application = { id: uid("a"), petId, applicantId: r.data.id, applicantName: r.data.name, status: "submitted", answers, createdAt: nowIso(), updatedAt: nowIso() };
        update((n) => { n.applications.unshift(app); });
        return ok(app);
      },
      myApplications: () => (meId ? d.applications.filter((a) => a.applicantId === meId) : []),
      applicationsForPet: (petId) => d.applications.filter((a) => a.petId === petId),
      incomingApplications: () => {
        if (!meId) return [];
        const mine = new Set(d.pets.filter((p) => p.ownerId === meId).map((p) => p.id));
        return d.applications.filter((a) => mine.has(a.petId));
      },
      setApplicationStatus(appId, status) {
        update((n) => {
          const a = n.applications.find((x) => x.id === appId);
          if (!a) return;
          a.status = status; a.updatedAt = nowIso();
          if (status === "approved") {
            const p = n.pets.find((x) => x.id === a.petId);
            if (p) { p.status = "adopted"; p.updatedAt = nowIso(); }
          }
        });
      },
      getApplicationDraft: (petId) => (meId ? d.applicationDrafts?.[`${meId}:${petId}`] : undefined),
      saveApplicationDraft(petId, answers) {
        const r = requireUser(); if (!r.ok) return r;
        const key = `${r.data.id}:${petId}`;
        update((n) => {
          n.applicationDrafts = { ...(n.applicationDrafts ?? {}) };
          if (answers) n.applicationDrafts[key] = answers;
          else delete n.applicationDrafts[key];
        });
        return ok(undefined);
      },

      myConversations: () =>
        meId
          ? d.conversations
              .filter((c) => visibleTo(c, meId))
              .sort((a, b) => (b.messages.at(-1)?.at ?? "").localeCompare(a.messages.at(-1)?.at ?? ""))
          : [],
      startConversation(petId) {
        const r = requireUser(); if (!r.ok) return r;
        const pet = dbRef.current.pets.find((p) => p.id === petId);
        if (!pet) return fail("This pet is no longer listed.");
        if (pet.ownerId === r.data.id) return fail("This is your own listing.");
        if (blockedNow(r.data.id, pet.ownerId)) return fail("You’ve blocked this person, so you can’t message them.");
        const existing = dbRef.current.conversations.find((c) => c.petId === petId && c.participantIds.includes(r.data.id) && c.participantIds.includes(pet.ownerId));
        if (existing) return ok(existing);
        const c: Conversation = { id: uid("c"), petId, participantIds: [r.data.id, pet.ownerId], messages: [], lastReadAt: {} };
        update((n) => { n.conversations.unshift(c); });
        return ok(c);
      },
      startConversationWith(petId, otherUserId) {
        const r = requireUser(); if (!r.ok) return r;
        if (otherUserId === r.data.id) return fail("You can't message yourself.");
        if (!dbRef.current.pets.some((p) => p.id === petId)) return fail("This pet is no longer listed.");
        if (!dbRef.current.users.some((u) => u.id === otherUserId)) return fail("This person is no longer on Pawhaven.");
        if (blockedNow(r.data.id, otherUserId)) return fail("You’ve blocked this person, so you can’t message them.");
        const existing = dbRef.current.conversations.find((c) => c.petId === petId && c.participantIds.includes(r.data.id) && c.participantIds.includes(otherUserId));
        if (existing) return ok(existing);
        const c: Conversation = { id: uid("c"), petId, participantIds: [r.data.id, otherUserId], messages: [], lastReadAt: {} };
        update((n) => { n.conversations.unshift(c); });
        return ok(c);
      },
      sendMessage(conversationId, text) {
        const r = requireUser(); if (!r.ok) return r;
        const t = text.trim();
        if (!t) return fail("Message can't be empty.");
        if (t.length > 2000) return fail("Messages are limited to 2,000 characters.");
        update((n) => {
          const c = n.conversations.find((x) => x.id === conversationId);
          if (c) { c.messages.push({ id: uid("m"), fromId: r.data.id, text: t, at: nowIso() }); c.lastReadAt[r.data.id] = nowIso(); }
        });
        return ok(undefined);
      },
      markRead(conversationId) {
        if (!meId) return;
        const c = dbRef.current.conversations.find((x) => x.id === conversationId);
        const last = c?.messages.at(-1)?.at;
        if (!c || !last || (c.lastReadAt[meId] ?? "") >= last) return;
        update((n) => { const cc = n.conversations.find((x) => x.id === conversationId); if (cc) cc.lastReadAt[meId] = nowIso(); });
      },
      unreadCount: () =>
        meId
          ? d.conversations.filter((c) => visibleTo(c, meId) && c.messages.some((m) => m.fromId !== meId && m.at > (c.lastReadAt[meId] ?? ""))).length
          : 0,
      getUser: (id) => d.users.find((u) => u.id === id),
      blockUser(userId) {
        const r = requireUser(); if (!r.ok) return r;
        if (userId === r.data.id) return fail("You can't block yourself.");
        if (blockedNow(r.data.id, userId)) return ok(undefined);
        update((n) => {
          n.blocks = { ...(n.blocks ?? {}) };
          n.blocks[r.data.id] = [...(n.blocks[r.data.id] ?? []), userId];
        });
        return ok(undefined);
      },
      isBlocked: (userId) => myBlocks.includes(userId),
      simulateReply(conversationId) {
        const c = dbRef.current.conversations.find((x) => x.id === conversationId);
        const last = c?.messages.at(-1);
        if (!c || !last) return;
        const from = c.participantIds.find((p) => p !== last.fromId);
        // Only answer the latest message, and never on behalf of someone who blocked the sender.
        if (!from || blockedNow(from, last.fromId)) return;
        const pet = dbRef.current.pets.find((p) => p.id === c.petId);
        const text = `Thanks for your message! I'll get back to you soon${pet ? ` with more about ${pet.name}` : ""}.`;
        update((n) => {
          const cc = n.conversations.find((x) => x.id === conversationId);
          if (cc && cc.messages.at(-1)?.id === last.id) cc.messages.push({ id: uid("m"), fromId: from, text, at: nowIso() });
        });
      },

      report({ targetType, targetId, reason, details }) {
        const r = requireUser(); if (!r.ok) return r;
        update((n) => { n.reports.unshift({ id: uid("r"), targetType, targetId, reporterId: r.data.id, reason, details: details.trim(), status: "open", createdAt: nowIso() }); });
        return ok(undefined);
      },
      setReportStatus(reportId, status) {
        update((n) => { const rp = n.reports.find((x) => x.id === reportId); if (rp) rp.status = status; });
      },
      submitTicket(topic, message) {
        update((n) => { n.tickets.unshift({ id: uid("t"), userId: meId, topic, message: message.trim(), createdAt: nowIso() }); });
      },

      resetDemoData() {
        const seed = createSeed();
        update((n) => { Object.assign(n, seed); });
      },
    };
  }, [db, ready, update]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}
