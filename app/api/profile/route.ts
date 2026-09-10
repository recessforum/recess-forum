import { NextRequest, NextResponse } from "next/server";
import { updateAvatar } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "log in" }, { status: 401 });

  const data = (await req.json()) as { avatarUrl: string | null };
  await updateAvatar(supabase, user.id, data.avatarUrl);
  return NextResponse.json({ ok: true });
}
