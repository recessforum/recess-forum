import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { TOOL_BY_SLUG } from "@/lib/tools";

/** The signed-in member's saved documents (newest first). */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "log in" }, { status: 401 });
  const { data, error } = await supabase.from("saved_documents")
    .select("id, tool, title, share_token, updated_at").eq("user_id", user.id).order("updated_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Couldn't load your documents." }, { status: 500 });
  return NextResponse.json({
    documents: (data ?? []).map((d) => ({ id: d.id, tool: d.tool, title: d.title, shared: !!d.share_token, updatedAt: new Date(d.updated_at).getTime() })),
  });
}

/** Saves a new document from a tool. */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Log in to save documents." }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const title = typeof b.title === "string" ? b.title.trim().slice(0, 140) : "";
  if (!TOOL_BY_SLUG[b.tool] || !title || typeof b.data !== "object" || b.data === null) {
    return NextResponse.json({ error: "Nothing to save yet." }, { status: 400 });
  }
  const { data, error } = await supabase.from("saved_documents")
    .insert({ user_id: user.id, tool: b.tool, title, data: b.data }).select("id").single();
  if (error) return NextResponse.json({ error: "Couldn't save. Please try again." }, { status: 500 });
  return NextResponse.json({ id: data.id });
}
