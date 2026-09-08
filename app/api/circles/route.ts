import { NextRequest, NextResponse } from "next/server";
import { createCircle, getCircles } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const circles = await getCircles(supabase);
  return NextResponse.json({ circles });
}

interface NewCircleBody {
  name: string;
  description: string;
  state: string | null;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "log in to create a circle" }, { status: 401 });

  const data = (await req.json()) as NewCircleBody;
  if (!data.name?.trim() || !data.description?.trim()) {
    return NextResponse.json({ error: "name and description are required" }, { status: 400 });
  }

  try {
    const circle = await createCircle(
      supabase,
      { name: data.name.trim(), description: data.description.trim(), state: data.state || null },
      user.id
    );
    // Creating a circle doesn't auto-join it at the DB level (created_by is
    // just attribution) — join the creator so they can post into it right away.
    await supabase.from("circle_memberships").insert({ circle_id: circle.id, user_id: user.id });
    return NextResponse.json({ circle });
  } catch (error) {
    const message = error instanceof Error ? error.message : "couldn't create circle";
    const status = message.includes("duplicate") ? 409 : 500;
    return NextResponse.json({ error: status === 409 ? "a circle with that name already exists" : message }, { status });
  }
}
