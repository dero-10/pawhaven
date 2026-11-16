// Domain types. Shaped to map 1:1 onto future Supabase tables.

export type Species = "dog" | "cat" | "small" | "bird";
export type ListingType = "adoption" | "rehoming";
export type Sex = "female" | "male";
export type Size = "small" | "medium" | "large";
export type ArtTone = "green" | "peach" | "lilac" | "sage";
export type PetStatus = "draft" | "pending_review" | "active" | "paused" | "adopted" | "rejected";

export interface User {
  id: string;
  name: string;
  email: string;
  password: string; // mock only — never store plaintext once Supabase Auth is wired in
  city: string;
  phone?: string;
  bio?: string;
  role: "user" | "admin";
  accountType: "private" | "shelter";
  emailVerified: boolean;
  createdAt: string;
  preferences: {
    emailNotifications: boolean;
    messageNotifications: boolean;
    showCity: boolean;
    profileVisible: boolean;
  };
}

export interface PetHealth {
  vaccinated: boolean;
  spayedNeutered: boolean;
  microchipped: boolean;
  dewormed: boolean;
  specialNeeds: boolean;
  notes: string;
}

/** Yes / No / Unknown answer used by the "Health & care" step. */
export type TriState = "yes" | "no" | "unknown";
export type EnergyLevel = "low" | "moderate" | "high";

/** Extra care details collected by the post-a-pet wizard (Figma 14:49 / 14:51). Optional on older records. */
export interface PetDetails {
  vaccinated: TriState | "";
  spayedNeutered: TriState | "";
  microchipped: TriState | "";
  houseTrained: TriState | "";
  energyLevel: EnergyLevel | "";
  behavior: string; // "Behavior & special care"
  idealHome: string; // "His/Her ideal home"
}

export interface Pet {
  id: string;
  details?: PetDetails;
  name: string;
  species: Species;
  breed: string;
  ageMonths: number;
  sex: Sex;
  size: Size;
  color: string;
  city: string;
  distanceMiles: number;
  listingType: ListingType;
  fee: number;
  ownerId: string;
  ownerName: string;
  ownerType: "shelter" | "private";
  status: PetStatus;
  tone: ArtTone;
  health: PetHealth;
  temperament: string[];
  goodWith: string[]; // "kids" | "dogs" | "cats" | "first-time owners"
  story: string;
  reasonForRehoming?: string;
  photos: string[]; // data URLs or /public paths; empty = paw artwork
  createdAt: string;
  updatedAt: string;
  views: number;
  moderationNote?: string;
}

export type ApplicationStatus =
  | "submitted"
  | "in_review"
  | "meet_greet"
  | "approved"
  | "declined"
  | "withdrawn";

export interface Application {
  id: string;
  petId: string;
  applicantId: string;
  applicantName: string;
  status: ApplicationStatus;
  answers: {
    fullName: string;
    email: string;
    phone: string;
    city: string;
    homeType: string; // House / Apartment / Other
    hasYard: boolean;
    otherPets: string;
    kids: string;
    experience: string;
    hoursAlone: string;
    message: string;
    /** "I own my home" / "I rent with permission" … (added for the 12:34 application form) */
    housingPermission?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  fromId: string;
  text: string;
  at: string;
}

export interface Conversation {
  id: string;
  petId: string;
  participantIds: [string, string];
  messages: Message[];
  lastReadAt: Record<string, string>;
}

export type ReportReason =
  | "scam"
  | "animal_welfare"
  | "inappropriate"
  | "selling_for_profit"
  | "other";

export interface Report {
  id: string;
  targetType: "pet" | "user" | "message";
  targetId: string;
  reporterId: string;
  reason: ReportReason;
  details: string;
  status: "open" | "resolved" | "dismissed";
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  userId: string | null;
  topic: string;
  message: string;
  createdAt: string;
}

/** Draft state for the 4-step "Post a pet" wizard. */
export interface PetDraft {
  editingId?: string;
  name: string;
  species: Species | "";
  breed: string;
  ageMonths: number | "";
  sex: Sex | "";
  size: Size | "";
  color: string;
  city: string;
  listingType: ListingType;
  fee: number | "";
  health: PetHealth;
  temperament: string[];
  goodWith: string[];
  story: string;
  reasonForRehoming: string;
  photos: string[];
  /** Unit the age was entered in (UI only; ageMonths stays the source of truth). */
  ageUnit?: "months" | "years";
  details?: PetDetails;
}

export interface DB {
  version: number;
  users: User[];
  pets: Pet[];
  applications: Application[];
  conversations: Conversation[];
  reports: Report[];
  tickets: SupportTicket[];
  saved: Record<string, string[]>; // userId -> petIds
  sessionUserId: string | null;
  pendingVerificationEmail: string | null;
  resetTokens: Record<string, string>; // token -> email
  draft: PetDraft | null;
  /** Saved adoption-application drafts, keyed `${userId}:${petId}`. Optional for older stored DBs. */
  applicationDrafts?: Record<string, Application["answers"]>;
  /** Blocked users, keyed by blocker id. Conversations with a blocked user are hidden for the blocker. Optional for older stored DBs. */
  blocks?: Record<string, string[]>;
}
