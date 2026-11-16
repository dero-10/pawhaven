# Pawhaven

A pet adoption & rehoming marketplace — "A best friend. A fresh start." Built from the PawHaven Figma design as a fully working static front end.

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS v4. There is no backend yet: all data goes through a mock store (`src/lib/store.tsx`) persisted in `localStorage`, ready to be swapped for Supabase.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

Demo accounts (mock):
- `demo@pawhaven.app` / `pawhaven123` — regular user with listings, applications and messages
- `admin@pawhaven.app` / `pawhaven123` — moderator (Moderation workspace)

Email verification accepts any 6-digit code. Password reset shows a demo link on screen instead of sending an email.

## Features
- Auth: log in, sign up, verify email, forgot/reset password
- Discover: home search, Find a pet (filters in URL), pet profile, saved pets
- Adoption: application form, request status tracker, owner review of requests
- Post a pet: 4-step wizard with photo upload and auto-saved drafts, My listings
- Messages with report/block, Account & privacy (export/delete data), Safety & support
- Moderation workspace for admins, plus 404, error, loading and empty states

## Docs
- `docs/CONVENTIONS.md` — route ↔ Figma frame map, design tokens, shared components
- `docs/VERIFY_PROMPT.md` — full QA prompt that checks every feature
- `docs/QA_REPORT.md` — latest QA results
