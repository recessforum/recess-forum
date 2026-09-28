import { NextRequest, NextResponse } from "next/server";
import { createPost, isAdmin } from "@/lib/db";
import { EVENT_SELECT, toEvent } from "@/lib/events";
import { isValidState } from "@/lib/location";
import { createClient } from "@/lib/supabase/server";
import { topicById } from "@/lib/taxonomy";

/** Upcoming, live, and last-30-days Office Hours, soonest first. */
export async function GET() {
  const supabase = await createClient();
  const since = new Date(Date.now() - 30 * 864e5).toISOString();
  const { data, error } = await supabase.from("events").select(EVENT_SELECT).gte("ends_at", since).order("starts_at", { ascending: true });
  if (error) return NextResponse.json({ events: [] });
  return NextResponse.json({ events: (data ?? []).map((r) => toEvent(r as never)) });
}

/** Admin only: creates the Q&A thread and the event window together. */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await isAdmin(supabase, user.id))) return NextResponse.json({ error: "admins only" }, { status: 403 });

  const b = await req.json().catch(() => ({}));
  const title = typeof b.title === "string" ? b.title.trim() : "";
  const description = typeof b.description === "string" ? b.description.trim() : "";
  const startsAt = new Date(b.startsAt), endsAt = new Date(b.endsAt);
  if (title.length < 3 || !topicById(b.topicId) || !isValidState(b.state) || isNaN(+startsAt) || !(endsAt > startsAt)) {
    return NextResponse.json({ error: "Title, topic, state, and a valid start and end time are required." }, { status: 400 });
  }

  let hostName = "";
  if (b.hostId) {
    const { data: host } = await supabase.from("profiles").select("display_name, role").eq("id", b.hostId).maybeSingle();
    if (host?.role !== "verified_expert") return NextResponse.json({ error: "The host must be a Verified Expert." }, { status: 400 });
    hostName = host.display_name;
  }

  const when = startsAt.toLocaleString("en-US", { weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/New_York", timeZoneName: "short" });
  const body = [
    description,
    `Office Hours: ${when}${hostName ? ` with Verified Expert ${hostName}` : ""}.`,
    "Post your question as a reply below, even before it starts. Questions are answered during the session.",
  ].filter(Boolean).join("\n\n");

  const post = await createPost(supabase, {
    title: `Office Hours: ${title}`, body, topicId: b.topicId, state: b.state, country: "US",
    promo: null, circleId: null, imageUrl: null, videoUrl: null,
  }, user.id);

  const { data, error } = await supabase.from("events").insert({
    post_id: post.id, host_id: b.hostId || null, title, description: description || null,
    starts_at: startsAt.toISOString(), ends_at: endsAt.toISOString(),
  }).select(EVENT_SELECT).single();
  if (error) return NextResponse.json({ error: "Couldn't create the event." }, { status: 500 });
  return NextResponse.json({ event: toEvent(data as never) });
}
