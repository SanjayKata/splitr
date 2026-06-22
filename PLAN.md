# Splitr — a Splitwise-style expense splitting app

A free, self-hostable Splitwise clone. All code lives on **GitHub**, the site is hosted
on **GitHub Pages** (free static hosting), and the database + login live on **Supabase**
(free). Installable as a **PWA** ("Add to Home Screen").

> **Workflow:** plan-first, then build **module by module**. Each module below is a checkpoint —
> we finish and verify one before starting the next.

---

## 1. Goal & scope

Let groups of people track shared expenses and figure out who owes whom — like Splitwise.

**v1 features (all confirmed):**

1. **User accounts / login** — sign up, log in (Supabase Auth, email + password).
2. **Groups** — create groups (Trip, Roommates, Office…), invite/add members.
3. **Core split & balances** — add an expense, pick who paid, split it, see balances.
4. **Unequal / custom splits** — split equally, by exact amounts, by percentage, or by shares.
5. **Settle up & history** — record payments to clear debts; full activity log.
6. **Multi-currency** — each group has a currency; expenses recorded in it.
7. **Categories & receipts** — tag each expense; attach a receipt image (Supabase Storage).
8. **Simplify debts & export** — minimize number of payments; export balances/history to CSV.

---

## 2. Tech stack

| Layer           | Choice                                               | Why                                                                      |
| --------------- | ---------------------------------------------------- | ------------------------------------------------------------------------ |
| Framework       | Next.js (App Router, TypeScript) — **static export** | One codebase, exports to plain HTML/JS for GitHub Pages                  |
| UI              | React + Tailwind CSS                                 | Fast, clean, no heavy UI deps                                            |
| Database        | Supabase Postgres (free tier)                        | Real relational DB, free                                                 |
| Auth            | Supabase Auth                                        | Login built in, no extra service                                         |
| File storage    | Supabase Storage                                     | For receipt images                                                       |
| Security        | Postgres Row Level Security (RLS)                    | Users only see their own groups' data                                    |
| **Data access** | Supabase JS client, **browser-side only**            | No server needed — static site talks straight to Supabase                |
| **Hosting**     | **GitHub Pages** (static, free)                      | Site lives directly on git; no Vercel/server                             |
| **App-like**    | **PWA** (manifest + icons + service worker)          | Install to home screen, fullscreen, offline shell — like the name picker |

---

## 3. Monorepo layout

```
D:\Splitr
├─ PLAN.md                  ← this file
├─ README.md                ← setup + deploy instructions
├─ .env.local               ← Supabase keys (NOT committed)
├─ .env.example             ← template (committed)
├─ package.json
├─ next.config.js           ← static export + GitHub Pages basePath
├─ tailwind.config.ts
├─ .github/workflows/       ← auto-build & publish to GitHub Pages on push
├─ public/
│  ├─ manifest.webmanifest  ← PWA: name, icons, standalone display
│  ├─ icons/                ← app icons (192/512, maskable)
│  └─ sw.js                 ← service worker (offline app shell)
├─ supabase/
│  └─ migrations/           ← SQL schema + RLS policies (versioned)
└─ src/
   ├─ app/                  ← ROUTES (Next.js pages). UI only; call hooks.
   │  ├─ login, signup      ← public auth pages
   │  └─ (app)/             ← signed-in area (shared guard + header layout)
   │     ├─ dashboard       ← groups list
   │     ├─ groups/new      ← create group
   │     └─ group           ← group detail (?id=…)
   ├─ hooks/                ← React-Query bindings (use-groups, …) routes consume
   ├─ services/             ← SERVICES: business logic, shape domain objects
   ├─ repositories/         ← REPOSITORIES: the only code that touches Supabase
   ├─ components/           ← UI building blocks (ui/, auth/, app-header, …)
   ├─ lib/                  ← cross-cutting: supabase client, env, validation, money
   └─ types/                ← shared TypeScript types (database, domain)
```

### Layered architecture (routes → hooks → services → repositories)

Like the TPG project, data flows through clear layers — each only knows about the
one below it:

- **Routes** (`app/`) — pages/components. Presentation only; never query the DB.
- **Hooks** (`hooks/`) — React-Query wrappers (`useGroups`, `useCreateGroup`, …).
  Handle caching + cache invalidation; the binding between UI and services.
- **Services** (`services/`) — business logic. Orchestrate repositories, compute
  domain objects (e.g. member counts), no framework or raw SQL.
- **Repositories** (`repositories/`) — the _only_ place that calls Supabase.
  Pure data access (CRUD + RPC), returns table rows.

Auth: the Supabase client holds the user's **JWT** and sends it as
`Authorization: Bearer <token>` on every request; Postgres RLS reads `auth.uid()`
from it. No tokens are handled manually.

---

## 4. Data model (Postgres tables)

- **profiles** — one row per user (id → auth.users, display name, default currency).
- **groups** — id, name, currency, created_by, created_at.
- **group_members** — group_id, user_id (or invited email), role. Links people to groups.
- **expenses** — id, group_id, description, amount, currency, paid_by, category, receipt_url,
  split_type (`equal` | `exact` | `percent` | `shares`), created_at.
- **expense_splits** — expense_id, user_id, owed_amount. One row per participant per expense.
- **settlements** — id, group_id, from_user, to_user, amount, currency, note, created_at.

**RLS rule of thumb:** a user can read/write a row only if they are a member of that group.

---

## 5. Build order (module by module)

> We tackle these in order. After each, we run the app and confirm it works before moving on.

- [ ] **M0 — Scaffold & deploy skeleton.** Next.js + Tailwind set to **static export**, push to
      GitHub, enable **GitHub Pages** via Actions workflow, confirm a blank page is live on git.
      Locks in the free hosting pipeline early.
- [ ] **M1 — Supabase + schema.** Create Supabase project, run migration (tables + RLS),
      wire up the Supabase client + env vars.
- [ ] **M2 — Auth.** Sign up / log in / log out, protected routes, profile row on signup.
- [ ] **M3 — Groups.** Create a group, list my groups, add/invite members, pick currency.
- [ ] **M4 — Expenses (equal split) + balances.** Add expense, equal split, "who owes whom".
- [ ] **M5 — Custom splits.** Exact amounts, percentage, shares.
- [ ] **M6 — Settle up & history.** Record a payment, activity/transaction log.
- [ ] **M7 — Categories & receipts.** Category tags + receipt upload to Supabase Storage.
- [ ] **M8 — Simplify debts & CSV export.** Debt-minimization algorithm + export buttons.
- [ ] **M9 — PWA (install to home screen).** Manifest, icons, service worker → "Add to Home
      Screen" installs Splitr as a standalone app, just like the name picker.
- [ ] **M10 — Polish.** Empty states, mobile layout, error handling, final deploy.

---

## 6. What you'll need to do (one-time, free signups)

I'll guide you through each when we reach it — nothing needed up front:

1. **GitHub** account → we create a repo, push, and turn on GitHub Pages (this hosts the site).
2. **Supabase** account → create a project (gives us the DB + auth keys).

That's it — no Vercel, no server. The site is hosted on GitHub Pages and installs as a PWA.

---

## 7. Engineering standards (production-ready)

This is built to industry standards, not a throwaway prototype:

- **TypeScript strict** + `tsc --noEmit` type-check gate.
- **ESLint** (Next core-web-vitals + typescript rules) and **Prettier** (with Tailwind
  class sorting) — `npm run lint`, `npm run format`.
- **Unit tests** with Vitest (money/split/simplify math is tested as it's built) —
  `npm run test`.
- **CI** (`.github/workflows/ci.yml`): type-check, lint, format-check, test, and build run
  on every push/PR. Broken code can't reach the deployed site.
- **`npm run check`** runs the whole gate locally before pushing.
- **Security:** Postgres Row Level Security on every table; secrets via env vars / GitHub
  Actions secrets, never committed.
- **Accessibility & responsive UI** considered per module; receipts and money handled with
  explicit rounding to avoid floating-point errors.

## 8. Status

- [x] Requirements gathered, stack chosen
- [x] Plan written (this file)
- [x] **M0 — Scaffold:** Next.js static-export app, lint/format/test/CI tooling, GitHub
      Pages deploy workflow. Local build + full check pass.
- [ ] M0 — push to GitHub & confirm live on Pages (deferred by user; needs your GitHub repo)
- [x] **M1 — Supabase + schema (code):** full SQL migration (tables, indexes, triggers, RLS),
      env validation (zod), typed `Database` models, lazy browser Supabase client. Build/check
      pass without secrets.
- [x] **M1 — Supabase project live:** project created (US region), migration applied, all six
      tables verified reachable via `npm run verify:supabase`. `.env.local` wired.
- [x] **M2 — Auth:** signup/login/logout, session context, protected-route guard, friendly
      error mapping, reusable UI primitives (Button/Input/Field/Spinner). Verified live in the
      browser (signup flow, Supabase errors, protected-route redirect, no console errors).
- [x] **M3 — Groups (code):** create/list groups (with member counts), group detail with
      member roster, add member by email (SECURITY DEFINER RPC), remove member; currency
      picker. Adopted **TanStack Query** for all data fetching/mutations (caching + auto-refetch)
      and an `(app)` route-group layout (guard + header). All checks + static build pass.
- [x] **M4 — Expenses + balances (code):** atomic `create_expense` RPC (migration 0003);
      tested equal-split math (remainder-cent distribution) and net-balance math; expenses
      repository/service/hooks; add-expense form (payer + participant selection), expense list
      with delete, per-member balances summary on the group page. 29 unit tests; build passes.
- [ ] **Pending your Supabase steps** (then we live-test M3 + M4 together):
  - apply migrations `0002_group_members_rpc.sql` and `0003_create_expense.sql`
  - turn OFF email confirmation so the existing account can log in
- [ ] M5 — Custom splits (exact / percent / shares) — next

**Note:** the Supabase project has email confirmation ON (default), so new accounts must
confirm via email before they get a session. For easy local testing this can be turned off in
Supabase → Authentication → Sign In/Providers → Email → "Confirm email".
