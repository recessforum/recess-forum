import { NextResponse } from "next/server";
import { leaveCircle } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "log in" }, { status: 401 });

  await leaveCircle(supabase, id, user.id);
  return NextResponse.json({ ok: true });
}
