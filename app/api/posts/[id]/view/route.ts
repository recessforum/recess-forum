import { NextResponse } from "next/server";
import { registerView } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const views = await registerView(supabase, id);
  return NextResponse.json({ views });
}
