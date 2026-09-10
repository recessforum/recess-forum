import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { AuthProvider, type AuthProfile } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/server";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "Recess Forum",
  description: "A discussion forum for parents navigating their kids' education.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let initialProfile: AuthProfile | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("id, display_name, role, expert_type, avatar_url")
      .eq("id", user.id)
      .single();
    if (data) initialProfile = { ...data, email: user.email ?? null };
  }

  return (
    <html lang="en" className={`${inter.className} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#F7F6F3] text-[#1C1B19]">
        <AuthProvider initialProfile={initialProfile}>
          <Header />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
