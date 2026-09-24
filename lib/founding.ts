import type { SupabaseClient } from "@supabase/supabase-js";

export const FOUNDING_CAP = 100;

export interface FoundingStatus {
  cap: number;
  filled: number;
  spotsLeft: number;
  /** created_at (ms) of the most recent profile that still counts as a
   *  founding member. null once fewer than `cap` accounts exist yet — in
   *  that case everyone who has signed up so far qualifies. */
  cutoff: number | null;
}

/** Real signup-order based, not a stored flag — "founding member" is just
 *  "one of the first `cap` accounts by created_at". No migration needed:
 *  profiles.created_at already exists and is set at signup. */
export async function getFoundingStatus(supabase: SupabaseClient): Promise<FoundingStatus> {
  const { count, error: countError } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true });
  if (countError) throw countError;

  const total = count ?? 0;
  if (total < FOUNDING_CAP) {
    return { cap: FOUNDING_CAP, filled: total, spotsLeft: FOUNDING_CAP - total, cutoff: null };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("created_at")
    .order("created_at", { ascending: true })
    .limit(FOUNDING_CAP);
  if (error) throw error;

  const cutoffRow = data?.[data.length - 1];
  return {
    cap: FOUNDING_CAP,
    filled: FOUNDING_CAP,
    spotsLeft: 0,
    cutoff: cutoffRow ? new Date(cutoffRow.created_at).getTime() : null,
  };
}

export function isFoundingMember(createdAt: number, status: FoundingStatus): boolean {
  return status.cutoff === null || createdAt <= status.cutoff;
}
