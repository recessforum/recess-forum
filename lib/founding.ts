import type { SupabaseClient } from "@supabase/supabase-js";

export const FOUNDING_CAP = 500;

export interface FoundingStatus {
  cap: number;
  filled: number;
  spotsLeft: number;
}

/** Founding Parent badges are a stored `profiles.founding_number` (1..500),
 *  handed out by the `set_account_type` Postgres function to the first 500
 *  accounts that choose "parent" — see migrations/2026-09-24-account-type-founding.sql.
 *  Business/service provider accounts never get one. */
export async function getFoundingStatus(supabase: SupabaseClient): Promise<FoundingStatus> {
  const { count, error } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .not("founding_number", "is", null);
  if (error) throw error;
  const filled = Math.min(count ?? 0, FOUNDING_CAP);
  return { cap: FOUNDING_CAP, filled, spotsLeft: FOUNDING_CAP - filled };
}
