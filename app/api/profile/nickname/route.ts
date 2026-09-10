import { NextRequest, NextResponse } from "next/server";
import { updateDisplayName } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "log in" }, { status: 401 });

  const data = (await req.json()) as { displayName: string };
  const displayName = data.displayName?.trim();
  if (!displayName || displayName.length < 2 || displayName.length > 30) {
    return NextResponse.json({ error: "Nickname must be 2-30 characters." }, { status: 400 });
  }

  try {
    await updateDisplayName(supabase, user.id, displayName);
  } catch (err) {
    if ((err as { code?: string })?.code === "23505") {
      return NextResponse.json({ error: "That nickname is already taken." }, { status: 409 });
    }
    throw err;
  }

  return NextResponse.json({ ok: true });
}
