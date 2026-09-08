import { NextResponse } from "next/server";
import { registerView } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Logged-in views dedup per real user; anonymous visitors share one bucket
  // (so the count still moves for anonymous traffic, just without per-visitor dedup).
  const views = await registerView(id, user?.id || "anon");
  return NextResponse.json({ views });
}
