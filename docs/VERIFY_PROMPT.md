# PawHaven — Full verification prompt

> Paste everything below the line into a fresh Claude Code session opened in `C:\Users\ROG ZPHYRUS G14\Desktop\Kucing\pawhaven` (or hand it to a sub-agent). It audits the whole static site against the Figma design and checks that every feature actually works. It is safe to re-run after every change.

---

You are the QA lead for **PawHaven**, a pet adoption & rehoming marketplace built as a fully working static front end (Next.js 15 App Router + React 19 + TypeScript + Tailwind v4). There is **no backend**: all data flows through the mock store `src/lib/store.tsx`, persisted in `localStorage` (key `pawhaven-db-v1`). Supabase will replace the store later.

Your job: **scan everything, prove each feature works, compare each screen to Figma, fix what is broken, and report.** Do not stop at the first problem — finish the whole checklist, then fix, then re-verify.

## 0. Ground rules
- Read `docs/CONVENTIONS.md` first: it lists the route ↔ Figma frame map, tokens, shared components, and demo accounts.
- Figma file key `YDIASre6Fg6dfSGjFjrfct`. Call `create_session` once, reuse its `sessionId`. Load the `figma:figma-design-to-code` skill before any `get_design_context`. Prefer `get_screenshot` for visual comparison (cheaper).
- Test in the built-in browser (`mcp__Claude_Browser__*`). Start the app with `preview_start` using the `pawhaven` config in `.claude/launch.json` (`npm run dev`, port 3000). Prefer `read_page` / `get_page_text` / `find` over screenshots for checking text and structure; use screenshots for visual comparison.
- Before starting, reset data: run `localStorage.removeItem("pawhaven-db-v1"); location.reload()` in the page.
- Demo users: `demo@pawhaven.app` / `pawhaven123` (regular user), `admin@pawhaven.app` / `pawhaven123` (moderator). Email verification accepts any 6-digit code.
- Fix bugs in the smallest correct way, keep to the conventions, and never introduce raw hex colours or figma.com asset URLs.

## 1. Static checks (must all pass)
1. `npx tsc --noEmit` → 0 errors.
2. `npm run lint` → 0 errors (warnings listed in the report).
3. `npm run build` → succeeds; note any route that fails prerender.
4. `grep -rn "figma.com/api/mcp/asset" src public` → no matches.
5. `grep -rnE "#[0-9a-fA-F]{6}" src --include=*.tsx` → only allowed in SVG `fill` props; anything else must use tokens.
6. Every file referenced as `/icons/*` or `/figma/**` in `src` exists in `public` and is non-empty.
7. No `localStorage` access outside `src/lib/store.tsx`.

## 2. Route inventory
Visit every route below (logged out and logged in where relevant). Each must render without console errors (`read_console_messages` with `onlyErrors`) and without a horizontal scrollbar at 375px and 1440px.

| Route | Figma | Auth |
|---|---|---|
| `/` | 6:2 | public |
| `/login` | 14:27 | public (redirects if logged in) |
| `/signup` | 14:29 | public (redirects if logged in) |
| `/verify-email` | 14:31 | public |
| `/forgot-password` | 14:33 | public |
| `/reset-password?token=…` | 14:35 | public |
| `/pets` | 14:37 | public |
| `/pets/p_luna` | 14:39 | public |
| `/saved` | 14:41 | login |
| `/pets/p_luna/apply` | 12:34 | login |
| `/pets/p_luna/apply/sent` | 12:38 | login |
| `/applications` | 14:45 | login |
| `/post`, `/post/health`, `/post/story`, `/post/review` | 14:47, 14:49, 14:51, 14:53 | login |
| `/post/submitted` | 14:55 | login |
| `/my-listings` | 14:57 | login |
| `/my-listings/p_nala/requests` | 14:59 | login (owner) |
| `/messages` | 14:61 | login |
| `/account` | 14:63 | login |
| `/safety` | 14:65 | public |
| `/admin/moderation` | 14:67 | admin |
| `/states`, `/does-not-exist` (404) | 14:69 | public |

## 3. Visual comparison against Figma (per screen)
For each row in §2: take the Figma screenshot of the frame and a browser screenshot at 1440px width, then check and record PASS/FAIL for:
- **Copy** — headings, labels, button text, helper text match the frame exactly.
- **Layout** — section order, column structure, alignment, relative spacing (±8px tolerance).
- **Typography** — Lora serif for display headings, Inter for UI; sizes/weights close to the frame.
- **Colour** — tokens only; backgrounds, badges, buttons match.
- **Assets** — every icon/illustration in the frame is present, correct, not stretched.
- **States** — hover/focus/selected/disabled look intentional.
List each mismatch with the frame id and what differs. Fix in-scope mismatches.

## 4. Functional scenarios (each must pass end-to-end)
Record PASS/FAIL per step. After each scenario, reload the page and confirm state persisted.

**A. Home & discovery (logged out)**
1. Home: header links work (Find a pet → /pets, How it works and Our mission scroll to their sections, Log in → /login, + Post a pet → login gate then /post).
2. Search bar: pick Cats, type "Austin", pick Adoption, then Search → `/pets?species=cat&city=Austin&type=adoption` with filters pre-applied and matching results.
3. Category tiles go to `/pets?species=…`. "View all pets" → /pets. Featured cards → pet profile.
4. /pets: every filter, sort and search control changes the results and the URL. Clear-all resets. A filter combo with no matches shows the empty state. Mobile filter toggle works at 375px.
5. Pet profile: all facts render; Save while logged out → login prompt; Apply → login with `next`; Share copies the link and shows a toast; Report opens a dialog (requires login to submit). `/pets/unknown` shows the not-found state.

**B. Auth**
1. Sign up with an invalid email or short password → inline errors. A duplicate email (`demo@pawhaven.app`) → error.
2. Valid signup → /verify-email shows the email; a 5-digit code → error; 6 digits → logged in and redirected; header shows the first name.
3. Log out via the user menu. Log in with a wrong password → error; correct → goes to `next` or /pets.
4. Forgot password → confirmation + demo reset link → reset with mismatched passwords → error; valid → login works with the new password; the old password fails. Reusing the same token → expired error.
5. Logged-in users visiting /login or /signup are redirected.

**C. Saved pets (demo user)**
1. /saved shows the 3 seeded pets. Unsaving removes the pet immediately. Saving from /pets and the profile adds it back. Heart state stays consistent across pages. Empty state when none are saved.

**D. Adoption flow (demo user)**
1. /pets/p_teddy/apply: prefilled fields; submitting empty required fields → errors; valid submit → /apply/sent.
2. Re-opening /pets/p_teddy/apply → "already applied" state.
3. /applications lists Teddy (Submitted), Luna (In review), Mochi (Meet & greet) with correct tracker steps. Withdraw Teddy → confirm dialog → status Withdrawn.
4. Applying to your own listing (/pets/p_nala/apply) is blocked.

**E. Owner: review requests (demo user)**
1. /my-listings/p_nala/requests shows Maria, Priya, Jordan with correct statuses; answers expand.
2. Move Maria to In review → Meet & greet → Approve (confirm) → Nala becomes Adopted in /my-listings and disappears from /pets.
3. Decline works. Message applicant opens /messages on the right thread.
4. A non-owner opening another pet's requests URL → blocked state.

**F. Post a pet (demo user)**
1. /post: Continue with empty fields → inline errors. Fill Basics → Health → Story (upload 2 images; reorder or set cover; remove one; a non-image file is rejected) → Review shows everything, with working Edit links back to each step.
2. Refresh mid-wizard → the draft is kept. "Save draft & exit" works.
3. Submit → /post/submitted → the listing appears in /my-listings as "In review", and is NOT on /pets until approved.
4. My listings: pause → resume, edit (wizard prefilled, "Editing <name>"), delete (confirm) — each updates correctly. Tabs/filters by status work.

**G. Moderation (admin)**
1. Log in as admin; the user menu shows Moderation workspace. A non-admin sees the "Moderators only" state.
2. The queue shows the pending listings (Scout, "Puppies", plus the one created in F). Approve the F listing → it appears on /pets. Reject "Puppies" with a note → the owner sees the note in My listings.
3. Reports: resolve/dismiss update the counts.

**H. Messages (demo user)**
1. The header shows an unread badge; opening the thread clears it.
2. The conversation list search filters by pet or person. Selecting a thread updates `?c=`.
3. Send: an empty message is blocked; Enter sends; Shift+Enter adds a newline; the new bubble appears right-aligned and auto-scrolls; it persists after reload.
4. "Message" on a pet profile creates or opens the thread for that pet.
5. Report / block opens a dialog and submits.
6. At 375px: list → thread → back works.

**I. Account & privacy (demo user)**
1. Edit the profile name → the header updates; an invalid email → error; a duplicate email → error.
2. Change password: wrong current → error; mismatch → error; success → the new password works at login.
3. Toggles persist after reload.
4. Download data produces a JSON file containing only this user's data.
5. Delete account requires the typed confirmation → logs out → login with those credentials fails.

**J. Safety & support**
1. Every footer link anchor (#report, #contact, #resources, #rehoming, #privacy, #terms, #accessibility) scrolls to an existing section.
2. FAQ accordion opens/closes with mouse and keyboard.
3. The report form requires login; the contact form validates and confirms.

**K. Essential states**
1. /states shows every state from frame 14:69.
2. An unknown route renders the custom 404 with a way home.
3. Loading skeletons appear before the store is ready (no flash of the wrong logged-out UI).

## 5. Cross-cutting checks
- **Responsive:** 375px, 768px, 1440px on /, /pets, /pets/p_luna, /post, /messages, /my-listings — no overflow, no overlapping text, tap targets ≥ 40px.
- **Keyboard:** Tab through header, search, filters, wizard, dialogs; focus is visible; dialogs trap focus and close on Esc; menus close on outside click and on Esc.
- **Accessibility:** every input has a label; images have alt text (decorative = `alt=""`); one `h1` per page; buttons vs links used correctly; `aria-pressed` on save/chips; colour contrast of muted text on canvas ≥ 4.5:1 for body copy. (Delegate a contrast audit to `palette-auditor` if needed.)
- **Persistence:** all mutations survive reload; data stays consistent between tabs (storage event).
- **Console:** zero errors or React warnings (keys, hydration) across all routes.
- **Performance sanity:** no route ships figma.com URLs; uploaded images are downscaled (data URL < ~250 KB each).

## 6. Output
1. Fix everything you can, then re-run §1 and the failed scenarios.
2. Write `docs/QA_REPORT.md` with:
   - Summary: total checks, passed, fixed, still failing.
   - Table per section (§1–§5): check, result (PASS / FIXED / FAIL), notes, and file:line for fixes.
   - Visual diffs still open, by Figma frame id.
   - Known limitations of the mock (no real email, no real auth, localStorage size limit) and what changes once Supabase is added.
3. Reply with a short summary and the path to the report.
