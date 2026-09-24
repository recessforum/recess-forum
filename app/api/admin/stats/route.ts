import { NextResponse } from "next/server";
import { getAdminBlocks, getAdminStats, isAdmin } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "log in" }, { status: 401 });
  if (!(await isAdmin(supabase, user.id))) return NextResponse.json({ error: "admins only" }, { status: 403 });

  const [stats, blocks] = await Promise.all([
    getAdminStats(supabase),
    getAdminBlocks(supabase),
  ]);
  return NextResponse.json({ stats, blocks });
}
