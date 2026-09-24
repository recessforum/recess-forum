import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { AccountTypeGate } from "@/components/AccountTypeGate";
import { AuthProvider, type AuthProfile } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/server";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

const SITE_URL = "https://www.recessforum.com";
const TITLE = "Recess Forum — for parents navigating school";
const DESCRIPTION = "A discussion forum for parents navigating their kids' education — bullying, IEPs, homeschooling, college prep, and everything in between.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: "%s | Recess Forum" },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "Recess Forum",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let initialProfile: AuthProfile | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("id, display_name, role, expert_type, avatar_url, account_type, founding_number")
      .eq("id", user.id)
      .single();
    if (data) initialProfile = { ...data, email: user.email ?? null };
  }

  // Basic site identity markup — not tied to any specific page's content, so
  // safe to keep static (no potentialAction/SearchAction: the homepage's
  // search box isn't URL-addressable, and claiming one that doesn't work is
  // worse than having none).
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Recess Forum",
    url: SITE_URL,
    description: DESCRIPTION,
  };

  return (
    <html lang="en" className={`${inter.className} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#F7F6F3] text-[#1C1B19]">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
        <AuthProvider initialProfile={initialProfile}>
          <Header />
          <AccountTypeGate />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
