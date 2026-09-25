import { createClient } from "./supabase/client";

export type AccountType = "parent" | "provider";

/* The choice made on /signup has to survive a round trip that leaves the page:
   OAuth redirects away and back, and email signup may confirm on another tab.
   Email signups also carry it in user_metadata; OAuth ones rely on this key.
   AccountTypeGate reads either and claims it once the user is signed in. */
const PENDING_KEY = "recess-forum:pending-account-type";
const EXPERT_KEY = "recess-forum:wants-expert";

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

/* Whether the person asked, at signup, to apply for Verified Expert. Carried
   the same way as the account type; the gate opens the application after. */
export function setPendingWantsExpert(wants: boolean) {
  try {
    if (wants) localStorage.setItem(EXPERT_KEY, "1");
    else localStorage.removeItem(EXPERT_KEY);
  } catch { /* ignore */ }
}

export function takePendingWantsExpert(): boolean {
  try {
    const v = localStorage.getItem(EXPERT_KEY) === "1";
    localStorage.removeItem(EXPERT_KEY);
    return v;
  } catch {
    return false;
  }
}

export async function submitExpertApplication(input: { expertType: string; credentialInfo: string; filePath: string | null }) {
  const res = await fetch("/api/expert-applications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Couldn't send your application. Please try again.");
}

/** Sets the signed-in user's account type (once) and, for parents, assigns a
 *  founding number while any of the 500 remain. Server-side logic lives in the
 *  set_account_type Postgres function. */
export async function claimAccountType(type: AccountType) {
  const supabase = createClient();
  const { error } = await supabase.rpc("set_account_type", { p_type: type });
  if (error) throw error;
}
