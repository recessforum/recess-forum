import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { createClient } from "@/lib/supabase/client";

/**
 * Starts Google / Apple sign-in. On the web this is a normal redirect. In the
 * native apps it opens an in-app browser sheet (Safari View Controller on iOS,
 * Custom Tabs on Android) instead of bouncing the user out to their default
 * browser; `/auth/callback` then hands the code back to the app.
 * `onClosed` fires if the user dismisses the sheet without finishing.
 */
export async function startOAuth(provider: "google" | "apple", onClosed: () => void): Promise<void> {
  const supabase = createClient();
  const redirectTo = `${window.location.origin}/auth/callback`;

  if (!Capacitor.isNativePlatform()) {
    const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
    if (error) throw error;
    return;
  }

  const { data, error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo, skipBrowserRedirect: true } });
  if (error || !data.url) throw error ?? new Error("no sign-in url");
  const finished = await Browser.addListener("browserFinished", () => {
    finished.remove();
    onClosed();
  });
  await Browser.open({ url: data.url });
}
