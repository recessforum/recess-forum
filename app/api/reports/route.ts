import { NextRequest, NextResponse } from "next/server";
import { createReport } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "log in to report" }, { status: 401 });

  const data = (await req.json()) as { targetType: "post" | "comment" | "user"; targetId: string; reason: string };
  if (!data.targetId || !data.reason?.trim() || !["post", "comment", "user"].includes(data.targetType)) {
    return NextResponse.json({ error: "targetId, targetType, and reason are required" }, { status: 400 });
  }

  await createReport(supabase, { targetType: data.targetType, targetId: data.targetId, reason: data.reason.trim() }, user.id);
  return NextResponse.json({ ok: true });
}
