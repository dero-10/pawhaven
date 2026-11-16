# PawHaven — build conventions

Static, fully working front end. **No backend yet** — all data goes through the mock store (`src/lib/store.tsx`), persisted in `localStorage`. Supabase comes later and will replace the store actions, so pages must never touch `localStorage` directly.

## Source of truth
- Figma file `YDIASre6Fg6dfSGjFjrfct` (pawhaven), Page 1 (`0:1`). Desktop frames are 1440px wide; content area is 1296px with 72px gutters (`.container-page`).
- Superseded duplicate frames — ignore unless a detail is missing elsewhere: `12:46` Review listing, `12:50` My listings, `12:54` Messages, `12:58` Account settings, `12:62` Safety & support. The `14:xx` versions are final.

## Stack
Next.js 15 App Router · React 19 · TypeScript · Tailwind v4 (tokens in `src/app/globals.css` `@theme`). Fonts: Inter (`font-sans`), Lora (`font-serif`).

## Tokens (use these, never raw hex)
`bg-canvas` #fdfcf8 · `text-ink` #203f35 · `bg-brand` #245a46 · `text-muted` #64716a · `border-line` #e3e7de · `sage-50/100/150/175/200/300` · `sand-100/200` · `peach-50/100/200/500` · `lilac-100` · `danger`, `warning` (+ `-50`) · `shadow-float`, `shadow-card`. If a frame uses a colour not in the list, add it to `@theme` in globals.css.

## Shared building blocks (reuse, don't recreate)
- `components/layout/PageShell.tsx` — `PageShell` (header+footer), `PageHeading`, `RequireAuth` (pass `admin` for admin pages), `EmptyState`, `LoadingBlock`.
- `components/layout/Header.tsx` — logged-out nav: Find a pet / How it works / Our mission / Log in / + Post a pet. Logged-in: Find a pet / Saved pets / Messages / {first name ▾ menu} / + Post a pet.
- `components/ui/Button.tsx` — `Button`, `ButtonLink`, `buttonClass` (variants primary/secondary/outline/ghost/peach/danger).
- `components/ui/Field.tsx` — `Field`, `Label`, `Input`, `Textarea`, `Select`, `Chip`, `CheckRow`, `Toggle`, `FieldError`.
- `components/ui/Toast.tsx` — `useToast()(text, "success"|"error"|"info")`.
- `components/Icon.tsx` — `<Icon name="..." size={n} />` renders `/public/icons/<name>.svg`.
- `components/pets/PetCard.tsx` — `PetCard`, `PetCardSkeleton`, `PetArt` (paw artwork or photo), `SaveButton`, `ListingBadge`.
- `lib/format.ts` — labels & formatters (age, fee, status labels, `timeAgo`, tone colours).
- `lib/store.tsx` — `useStore()`; see `StoreValue` for every action. Check `ready` before rendering user-dependent UI.

## Rules
1. Every page is a client component using `PageShell`. Pages needing login wrap content in `<RequireAuth>`.
2. Every interactive element in the design must work: buttons navigate or mutate the store, forms validate (inline `FieldError` + `aria-invalid`), and show success/error feedback.
3. Figma assets: download to `public/figma/<area>/` with descriptive names; never reference `figma.com/api/mcp/asset` URLs at runtime. If an identical icon already exists in `public/icons`, reuse it.
4. Responsive: designs are desktop; collapse to one column under `md`, no horizontal scroll at 375px.
5. Accessibility: semantic headings, labels on all inputs, focus-visible, buttons are `<button>`, links are `<Link>`.
6. Copy: use the exact text from Figma.

## Routes
| Route | Figma frame |
|---|---|
| `/` | 6:2 Homepages |
| `/login` | 14:27 Log in |
| `/signup` | 14:29 Create an account |
| `/verify-email` | 14:31 Verify your email |
| `/forgot-password` | 14:33 Forgot password |
| `/reset-password?token=` | 14:35 Reset password |
| `/pets` (query: species, city, type, …) | 14:37 Find a pet |
| `/pets/[id]` | 14:39 Pet Profile |
| `/saved` | 14:41 Saved pets |
| `/pets/[id]/apply` | 12:34 Adoption application |
| `/pets/[id]/apply/sent` | 12:38 Application sent |
| `/applications` | 14:45 Adoption request status |
| `/post` → `/post/health` → `/post/story` → `/post/review` | 14:47 / 14:49 / 14:51 / 14:53 Post a pet |
| `/post/submitted` | 14:55 Listing submitted |
| `/my-listings` | 14:57 My listings |
| `/my-listings/[id]/requests` | 14:59 Review adoption requests |
| `/messages` (`?c=` conversation, `?pet=` start new) | 14:61 Messages |
| `/account` | 14:63 Account & privacy |
| `/safety` (anchors: #report, #contact, #resources, #rehoming, #privacy, #terms, #accessibility) | 14:65 Safety & support |
| `/admin/moderation` | 14:67 Moderation workspace |
| `not-found`, `error`, `loading`, `/states` | 14:69 Essential states |

## Demo accounts (mock)
- `demo@pawhaven.app` / `pawhaven123` — regular user with listings, applications, messages.
- `admin@pawhaven.app` / `pawhaven123` — moderator.
- Email verification accepts any 6-digit code. Password reset shows the mock link on screen instead of emailing it.
