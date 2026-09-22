import type { Metadata } from "next";
import { getComments, getPost } from "@/lib/db";
import { topicLabel } from "@/lib/taxonomy";
import { createClient } from "@/lib/supabase/server";

const SITE_URL = "https://www.recessforum.com";

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

// Discussion forum structured data (schema.org DiscussionForumPosting) — the
// same markup Reddit/Quora-style sites use to get Google's "Discussions and
// forums" rich result treatment: https://developers.google.com/search/docs/appearance/structured-data/discussion-forum
// Capped to the 20 oldest top-level comments to keep the payload small; the
// live comment count is included via commentCount regardless.
async function buildJsonLd(id: string) {
  const supabase = await createClient();
  const [post, comments] = await Promise.all([
    getPost(supabase, id).catch(() => undefined),
    getComments(supabase, id).catch(() => []),
  ]);
  if (!post) return null;

  const url = `${SITE_URL}/post/${post.id}`;
  const topLevel = comments.filter((c) => !c.parentId).slice(0, 20);

  return {
    "@context": "https://schema.org",
    "@type": "DiscussionForumPosting",
    "@id": url,
    url,
    headline: post.title,
    text: post.body || post.title,
    datePublished: new Date(post.createdAt).toISOString(),
    author: { "@type": "Person", name: post.author, url: `${SITE_URL}/u/${post.authorId}` },
    commentCount: comments.length,
    interactionStatistic: {
      "@type": "InteractionCounter",
      interactionType: "https://schema.org/LikeAction",
      userInteractionCount: Math.max(post.score, 0),
    },
    comment: topLevel.map((c) => ({
      "@type": "Comment",
      text: c.body,
      datePublished: new Date(c.createdAt).toISOString(),
      author: { "@type": "Person", name: c.author, url: `${SITE_URL}/u/${c.authorId}` },
      interactionStatistic: {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/LikeAction",
        userInteractionCount: Math.max(c.score, 0),
      },
    })),
  };
}

export default async function PostLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  const jsonLd = await buildJsonLd(id);

  return (
    <>
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}
      {children}
    </>
  );
}
