import { NextRequest, NextResponse } from "next/server";
import { getCircle, getPost, setCirclePin } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "log in" }, { status: 401 });

  const circle = await getCircle(supabase, id);
  if (!circle) return NextResponse.json({ error: "circle not found" }, { status: 404 });
  if (circle.createdBy !== user.id) {
    return NextResponse.json({ error: "only the person who created this circle can pin a post" }, { status: 403 });
  }

  const { postId } = (await req.json()) as { postId: string | null };
  if (postId) {
    const post = await getPost(supabase, postId);
    if (!post || post.circleId !== id || post.authorId !== user.id) {
      return NextResponse.json({ error: "you can only pin your own post from this circle" }, { status: 400 });
    }
  }

  await setCirclePin(supabase, id, postId || null);
  return NextResponse.json({ pinnedPostId: postId || null });
}
