"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { createClient } from "./supabase/client";
import { APP_SCHEME } from "./app-scheme";

export interface AuthProfile {
  id: string;
  email: string | null;
  display_name: string;
  role: "member" | "verified_expert" | "admin";
  expert_type: string | null;
  avatar_url: string | null;
  account_type: "parent" | "provider" | "expert" | null;
  founding_number: number | null;
}

const AuthContext = createContext<{ profile: AuthProfile | null; loading: boolean; refreshProfile: () => Promise<void> }>({
  profile: null,
  loading: true,
  refreshProfile: async () => {},
});

export function AuthProvider({ initialProfile, children }: { initialProfile: AuthProfile | null; children: ReactNode }) {
  const [profile, setProfile] = useState(initialProfile);
  const [loading, setLoading] = useState(false);

  const loadProfile = async (userId: string, email: string | null) => {
    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select("id, display_name, role, expert_type, avatar_url, account_type, founding_number")
      .eq("id", userId)
      .single();
    setProfile(data ? { ...data, email } : null);
  };

  useEffect(() => {
    const supabase = createClient();
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        setProfile(null);
        return;
      }
      setLoading(true);
      await loadProfile(session.user.id, session.user.email ?? null);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Sign-in returns here either as a custom-scheme URL (from the in-app
  // browser sheet) or, when the OS routes it, a Universal Link (iOS) / App Link
  // (Android) on /auth/callback that opens this app instead of the browser (see /.well-known/apple-app-site-association
  // and /.well-known/assetlinks.json), but Capacitor only delivers that as an
  // `appUrlOpen` event — the app's own webview still needs to be pointed at
  // the URL itself to actually complete the OAuth code exchange.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const listenerPromise = CapacitorApp.addListener("appUrlOpen", async ({ url }) => {
      // Sign-in runs in an in-app browser sheet; close it, then finish the
      // code exchange in this webview (where the PKCE verifier lives).
      await Browser.close().catch(() => {});
      const parsed = new URL(url);
      window.location.href = parsed.protocol === `${APP_SCHEME}:`
        ? `${window.location.origin}/auth/callback${parsed.search}`
        : url;
    });
    return () => { listenerPromise.then((l) => l.remove()); };
  }, []);

  const refreshProfile = async () => {
    if (!profile) return;
    await loadProfile(profile.id, profile.email);
  };

  return <AuthContext.Provider value={{ profile, loading, refreshProfile }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
