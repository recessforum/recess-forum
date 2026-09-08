import { NextResponse } from "next/server";
import { getComments, getPost, getVoteDirs } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import type { RolesByAuthor } from "@/lib/roles";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [post, comments, voteDirs] = await Promise.all([getPost(id), getComments(id), getVoteDirs(user?.id || "anon")]);
  if (!post) return NextResponse.json({ error: "not found" }, { status: 404 });

  const authors = new Set<string>([post.author, ...comments.map((c) => c.author)]);
  const rolesByAuthor: RolesByAuthor = {};
  const { data: profiles } = await supabase
    .from("profiles")
    .select("display_name, role, expert_type")
    .in("display_name", [...authors])
    .neq("role", "member");
  profiles?.forEach((p) => {
    rolesByAuthor[p.display_name] = { role: p.role as "verified_expert" | "admin", expertType: p.expert_type };
  });

  return NextResponse.json({ post, comments, voteDirs, rolesByAuthor });
}
