import { NextResponse } from "next/server";
import { getMyCircleIds } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ circleIds: [] });

  const circleIds = await getMyCircleIds(supabase, user.id);
  return NextResponse.json({ circleIds });
}
