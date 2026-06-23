import { z } from "zod";

/**
 * Public environment variables (safe to ship in a static site).
 *
 * `NEXT_PUBLIC_*` values are statically inlined by Next at build time, so they
 * must be referenced by their full literal names below — not via a dynamic key.
 */
const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;

/**
 * Whether the app shows the "confirm your email" signup step.
 *
 * This controls the *app's* behavior only. Whether Supabase actually sends
 * confirmation emails is a server-side Supabase setting ("Confirm email"); keep
 * the two aligned. Defaults to false (no email step) so the app works without
 * emails out of the box.
 */
export const requireEmailConfirmation =
  process.env.NEXT_PUBLIC_REQUIRE_EMAIL_CONFIRMATION === "true";

let cached: PublicEnv | null = null;

/**
 * Returns validated public env vars, throwing a clear, actionable error if they
 * are missing. Called lazily (at runtime, never during build/prerender) so a
 * build without secrets doesn't fail.
 */
export function getPublicEnv(): PublicEnv {
  if (cached) return cached;

  const parsed = publicEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(
      "Supabase environment variables are missing or invalid.\n" +
        "Copy .env.example to .env.local and fill in your Supabase project values:\n" +
        details,
    );
  }

  cached = parsed.data;
  return cached;
}
