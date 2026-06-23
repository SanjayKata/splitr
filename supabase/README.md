# Supabase setup

The app talks to Supabase directly from the browser. Data is protected by
**row-level security (RLS)**, defined in the migration here.

## 1. Create the project (free)

1. Sign up at [supabase.com](https://supabase.com) and create a new project.
2. Choose a region close to you and set a database password (save it somewhere).
3. Wait ~2 minutes for it to provision.

## 2. Apply the schema

In the Supabase dashboard: **SQL Editor → New query**, paste the contents of
[`migrations/0001_init.sql`](./migrations/0001_init.sql), and click **Run**.

(Alternatively, with the Supabase CLI linked to your project: `supabase db push`.)

## 3. Get your keys

Dashboard → **Project Settings → API**. Copy:

- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Put them in `.env.local` (copy from `.env.example`) for local dev, and add the
same two as **repository secrets** for the GitHub Pages deploy.

> The anon key is meant to be public — it only grants access that your RLS
> policies allow. Never use the **service_role** key in the frontend.

## 4. (Later) Regenerate types

Once the project exists, the TypeScript types can be regenerated from the live
schema instead of hand-maintained:

```bash
npx supabase gen types typescript --project-id <your-project-id> > src/types/database.ts
```
