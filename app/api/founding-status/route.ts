import { NextResponse } from "next/server";
import { getFoundingStatus } from "@/lib/founding";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const status = await getFoundingStatus(supabase);
  return NextResponse.json(status);
}
