import { NextRequest, NextResponse } from "next/server";
import { createPost, isCircleMember } from "@/lib/db";
import { containsViolentContent } from "@/lib/moderation";
import { createClient } from "@/lib/supabase/server";
import type { Promo } from "@/lib/types";

interface NewPostBody {
  title: string;
  body: string;
  topicId: string;
  state: string;
  promo: Promo | null;
  circleId?: string | null;
  imageUrl?: string | null;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "log in to post" }, { status: 401 });

  const data = (await req.json()) as NewPostBody;
  if (!data.title?.trim() || !data.body?.trim() || !data.state) {
    return NextResponse.json({ error: "title, body, and state are required" }, { status: 400 });
  }

  const circleId = data.circleId || null;
  if (circleId && !(await isCircleMember(supabase, circleId, user.id))) {
    return NextResponse.json({ error: "join the circle before posting in it" }, { status: 403 });
  }

  if (await containsViolentContent(`${data.title}\n\n${data.body}`)) {
    return NextResponse.json(
      { error: "This post appears to contain violent content and can't be published. If you're describing a safety concern (e.g. bullying), try rephrasing without graphic or threatening language." },
      { status: 422 }
    );
  }

  const post = await createPost(
    supabase,
    {
      title: data.title.trim(),
      body: data.body.trim(),
      topicId: data.topicId,
      state: data.state,
      promo: data.promo || null,
      circleId,
      imageUrl: data.imageUrl || null,
    },
    user.id
  );

  return NextResponse.json({ post });
}
