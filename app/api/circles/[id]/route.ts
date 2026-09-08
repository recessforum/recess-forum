import { NextResponse } from "next/server";
import { getCircle, isCircleMember } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const circle = await getCircle(supabase, id);
  if (!circle) return NextResponse.json({ error: "circle not found" }, { status: 404 });

  const { data: { user } } = await supabase.auth.getUser();
  const isMember = user ? await isCircleMember(supabase, id, user.id) : false;

  return NextResponse.json({ circle, isMember });
}
