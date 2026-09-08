import { NextResponse } from "next/server";
import { getAllComments, getPosts, getVoteDirs } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [posts, comments, voteDirs] = await Promise.all([
    getPosts(supabase),
    getAllComments(supabase),
    getVoteDirs(supabase, user?.id ?? null),
  ]);

  return NextResponse.json({ posts, comments, voteDirs });
}
