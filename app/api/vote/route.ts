import { NextRequest, NextResponse } from "next/server";
import { vote } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

interface VoteBody {
  targetType: "post" | "comment";
  targetId: string;
  postId?: string;
  dir: 1 | -1;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "log in to vote" }, { status: 401 });

  const data = (await req.json()) as VoteBody;
  if (data.targetType !== "post" && data.targetType !== "comment") {
    return NextResponse.json({ error: "invalid targetType" }, { status: 400 });
  }
  if (data.dir !== 1 && data.dir !== -1) {
    return NextResponse.json({ error: "invalid dir" }, { status: 400 });
  }

  const result = await vote(supabase, data.targetType, data.targetId, data.postId, data.dir);
  return NextResponse.json(result);
}
