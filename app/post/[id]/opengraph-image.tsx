import { ImageResponse } from "next/og";
import { getPost } from "@/lib/db";
import { topicLabel } from "@/lib/taxonomy";
import { createClient } from "@/lib/supabase/server";

export const alt = "A post on Recess Forum";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const post = await getPost(supabase, id).catch(() => undefined);

  const title = post?.title ?? "Recess Forum";
  const shown = title.length > 130 ? `${title.slice(0, 127)}...` : title;
  const label = post ? (post.circleName ? `Circle · ${post.circleName}` : topicLabel(post.topicId)) : "for parents navigating school";

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#F7F6F3", padding: 72, color: "#1C1B19" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 64, height: 64, borderRadius: 14, background: "#26364A", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 22, height: 22, borderRadius: 11, background: "#B08D45" }} />
          </div>
          <div style={{ fontSize: 40, fontWeight: 700, color: "#26364A" }}>Recess Forum</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ display: "flex", fontSize: 28, color: "#7A5F1E", background: "#F5EEDC", padding: "8px 18px", alignSelf: "flex-start" }}>{label}</div>
          <div style={{ display: "flex", fontSize: shown.length > 80 ? 54 : 68, fontWeight: 700, lineHeight: 1.15 }}>{shown}</div>
        </div>
        <div style={{ display: "flex", fontSize: 28, color: "#5B584F" }}>Join parents sharing what works · recessforum.com</div>
      </div>
    ),
    { ...size }
  );
}
