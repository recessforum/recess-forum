import { NextRequest, NextResponse } from "next/server";
import { getCircle, isAdmin, setCircleAvatar } from "@/lib/db";
import { isOwnMediaUrl } from "@/lib/media";
import { createClient } from "@/lib/supabase/server";

/** Set or clear a circle's profile picture. Admins only (also enforced by a
 *  trigger on circles.avatar_url). */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "log in" }, { status: 401 });
  if (!(await isAdmin(supabase, user.id))) return NextResponse.json({ error: "admins only" }, { status: 403 });

  const circle = await getCircle(supabase, id);
  if (!circle) return NextResponse.json({ error: "circle not found" }, { status: 404 });

  const { avatarUrl } = (await req.json()) as { avatarUrl: string | null };
  if (avatarUrl && !isOwnMediaUrl(avatarUrl, user.id, "image")) {
    return NextResponse.json({ error: "invalid image" }, { status: 400 });
  }

  await setCircleAvatar(supabase, id, avatarUrl || null);
  return NextResponse.json({ avatarUrl: avatarUrl || null });
}
