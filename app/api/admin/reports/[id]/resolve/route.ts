import { NextResponse } from "next/server";
import { isAdmin, resolveReport } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "log in" }, { status: 401 });
  if (!(await isAdmin(supabase, user.id))) return NextResponse.json({ error: "admins only" }, { status: 403 });

  await resolveReport(supabase, id, "reviewed", user.id);
  return NextResponse.json({ ok: true });
}
