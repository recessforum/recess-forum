import { after, NextRequest, NextResponse } from "next/server";
import { notifyExpertRequest } from "@/lib/notifications";
import { createClient } from "@/lib/supabase/server";

/** Most experts a member can ask per day, and per post. */
const DAILY_REQUESTS = 5;
const PER_POST = 3;

/** Experts already asked on this post (public, like the post). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("expert_requests")
    .select("expert_id, profiles!expert_requests_expert_id_fkey(display_name)").eq("post_id", id).order("created_at");
  return NextResponse.json({
    asked: (data ?? []).map((r) => {
      const p = r.profiles as { display_name: string } | { display_name: string }[] | null;
      return { expertId: r.expert_id, name: (Array.isArray(p) ? p[0]?.display_name : p?.display_name) ?? "Expert" };
    }),
  });
}

/** The post's author asks one Verified Expert to answer; the expert gets an email. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "log in" }, { status: 401 });

  const { expertId } = await req.json().catch(() => ({}));
  if (typeof expertId !== "string") return NextResponse.json({ error: "Pick an expert." }, { status: 400 });

  const { data: post } = await supabase.from("posts").select("author_id").eq("id", id).maybeSingle();
  if (!post) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (post.author_id !== user.id) return NextResponse.json({ error: "Only the person who asked the question can ask an expert." }, { status: 403 });

  const dayAgo = new Date(Date.now() - 864e5).toISOString();
  const [{ count: today }, { count: onPost }] = await Promise.all([
    supabase.from("expert_requests").select("id", { count: "exact", head: true }).eq("requester_id", user.id).gte("created_at", dayAgo),
    supabase.from("expert_requests").select("id", { count: "exact", head: true }).eq("post_id", id),
  ]);
  if ((onPost ?? 0) >= PER_POST) return NextResponse.json({ error: `You can ask up to ${PER_POST} experts per question.` }, { status: 429 });
  if ((today ?? 0) >= DAILY_REQUESTS) return NextResponse.json({ error: "You've asked a lot of experts today. Please try again tomorrow." }, { status: 429 });

  // RLS checks that this is your post and the person is a current Verified Expert.
  const { error } = await supabase.from("expert_requests").insert({ post_id: id, expert_id: expertId, requester_id: user.id });
  if (error?.code === "23505") return NextResponse.json({ error: "You already asked this expert." }, { status: 409 });
  if (error) return NextResponse.json({ error: "Couldn't send your request. Please try again." }, { status: 400 });

  const { data: me } = await supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle();
  after(() => notifyExpertRequest({ expertId, postId: id, requesterName: me?.display_name ?? "A parent" }));
  return NextResponse.json({ ok: true });
}
