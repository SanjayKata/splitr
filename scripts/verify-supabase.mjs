// One-off connectivity check: confirms the Supabase URL/key work and that the
// migration created the expected tables. Reads .env.local directly.
// Run: node scripts/verify-supabase.mjs
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.trim() && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

const tables = [
  "profiles",
  "groups",
  "group_members",
  "expenses",
  "expense_splits",
  "settlements",
];

let ok = true;
for (const t of tables) {
  const { error } = await supabase
    .from(t)
    .select("*", { count: "exact", head: true });
  if (error) {
    ok = false;
    console.log(`  ✗ ${t}: ${error.message} (code ${error.code})`);
  } else {
    console.log(`  ✓ ${t}: reachable`);
  }
}

console.log(
  ok
    ? "\nAll tables present and reachable. Connection works."
    : "\nSome tables are missing — has the migration been run in the SQL Editor?",
);
process.exit(ok ? 0 : 1);
