# Splitr

A free, installable **Splitwise-style** expense-splitting app. Track shared
expenses across groups, split bills equally or unequally, see who owes whom, and
settle up.

- **Frontend:** Next.js (App Router, TypeScript) + Tailwind CSS — exported as a
  fully static site (no server).
- **Backend:** [Supabase](https://supabase.com) (Postgres + Auth + Storage),
  called directly from the browser. Row-level security keeps each user's data private.
- **Hosting:** GitHub Pages (free), auto-deployed by GitHub Actions on every push.
- **App-like:** installable as a PWA ("Add to Home Screen").

See [PLAN.md](./PLAN.md) for the full plan and module-by-module build order.

## Run locally

```bash
npm install
npm run dev        # http://localhost:3000
```

Build the static site (output goes to `./out`):

```bash
npm run build
```

## Environment variables

Copy `.env.example` to `.env.local` and fill in your Supabase values (needed from
module M1 onward):

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

For production, add the same two values as **repository secrets** (Settings →
Secrets and variables → Actions) so the deploy workflow can build with them.

## Deploy to GitHub Pages

1. Push this repo to GitHub.
2. In the repo, go to **Settings → Pages** and set **Source = GitHub Actions**.
3. Every push to `main` runs `.github/workflows/deploy.yml`, which builds the
   static site and publishes it to
   `https://<your-username>.github.io/<repo-name>/`.
