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

  // App builds from before the in-app browser was added (Android builds up to
  // 1.0 / versionCode 1) don't include the Browser plugin, and Google blocks
  // sign-in inside the app's own webview, so there's no working fallback.
  // Say so plainly instead of surfacing the plugin error.
  if (!Capacitor.isPluginAvailable("Browser")) {
    throw new Error(`Signing in with ${provider === "google" ? "Google" : "Apple"} needs the latest version of the Recess Forum app. Please update the app, or log in with your email and password for now.`);
  }

  const { data, error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo, skipBrowserRedirect: true } });
  if (error || !data.url) throw error ?? new Error("no sign-in url");
  const finished = await Browser.addListener("browserFinished", () => {
    finished.remove();
    onClosed();
  });
  await Browser.open({ url: data.url });
}
