import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "log in" }, { status: 401 });
  // RLS limits this to the owner's own rows.
  const { data } = await supabase.from("saved_documents").select("id, tool, title, data, share_token, updated_at").eq("id", id).maybeSingle();
  if (!data) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ document: {
    id: data.id, tool: data.tool, title: data.title, data: data.data, shareToken: data.share_token, updatedAt: new Date(data.updated_at).getTime(),
  } });
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "log in" }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof b.title === "string" && b.title.trim()) patch.title = b.title.trim().slice(0, 140);
  if (typeof b.data === "object" && b.data !== null) patch.data = b.data;
  const { error, count } = await supabase.from("saved_documents").update(patch, { count: "exact" }).eq("id", id);
  if (error || !count) return NextResponse.json({ error: "Couldn't save. Please try again." }, { status: error ? 500 : 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "log in" }, { status: 401 });
  await supabase.from("saved_documents").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
