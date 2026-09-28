import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Saves a Verified Expert's public bio and practice website. */
export async function PUT(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "log in" }, { status: 401 });

  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (me?.role !== "verified_expert" && me?.role !== "admin") {
    return NextResponse.json({ error: "Only Verified Experts can add a bio and website." }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const bio = typeof body.bio === "string" ? body.bio.trim() : "";
  let website = typeof body.website === "string" ? body.website.trim() : "";
  if (website && !/^https?:\/\//i.test(website)) website = `https://${website}`;
  website = website.replace(/^http:\/\//i, "https://");
  if (bio.length > 400) return NextResponse.json({ error: "Keep the bio under 400 characters." }, { status: 400 });
  if (website) {
    try {
      const u = new URL(website);
      if (u.protocol !== "https:" || website.length > 200) throw new Error();
    } catch {
      return NextResponse.json({ error: "That website address doesn't look right." }, { status: 400 });
    }
  }

  const { error } = await supabase.from("profiles").update({ bio: bio || null, website: website || null }).eq("id", user.id);
  if (error) return NextResponse.json({ error: "Couldn't save. Please try again." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
