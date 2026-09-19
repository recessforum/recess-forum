import { Capacitor } from "@capacitor/core";
import { Share } from "@capacitor/share";

export const SITE_URL = "https://www.recessforum.com";

export type ShareResult = "shared" | "copied" | "cancelled" | "failed";

/** Opens the native share sheet where there is one, otherwise copies the link. */
export async function sharePost(post: { id: string; title: string }): Promise<ShareResult> {
  const url = `${SITE_URL}/post/${post.id}`;
  const text = `This might help: "${post.title}" on Recess Forum`;

  if (Capacitor.isNativePlatform()) {
    try { await Share.share({ title: post.title, text, url }); return "shared"; } catch { return "cancelled"; }
  }
  if (typeof navigator !== "undefined" && navigator.share) {
    try { await navigator.share({ title: post.title, text, url }); return "shared"; } catch { return "cancelled"; }
  }
  try {
    await navigator.clipboard.writeText(url);
    return "copied";
  } catch {
    return "failed";
  }
}
