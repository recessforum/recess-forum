import { NextRequest, NextResponse } from "next/server";
import { addComment } from "@/lib/db";
import { containsViolentContent } from "@/lib/moderation";
import { notifyOnComment } from "@/lib/notifications";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "log in to comment" }, { status: 401 });

  const data = (await req.json()) as { parentId: string | null; body: string };
  if (!data.body?.trim()) return NextResponse.json({ error: "body is required" }, { status: 400 });

  if (await containsViolentContent(data.body)) {
    return NextResponse.json(
      { error: "This reply appears to contain violent content and can't be posted. If you're describing a safety concern (e.g. bullying), try rephrasing without graphic or threatening language." },
      { status: 422 }
    );
  }

  const parentId = data.parentId || null;
  const comment = await addComment(supabase, id, parentId, { body: data.body.trim() }, user.id);

  await notifyOnComment(supabase, {
    postId: id,
    parentId,
    commentAuthorId: user.id,
    commentAuthorName: comment.author,
  });

  return NextResponse.json({ comment });
}
