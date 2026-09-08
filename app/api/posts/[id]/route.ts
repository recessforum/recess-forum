import { NextResponse } from "next/server";
import { getComments, getPost, getVoteDirs } from "@/lib/db";
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
