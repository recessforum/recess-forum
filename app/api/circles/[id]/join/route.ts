import { NextResponse } from "next/server";
import { joinCircle } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "log in to join a circle" }, { status: 401 });

  await joinCircle(supabase, id, user.id);
  return NextResponse.json({ ok: true });
}
