import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Turns a private share link on (new random token) or off. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "log in" }, { status: 401 });
  const on = (await req.json().catch(() => ({}))).on === true;
  const token = on ? crypto.randomUUID() : null;
  const { error, count } = await supabase.from("saved_documents").update({ share_token: token }, { count: "exact" }).eq("id", id);
  if (error || !count) return NextResponse.json({ error: "Couldn't update sharing." }, { status: 500 });
  return NextResponse.json({ shareToken: token });
}
