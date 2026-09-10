import { NextResponse } from "next/server";
import { getProfile } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const profile = await getProfile(supabase, id);
  if (!profile) return NextResponse.json({ error: "profile not found" }, { status: 404 });
  return NextResponse.json({ profile });
}
