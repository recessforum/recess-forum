import type { Metadata } from "next";
import { getPost } from "@/lib/db";
import { topicLabel } from "@/lib/taxonomy";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const post = await getPost(supabase, id).catch(() => undefined);
  if (!post) return { title: "Post not found" };

  const body = post.body?.replace(/\s+/g, " ").trim();
  const description = body
    ? body.length > 180 ? `${body.slice(0, 177)}...` : body
    : `A discussion in ${topicLabel(post.topicId)} on Recess Forum, a community for parents navigating their kids' education.`;
  const title = post.title;
  const url = `/post/${post.id}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: "article", siteName: "Recess Forum", title, description, url },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default function PostLayout({ children }: { children: React.ReactNode }) {
  return children;
}
