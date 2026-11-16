import type { DB, Pet, PetHealth, User } from "./types";

const now = new Date("2026-11-10T10:00:00Z").getTime();
const daysAgo = (d: number) => new Date(now - d * 86400000).toISOString();

const defaultPrefs = {
  emailNotifications: true,
  messageNotifications: true,
  showCity: true,
  profileVisible: true,
};

/** Demo accounts. Passwords are mock-only. */
export const DEMO_USER_EMAIL = "demo@pawhaven.app";
export const DEMO_ADMIN_EMAIL = "admin@pawhaven.app";
export const DEMO_PASSWORD = "pawhaven123";

const users: User[] = [
  { id: "u_demo", name: "Alex Rivera", email: DEMO_USER_EMAIL, password: DEMO_PASSWORD, city: "Austin, TX", phone: "(512) 555-0142", bio: "Dog walker, cat lover, plant over-waterer.", role: "user", accountType: "private", emailVerified: true, createdAt: daysAgo(120), preferences: { ...defaultPrefs } },
  { id: "u_admin", name: "Sam Okafor", email: DEMO_ADMIN_EMAIL, password: DEMO_PASSWORD, city: "Austin, TX", role: "admin", accountType: "private", emailVerified: true, createdAt: daysAgo(400), preferences: { ...defaultPrefs } },
  { id: "u_happytails", name: "Happy Tails Rescue", email: "hello@happytails.org", password: DEMO_PASSWORD, city: "Austin, TX", role: "user", accountType: "shelter", emailVerified: true, createdAt: daysAgo(900), preferences: { ...defaultPrefs } },
  { id: "u_littlepaws", name: "Little Paws Sanctuary", email: "team@littlepaws.org", password: DEMO_PASSWORD, city: "Round Rock, TX", role: "user", accountType: "shelter", emailVerified: true, createdAt: daysAgo(700), preferences: { ...defaultPrefs } },
  { id: "u_jordan", name: "Jordan Lee", email: "jordan@example.com", password: DEMO_PASSWORD, city: "Austin, TX", role: "user", accountType: "private", emailVerified: true, createdAt: daysAgo(60), preferences: { ...defaultPrefs } },
  { id: "u_maria", name: "Maria Chen", email: "maria@example.com", password: DEMO_PASSWORD, city: "Cedar Park, TX", role: "user", accountType: "private", emailVerified: true, createdAt: daysAgo(80), preferences: { ...defaultPrefs } },
  { id: "u_priya", name: "Priya Shah", email: "priya@example.com", password: DEMO_PASSWORD, city: "Pflugerville, TX", role: "user", accountType: "private", emailVerified: true, createdAt: daysAgo(30), preferences: { ...defaultPrefs } },
];

const health = (o: Partial<PetHealth> = {}): PetHealth => ({
  vaccinated: true,
  spayedNeutered: true,
  microchipped: true,
  dewormed: true,
  specialNeeds: false,
  notes: "",
  ...o,
});

type PetSeed = Omit<Pet, "createdAt" | "updatedAt" | "views" | "ownerName" | "ownerType"> & { age?: number };

const owner = (id: string) => users.find((u) => u.id === id)!;

const petSeeds: (PetSeed & { days: number; views: number })[] = [
  { id: "p_luna", name: "Luna", species: "dog", breed: "Golden retriever", ageMonths: 24, sex: "female", size: "large", color: "Golden", city: "Austin, TX", distanceMiles: 3, listingType: "adoption", fee: 150, ownerId: "u_happytails", status: "active", tone: "green", health: health(), temperament: ["Gentle", "Playful", "Loves walks"], goodWith: ["kids", "dogs", "first-time owners"], story: "Luna came to us after her family moved overseas. She is a gentle soul who loves long walks, belly rubs and greeting everyone at the door. She knows sit, stay and paw, and she is still working on not stealing socks.", photos: [], days: 3, views: 214 },
  { id: "p_milo", name: "Milo", species: "cat", breed: "Domestic shorthair", ageMonths: 12, sex: "male", size: "small", color: "Orange tabby", city: "Austin, TX", distanceMiles: 5, listingType: "rehoming", fee: 50, ownerId: "u_jordan", status: "active", tone: "peach", health: health({ microchipped: false }), temperament: ["Curious", "Affectionate", "Chatty"], goodWith: ["kids", "cats"], story: "Milo is a curious orange tabby who will supervise everything you do. He sleeps at the foot of the bed and chirps when he wants attention.", reasonForRehoming: "A new family member has a severe cat allergy.", photos: [], days: 5, views: 96 },
  { id: "p_willow", name: "Willow", species: "small", breed: "Holland lop rabbit", ageMonths: 8, sex: "female", size: "small", color: "Cream", city: "Round Rock, TX", distanceMiles: 12, listingType: "adoption", fee: 75, ownerId: "u_littlepaws", status: "active", tone: "lilac", health: health({ microchipped: false }), temperament: ["Calm", "Gentle"], goodWith: ["kids", "first-time owners"], story: "Willow is a soft, calm bunny who loves fresh greens and quiet afternoons. She is litter trained and enjoys gentle pets once she knows you.", photos: [], days: 8, views: 71 },
  { id: "p_teddy", name: "Teddy", species: "dog", breed: "Cavalier spaniel", ageMonths: 36, sex: "male", size: "small", color: "Blenheim", city: "Cedar Park, TX", distanceMiles: 16, listingType: "rehoming", fee: 100, ownerId: "u_maria", status: "active", tone: "sage", health: health(), temperament: ["Cuddly", "Easygoing"], goodWith: ["kids", "dogs", "cats", "first-time owners"], story: "Teddy is the definition of a lap dog. He is house trained, great on a leash and gets along with everyone he meets.", reasonForRehoming: "I'm relocating for work to an apartment that doesn't allow dogs.", photos: [], days: 2, views: 158 },
  { id: "p_pepper", name: "Pepper", species: "cat", breed: "Tuxedo", ageMonths: 48, sex: "female", size: "medium", color: "Black & white", city: "Austin, TX", distanceMiles: 4, listingType: "adoption", fee: 85, ownerId: "u_happytails", status: "active", tone: "green", health: health(), temperament: ["Independent", "Calm"], goodWith: ["first-time owners"], story: "Pepper is a dignified lady who enjoys sunny windowsills and a good chin scratch on her own terms.", photos: [], days: 10, views: 64 },
  { id: "p_biscuit", name: "Biscuit", species: "dog", breed: "Beagle mix", ageMonths: 18, sex: "male", size: "medium", color: "Tricolor", city: "Pflugerville, TX", distanceMiles: 9, listingType: "adoption", fee: 120, ownerId: "u_happytails", status: "active", tone: "peach", health: health(), temperament: ["Energetic", "Friendly", "Food motivated"], goodWith: ["kids", "dogs"], story: "Biscuit has a nose for adventure and a heart full of love. He would thrive with an active family and a fenced yard.", photos: [], days: 6, views: 120 },
  { id: "p_kiwi", name: "Kiwi", species: "bird", breed: "Budgerigar", ageMonths: 14, sex: "male", size: "small", color: "Green & yellow", city: "Austin, TX", distanceMiles: 7, listingType: "rehoming", fee: 30, ownerId: "u_priya", status: "active", tone: "lilac", health: health({ spayedNeutered: false, microchipped: false, vaccinated: false }), temperament: ["Chatty", "Social"], goodWith: ["kids"], story: "Kiwi whistles the first few notes of every song he hears. Comes with his cage and toys.", reasonForRehoming: "Our work schedules changed and he needs more company.", photos: [], days: 12, views: 38 },
  { id: "p_mochi", name: "Mochi", species: "cat", breed: "Ragdoll", ageMonths: 6, sex: "female", size: "small", color: "Seal point", city: "Round Rock, TX", distanceMiles: 13, listingType: "adoption", fee: 140, ownerId: "u_littlepaws", status: "active", tone: "sage", health: health({ spayedNeutered: false }), temperament: ["Playful", "Affectionate"], goodWith: ["kids", "cats", "first-time owners"], story: "Mochi is a fluffy kitten who goes limp the moment you pick her up. She loves feather toys and chasing her own tail.", photos: [], days: 1, views: 189 },
  { id: "p_hazel", name: "Hazel", species: "small", breed: "Guinea pig", ageMonths: 20, sex: "female", size: "small", color: "Brown & white", city: "Austin, TX", distanceMiles: 2, listingType: "adoption", fee: 25, ownerId: "u_littlepaws", status: "active", tone: "peach", health: health({ spayedNeutered: false, microchipped: false }), temperament: ["Vocal", "Gentle"], goodWith: ["kids", "first-time owners"], story: "Hazel wheeks with joy at the sound of a crinkling bag. She is bonded with her sister Clover — ask us about adopting them together.", photos: [], days: 15, views: 22 },
  { id: "p_rocco", name: "Rocco", species: "dog", breed: "Boxer", ageMonths: 60, sex: "male", size: "large", color: "Fawn", city: "Georgetown, TX", distanceMiles: 25, listingType: "rehoming", fee: 0, ownerId: "u_jordan", status: "active", tone: "green", health: health({ specialNeeds: true, notes: "Mild hip dysplasia, managed with daily supplements." }), temperament: ["Loyal", "Goofy"], goodWith: ["dogs"], story: "Rocco is a goofy gentleman who thinks he is a lap dog. He needs a home without stairs.", reasonForRehoming: "Moving abroad and can't bring him along.", photos: [], days: 20, views: 47 },
  // Demo user's own listings
  { id: "p_nala", name: "Nala", species: "cat", breed: "Maine coon mix", ageMonths: 30, sex: "female", size: "medium", color: "Brown tabby", city: "Austin, TX", distanceMiles: 0, listingType: "rehoming", fee: 60, ownerId: "u_demo", status: "active", tone: "peach", health: health(), temperament: ["Gentle", "Quiet"], goodWith: ["cats", "first-time owners"], story: "Nala is a gentle giant with a big fluffy tail. She enjoys quiet evenings and brushing sessions.", reasonForRehoming: "My new lease doesn't allow pets.", photos: [], days: 4, views: 83 },
  { id: "p_scout", name: "Scout", species: "dog", breed: "Border collie", ageMonths: 10, sex: "male", size: "medium", color: "Black & white", city: "Austin, TX", distanceMiles: 0, listingType: "rehoming", fee: 90, ownerId: "u_demo", status: "pending_review", tone: "green", health: health({ spayedNeutered: false }), temperament: ["Smart", "Energetic"], goodWith: ["kids", "dogs"], story: "Scout is a whip-smart pup who already knows a dozen tricks and needs an active family.", reasonForRehoming: "He needs more space and exercise than I can give.", photos: [], days: 1, views: 0 },
  { id: "p_olive", name: "Olive", species: "small", breed: "Netherland dwarf rabbit", ageMonths: 16, sex: "female", size: "small", color: "Gray", city: "Austin, TX", distanceMiles: 0, listingType: "rehoming", fee: 40, ownerId: "u_demo", status: "adopted", tone: "lilac", health: health({ microchipped: false }), temperament: ["Shy", "Sweet"], goodWith: ["first-time owners"], story: "Olive is a shy little bun who blossoms with patience.", photos: [], days: 40, views: 132 },
  // Flagged listing for moderation demo
  { id: "p_flag", name: "Puppies", species: "dog", breed: "French bulldog", ageMonths: 2, sex: "male", size: "small", color: "Brindle", city: "Houston, TX", distanceMiles: 160, listingType: "rehoming", fee: 2500, ownerId: "u_priya", status: "pending_review", tone: "sage", health: health({ vaccinated: false, spayedNeutered: false, microchipped: false }), temperament: [], goodWith: [], story: "Several puppies available, deposit required to hold.", photos: [], days: 0, views: 0 },
];

const pets: Pet[] = petSeeds.map(({ days, views, ...p }) => ({
  ...p,
  ownerName: owner(p.ownerId).name,
  ownerType: owner(p.ownerId).accountType,
  createdAt: daysAgo(days),
  updatedAt: daysAgo(days),
  views,
}));

export function createSeed(): DB {
  return {
    version: 1,
    users: structuredClone(users),
    pets: structuredClone(pets),
    applications: [
      { id: "a_1", petId: "p_luna", applicantId: "u_demo", applicantName: "Alex Rivera", status: "in_review", answers: { fullName: "Alex Rivera", email: DEMO_USER_EMAIL, phone: "(512) 555-0142", city: "Austin, TX", homeType: "House", hasYard: true, otherPets: "One senior cat", kids: "None", experience: "Grew up with retrievers.", hoursAlone: "Under 4 hours", message: "Luna looks like the sweetest girl. We have a fenced yard and a lot of love to give." }, createdAt: daysAgo(2), updatedAt: daysAgo(1) },
      { id: "a_2", petId: "p_mochi", applicantId: "u_demo", applicantName: "Alex Rivera", status: "meet_greet", answers: { fullName: "Alex Rivera", email: DEMO_USER_EMAIL, phone: "(512) 555-0142", city: "Austin, TX", homeType: "House", hasYard: true, otherPets: "One senior cat", kids: "None", experience: "Two cats over 10 years.", hoursAlone: "Under 4 hours", message: "Would love to meet Mochi this weekend." }, createdAt: daysAgo(1), updatedAt: daysAgo(0) },
      // Applications on the demo user's listing (Nala)
      { id: "a_3", petId: "p_nala", applicantId: "u_maria", applicantName: "Maria Chen", status: "submitted", answers: { fullName: "Maria Chen", email: "maria@example.com", phone: "(512) 555-0199", city: "Cedar Park, TX", homeType: "House", hasYard: true, otherPets: "None", kids: "Two (8 and 11)", experience: "Had cats growing up.", hoursAlone: "4–8 hours", message: "My kids have been asking for a fluffy cat — Nala seems perfect." }, createdAt: daysAgo(2), updatedAt: daysAgo(2) },
      { id: "a_4", petId: "p_nala", applicantId: "u_priya", applicantName: "Priya Shah", status: "in_review", answers: { fullName: "Priya Shah", email: "priya@example.com", phone: "(512) 555-0110", city: "Pflugerville, TX", homeType: "Apartment", hasYard: false, otherPets: "One indoor cat", kids: "None", experience: "Volunteer at a cat cafe.", hoursAlone: "Under 4 hours", message: "I work from home and would love a calm companion for my cat." }, createdAt: daysAgo(3), updatedAt: daysAgo(1) },
      { id: "a_5", petId: "p_nala", applicantId: "u_jordan", applicantName: "Jordan Lee", status: "declined", answers: { fullName: "Jordan Lee", email: "jordan@example.com", phone: "(512) 555-0177", city: "Austin, TX", homeType: "Apartment", hasYard: false, otherPets: "Two dogs", kids: "None", experience: "Some", hoursAlone: "8+ hours", message: "Interested!" }, createdAt: daysAgo(4), updatedAt: daysAgo(3) },
    ],
    conversations: [
      { id: "c_1", petId: "p_luna", participantIds: ["u_demo", "u_happytails"], lastReadAt: { u_demo: daysAgo(1) }, messages: [
        { id: "m_1", fromId: "u_demo", text: "Hi! I just applied for Luna. Is she okay with cats?", at: daysAgo(2) },
        { id: "m_2", fromId: "u_happytails", text: "Hi Alex! Luna has lived with a calm cat before and did great. Would you like to set up a meet-and-greet?", at: daysAgo(1.5) },
        { id: "m_3", fromId: "u_happytails", text: "We have openings Saturday at 10am or 2pm at our Austin location.", at: daysAgo(0.5) },
      ] },
      { id: "c_2", petId: "p_nala", participantIds: ["u_demo", "u_maria"], lastReadAt: { u_demo: daysAgo(0) }, messages: [
        { id: "m_4", fromId: "u_maria", text: "Hello! Does Nala get along with kids?", at: daysAgo(2) },
        { id: "m_5", fromId: "u_demo", text: "She does — she's very patient. Happy to arrange a visit.", at: daysAgo(1.8) },
      ] },
      { id: "c_3", petId: "p_teddy", participantIds: ["u_demo", "u_maria"], lastReadAt: { u_demo: daysAgo(3) }, messages: [
        { id: "m_6", fromId: "u_demo", text: "Is Teddy still available?", at: daysAgo(3) },
        { id: "m_7", fromId: "u_maria", text: "He is! He'd love to meet you.", at: daysAgo(0.2) },
      ] },
    ],
    reports: [
      { id: "r_1", targetType: "pet", targetId: "p_flag", reporterId: "u_maria", reason: "selling_for_profit", details: "Multiple puppies, asking for a deposit before meeting.", status: "open", createdAt: daysAgo(0.3) },
      { id: "r_2", targetType: "pet", targetId: "p_rocco", reporterId: "u_priya", reason: "other", details: "Location seems far from the listed area.", status: "open", createdAt: daysAgo(1) },
      { id: "r_3", targetType: "user", targetId: "u_jordan", reporterId: "u_maria", reason: "inappropriate", details: "Rude message.", status: "dismissed", createdAt: daysAgo(6) },
    ],
    tickets: [],
    saved: { u_demo: ["p_teddy", "p_willow", "p_biscuit"] },
    sessionUserId: null,
    pendingVerificationEmail: null,
    resetTokens: {},
    draft: null,
  };
}
