import { NextResponse } from "next/server";
import { getAllComments, getPosts, getVoteDirs } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import type { RolesByAuthor } from "@/lib/roles";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [posts, comments, voteDirs] = await Promise.all([
    getPosts(),
    getAllComments(),
    getVoteDirs(user?.id || "anon"),
  ]);

  const authors = new Set<string>();
  posts.forEach((p) => authors.add(p.author));
  Object.values(comments).flat().forEach((c) => authors.add(c.author));

  const rolesByAuthor: RolesByAuthor = {};
  if (authors.size > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("display_name, role, expert_type")
      .in("display_name", [...authors])
      .neq("role", "member");
    profiles?.forEach((p) => {
      rolesByAuthor[p.display_name] = { role: p.role as "verified_expert" | "admin", expertType: p.expert_type };
    });
  }

  return NextResponse.json({ posts, comments, voteDirs, rolesByAuthor });
}
