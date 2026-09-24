import { ImageResponse } from "next/og";
import { NextRequest, NextResponse } from "next/server";
import { getComments, getPost, isAdmin } from "@/lib/db";
import { buildCardNewsContent } from "@/lib/cardNews";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "log in" }, { status: 401 });
  if (!(await isAdmin(supabase, user.id))) return NextResponse.json({ error: "admins only" }, { status: 403 });

  const postId = req.nextUrl.searchParams.get("postId");
  if (!postId) return NextResponse.json({ error: "postId required" }, { status: 400 });

  const post = await getPost(supabase, postId);
  if (!post) return NextResponse.json({ error: "not found" }, { status: 404 });
  const comments = await getComments(supabase, postId);
  const topReply = comments.filter((c) => !c.parentId).sort((a, b) => a.createdAt - b.createdAt)[0] || null;

  const c = buildCardNewsContent(post, topReply);

  return new ImageResponse(
    (
      <div style={{
        width: "100%", height: "100%", display: "flex", flexDirection: "column",
        background: "#F7F6F3", padding: "76px 72px", color: "#1C1B19", position: "relative",
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 14,
        }}>
          <div style={{ width: 44, height: 44, borderRadius: 11, background: "#26364A", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 16, height: 16, borderRadius: 8, background: "#B08D45" }} />
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#26364A" }}>Recess Forum</div>
        </div>

        <div style={{ display: "flex", marginTop: 64, padding: "10px 20px", background: c.topicBg, color: c.topicText, fontSize: 22, fontWeight: 700 }}>
          {c.topicLabel}
        </div>

        <div style={{ display: "flex", fontSize: 110, color: c.topicBg, fontWeight: 800, marginTop: 14, lineHeight: 1 }}>&ldquo;</div>

        <div style={{
          display: "flex", marginTop: -12,
          fontSize: c.headline.length > 110 ? 48 : 56,
          fontWeight: 700, lineHeight: 1.24, letterSpacing: -1,
        }}>
          {c.headline}
        </div>

        <div style={{ display: "flex", width: 64, height: 4, background: "#E6E3DA", margin: "40px 0 36px" }} />

        <div style={{ display: "flex", fontSize: 20, fontWeight: 700, color: "#217A78", letterSpacing: 2, marginBottom: 14 }}>
          {c.replyLabel}
        </div>
        <div style={{ display: "flex", fontSize: 27, lineHeight: 1.55, color: "#5B584F" }}>
          {c.hasReply ? `"${c.replyExcerpt}"` : c.replyExcerpt}
        </div>

        <div style={{ display: "flex", flex: 1 }} />

        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 40 }}>
          <div style={{ width: 40, height: 40, borderRadius: 20, background: "#1C1B19", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 700 }}>
            {c.avatarLetter}
          </div>
          <div style={{ display: "flex", fontSize: 20, color: "#9A968A" }}>{c.metaLine}</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 34, borderTop: "2px solid #E6E3DA" }}>
          <div style={{ display: "flex", fontSize: 24, fontWeight: 700, color: "#26364A" }}>{c.ctaLabel}</div>
          <div style={{ display: "flex", fontSize: 22, fontWeight: 500, color: "#B08D45" }}>recessforum.com</div>
        </div>
      </div>
    ),
    { width: 1080, height: 1350 }
  );
}
