import { NextRequest, NextResponse } from "next/server";
import { blockUser, getMyBlockedUsers, unblockUser } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "log in" }, { status: 401 });

  const blocked = await getMyBlockedUsers(supabase, user.id);
  return NextResponse.json({ blocked });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "log in" }, { status: 401 });

  const data = (await req.json()) as { userId: string };
  if (!data.userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });
  if (data.userId === user.id) return NextResponse.json({ error: "can't block yourself" }, { status: 400 });

  await blockUser(supabase, user.id, data.userId);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "log in" }, { status: 401 });

  const data = (await req.json()) as { userId: string };
  if (!data.userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });

  await unblockUser(supabase, user.id, data.userId);
  return NextResponse.json({ ok: true });
}
