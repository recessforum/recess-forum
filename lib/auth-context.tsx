"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { createClient } from "./supabase/client";

export interface AuthProfile {
  id: string;
  email: string | null;
  display_name: string;
  role: "member" | "verified_expert" | "admin";
  expert_type: string | null;
}

const AuthContext = createContext<{ profile: AuthProfile | null; loading: boolean }>({ profile: null, loading: true });

export function AuthProvider({ initialProfile, children }: { initialProfile: AuthProfile | null; children: ReactNode }) {
  const [profile, setProfile] = useState(initialProfile);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        setProfile(null);
        return;
      }
      setLoading(true);
      const { data } = await supabase
        .from("profiles")
        .select("id, display_name, role, expert_type")
        .eq("id", session.user.id)
        .single();
      setProfile(data ? { ...data, email: session.user.email ?? null } : null);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return <AuthContext.Provider value={{ profile, loading }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
