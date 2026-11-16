import type { DB } from "@/lib/types";

/** Collects everything Pawhaven stores about one user (password omitted). */
export function collectUserData(db: DB, userId: string) {
  const user = db.users.find((u) => u.id === userId);
  if (!user) return null;
  const { password: _omit, ...profile } = user;
  void _omit;
  const myPetIds = new Set(db.pets.filter((p) => p.ownerId === userId).map((p) => p.id));
  return {
    exportedAt: new Date().toISOString(),
    profile,
    listings: db.pets.filter((p) => p.ownerId === userId),
    savedPetIds: db.saved[userId] ?? [],
    applicationsSent: db.applications.filter((a) => a.applicantId === userId),
    applicationsReceived: db.applications.filter((a) => myPetIds.has(a.petId)),
    conversations: db.conversations.filter((c) => c.participantIds.includes(userId)),
    reportsFiled: db.reports.filter((r) => r.reporterId === userId),
    supportTickets: db.tickets.filter((t) => t.userId === userId),
    blockedUserIds: db.blocks?.[userId] ?? [],
  };
}

/** Triggers a browser download of the user's data as JSON. */
export function downloadUserData(db: DB, userId: string): boolean {
  const data = collectUserData(db, userId);
  if (!data) return false;
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pawhaven-my-data-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}
