import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Public list of Verified Experts (display info only). */
export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles")
    .select("id, display_name, avatar_url, expert_type, bio, website")
    .eq("role", "verified_expert").order("display_name");
  return NextResponse.json({
    experts: (data ?? []).map((p) => ({
      id: p.id, displayName: p.display_name, avatarUrl: p.avatar_url, expertType: p.expert_type, bio: p.bio ?? null, website: p.website ?? null,
    })),
  });
}
