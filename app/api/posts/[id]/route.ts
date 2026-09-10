import { NextRequest, NextResponse } from "next/server";
import { deletePost, getComments, getPost, getVoteDirs, updatePost } from "@/lib/db";
import { containsViolentContent } from "@/lib/moderation";
import { createClient } from "@/lib/supabase/server";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [post, comments, voteDirs] = await Promise.all([
    getPost(supabase, id),
    getComments(supabase, id),
    getVoteDirs(supabase, user?.id ?? null),
  ]);
  if (!post) return NextResponse.json({ error: "not found" }, { status: 404 });

  return NextResponse.json({ post, comments, voteDirs });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "log in" }, { status: 401 });

  const post = await getPost(supabase, id);
  if (!post) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (post.authorId !== user.id) return NextResponse.json({ error: "you can only edit your own posts" }, { status: 403 });

  const data = (await req.json()) as { title: string; body: string | null };
  if (!data.title?.trim()) return NextResponse.json({ error: "title is required" }, { status: 400 });

  const body = data.body?.trim() || null;
  if (await containsViolentContent(`${data.title}\n\n${body ?? ""}`)) {
    return NextResponse.json(
      { error: "This post appears to contain violent content and can't be published. If you're describing a safety concern (e.g. bullying), try rephrasing without graphic or threatening language." },
      { status: 422 }
    );
  }

  const updated = await updatePost(supabase, id, { title: data.title.trim(), body });
  return NextResponse.json({ post: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "log in" }, { status: 401 });

  const post = await getPost(supabase, id);
  if (!post) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (post.authorId !== user.id) return NextResponse.json({ error: "you can only delete your own posts" }, { status: 403 });

  await deletePost(supabase, id);
  return NextResponse.json({ ok: true });
}
