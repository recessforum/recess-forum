import { CATEGORIES } from "./taxonomy";

/** Wording shown next to the opt-in box. Stored with the consent record, so
 *  change it here (not in the component) if it ever changes. */
export const ALERT_CONSENT_TEXT =
  "Email me when there's a new post in the topics I picked. I can unsubscribe anytime from any email or in Settings.";

export const DIGEST_CONSENT_TEXT =
  "Send me a weekly digest of the best posts in my topics. I can unsubscribe anytime.";

/** Most alert emails one member gets per day, however many posts go up. */
export const DAILY_ALERT_CAP = 5;

export interface TopicPrefs {
  categories: string[];
  categoryEmails: boolean;
  /** Weekly digest opt-in (separate from per-post alerts). */
  weeklyDigest?: boolean;
}

const CATEGORY_IDS = new Set(CATEGORIES.map((c) => c.id));
export const isValidCategoryList = (v: unknown): v is string[] =>
  Array.isArray(v) && v.length > 0 && v.length <= CATEGORY_IDS.size && v.every((c) => typeof c === "string" && CATEGORY_IDS.has(c));

/* Like the account type, the choice made on /signup has to survive OAuth
   redirects and email confirmation. Email signups also carry it in
   user_metadata; InterestsGate reads either and saves it once signed in. */
const PENDING_KEY = "recess-forum:pending-topic-prefs";

export function setPendingTopicPrefs(prefs: TopicPrefs) {
  try { localStorage.setItem(PENDING_KEY, JSON.stringify(prefs)); } catch { /* private mode: the gate will just ask */ }
}

export function takePendingTopicPrefs(): TopicPrefs | null {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    localStorage.removeItem(PENDING_KEY);
    return parsePrefs(raw ? JSON.parse(raw) : null);
  } catch {
    return null;
  }
}

export function parsePrefs(v: unknown): TopicPrefs | null {
  if (!v || typeof v !== "object") return null;
  const { categories, categoryEmails, weeklyDigest } = v as Record<string, unknown>;
  return isValidCategoryList(categories) ? { categories, categoryEmails: categoryEmails === true, weeklyDigest: weeklyDigest === true } : null;
}

export async function saveTopicPrefs(prefs: TopicPrefs, extra?: { replyEmails?: boolean }): Promise<void> {
  const res = await fetch("/api/notification-prefs", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...prefs, ...extra }),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Couldn't save your topics. Please try again.");
}
