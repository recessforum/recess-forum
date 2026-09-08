import { NextRequest, NextResponse } from "next/server";
import { addComment } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "log in to comment" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", user.id).single();
  if (!profile) return NextResponse.json({ error: "profile not found" }, { status: 500 });

  const data = (await req.json()) as { parentId: string | null; body: string };
  if (!data.body?.trim()) return NextResponse.json({ error: "body is required" }, { status: 400 });

  const comment = await addComment(id, data.parentId || null, { author: profile.display_name, body: data.body.trim() }, user.id);
  return NextResponse.json({ comment });
}
