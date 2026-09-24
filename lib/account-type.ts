import { createClient } from "./supabase/client";

export type AccountType = "parent" | "provider";

/* The choice made on /signup has to survive a round trip that leaves the page:
   OAuth redirects away and back, and email signup may confirm on another tab.
   Email signups also carry it in user_metadata; OAuth ones rely on this key.
   AccountTypeGate reads either and claims it once the user is signed in. */
const PENDING_KEY = "recess-forum:pending-account-type";

export function setPendingAccountType(type: AccountType) {
  try { localStorage.setItem(PENDING_KEY, type); } catch { /* private mode: the gate will just ask */ }
}

export function takePendingAccountType(): AccountType | null {
  try {
    const v = localStorage.getItem(PENDING_KEY);
    localStorage.removeItem(PENDING_KEY);
    return v === "parent" || v === "provider" ? v : null;
  } catch {
    return null;
  }
}

/** Sets the signed-in user's account type (once) and, for parents, assigns a
 *  founding number while any of the 500 remain. Server-side logic lives in the
 *  set_account_type Postgres function. */
export async function claimAccountType(type: AccountType) {
  const supabase = createClient();
  const { error } = await supabase.rpc("set_account_type", { p_type: type });
  if (error) throw error;
}
