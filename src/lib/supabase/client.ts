import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getPublicEnv } from "@/lib/env";
import type { Database } from "@/types/database";

let client: SupabaseClient<Database> | null = null;

/**
 * Returns a singleton browser Supabase client.
 *
 * The app is a static site with no server, so all data access happens here in
 * the browser. The anon key is public by design; row-level security in the
 * database is what actually protects data.
 *
 * Call this lazily (inside effects or event handlers), never at module top level
 * or during render, so static prerendering/CI builds without secrets don't fail.
 */
export function getSupabaseClient(): SupabaseClient<Database> {
  if (client) return client;

  const env = getPublicEnv();
  client = createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    },
  );
  return client;
}
