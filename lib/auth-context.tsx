"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { createClient } from "./supabase/client";

export interface AuthProfile {
  id: string;
  email: string | null;
  display_name: string;
  role: "member" | "verified_expert" | "admin";
  expert_type: string | null;
  avatar_url: string | null;
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
      .select("id, display_name, role, expert_type, avatar_url")
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

  const refreshProfile = async () => {
    if (!profile) return;
    await loadProfile(profile.id, profile.email);
  };

  return <AuthContext.Provider value={{ profile, loading, refreshProfile }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
