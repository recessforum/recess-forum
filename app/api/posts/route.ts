import { NextRequest, NextResponse } from "next/server";
import { createPost, isCircleMember } from "@/lib/db";
import { containsViolentContent } from "@/lib/moderation";
import { isValidCountry, isValidState } from "@/lib/location";
import { isOwnMediaUrl } from "@/lib/media";
import { createClient } from "@/lib/supabase/server";
import type { Promo } from "@/lib/types";

interface NewPostBody {
  title: string;
  body: string | null;
  topicId: string;
  /** US state code; null/absent for posts outside the US. */
  state: string | null;
  /** ISO country code; defaults to "US". */
  country?: string;
  promo: Promo | null;
  circleId?: string | null;
  imageUrl?: string | null;
  videoUrl?: string | null;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "log in to post" }, { status: 401 });

  const data = (await req.json()) as NewPostBody;
  const country = data.country || "US";
  const state = country === "US" ? data.state : null;
  if (!data.title?.trim() || !isValidCountry(country) || (country === "US" && !(state && isValidState(state)))) {
    return NextResponse.json({ error: "a title and a location (US state or country) are required" }, { status: 400 });
  }

  const circleId = data.circleId || null;
  if (circleId && !(await isCircleMember(supabase, circleId, user.id))) {
    return NextResponse.json({ error: "join the circle before posting in it" }, { status: 403 });
  }

  // Media must be the caller's own upload, not an arbitrary URL.
  const videoUrl = data.videoUrl || null;
  const imageUrl = data.imageUrl || null;
  if ((videoUrl && !isOwnMediaUrl(videoUrl, user.id, "video")) || (imageUrl && !isOwnMediaUrl(imageUrl, user.id, "image"))) {
    return NextResponse.json({ error: "invalid photo or video" }, { status: 400 });
  }

  const body = data.body?.trim() || null;
  if (await containsViolentContent(`${data.title}\n\n${body ?? ""}`)) {
    return NextResponse.json(
      { error: "This post appears to contain violent content and can't be published. If you're describing a safety concern (e.g. bullying), try rephrasing without graphic or threatening language." },
      { status: 422 }
    );
  }

  const post = await createPost(
    supabase,
    {
      title: data.title.trim(),
      body,
      topicId: data.topicId,
      state,
      country,
      promo: data.promo || null,
      circleId,
      imageUrl,
      videoUrl,
    },
    user.id
  );

  return NextResponse.json({ post });
}
