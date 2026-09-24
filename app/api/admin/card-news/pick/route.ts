import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/db";
import { buildCardNewsContent, pickCardNewsPost } from "@/lib/cardNews";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "log in" }, { status: 401 });
  if (!(await isAdmin(supabase, user.id))) return NextResponse.json({ error: "admins only" }, { status: 403 });

  const exclude = (req.nextUrl.searchParams.get("exclude") || "").split(",").filter(Boolean);
  const picked = await pickCardNewsPost(supabase, exclude);
  if (!picked) return NextResponse.json({ error: "no eligible posts" }, { status: 404 });

  const content = buildCardNewsContent(picked.post, picked.topReply);
  return NextResponse.json({ content });
}
