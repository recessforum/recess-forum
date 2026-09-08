import { NextResponse } from "next/server";
import { isAdmin, reviewExpertApplication } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "log in" }, { status: 401 });
  if (!(await isAdmin(supabase, user.id))) return NextResponse.json({ error: "admins only" }, { status: 403 });

  try {
    await reviewExpertApplication(supabase, id, "rejected", user.id);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "review failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
