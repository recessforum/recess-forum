import { NextRequest, NextResponse } from "next/server";
import { createPost } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import type { Promo } from "@/lib/types";

interface NewPostBody {
  title: string;
  body: string;
  topicId: string;
  state: string;
  promo: Promo | null;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "log in to post" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", user.id).single();
  if (!profile) return NextResponse.json({ error: "profile not found" }, { status: 500 });

  const data = (await req.json()) as NewPostBody;
  if (!data.title?.trim() || !data.body?.trim() || !data.state) {
    return NextResponse.json({ error: "title, body, and state are required" }, { status: 400 });
  }

  const post = await createPost(
    {
      title: data.title.trim(),
      body: data.body.trim(),
      author: profile.display_name,
      topicId: data.topicId,
      state: data.state,
      promo: data.promo || null,
    },
    user.id
  );

  return NextResponse.json({ post });
}
