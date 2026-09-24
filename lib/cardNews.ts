import type { SupabaseClient } from "@supabase/supabase-js";
import { getAllComments, getPosts } from "./db";
import { colorForTopic, topicLabel } from "./taxonomy";
import type { Comment, Post } from "./types";

/**
 * Server-side picker + content builder for the admin "today's card news"
 * button (see app/admin/page.tsx and app/api/admin/card-news/*). Mirrors
 * `.claude/skills/recess-forum-card-news/SKILL.md`, which does the same
 * job by hand from the live site when run as a Claude Code skill — this is
 * the same idea wired into the app itself so it doesn't need a Claude
 * session to run every day.
 *
 * Every field here is sourced from real rows — never invent a reply count,
 * score, or quote. A post with no replies gets the "nobody's answered yet"
 * framing instead of a fabricated one.
 */

export interface CardNewsContent {
  postId: string;
  topicLabel: string;
  topicText: string;
  topicBg: string;
  headline: string;
  hasReply: boolean;
  replyLabel: string;
  replyExcerpt: string;
  avatarLetter: string;
  metaLine: string; // plain text, e.g. "Posted by Charlotte023 · 1 reply · 7 upvotes"
  ctaLabel: string;
  caption: string;
}

// Instagram (and followers) notice a formula repeated verbatim — same hook,
// same sentence shape, same hashtag block every day reads as spammy/bot-made
// and can genuinely hurt reach. Everything below picks from several options
// per slot instead of one fixed string, seeded by the post id so the choice
// stays put if you regenerate the same post but differs across posts.

const HOOKS = [
  "Every parent has been there.",
  "Parenting doesn't come with a manual — this is why the community exists.",
  "Real talk from parents who've been there.",
  "Not a hypothetical. A real question from a real parent.",
  "Someone in the community asked this, so we're asking you too.",
  "This one hit close to home for a lot of parents.",
];

const QUESTION_LEAD_INS = [
  "A real question from a real parent on Recess Forum:",
  "A parent on Recess Forum asked:",
  "Straight from the forum, no paraphrasing:",
  "This came up on Recess Forum this week:",
];

const REPLY_LEAD_INS = [
  "Another parent's reply:",
  "Here's what one parent in the community said:",
  "The top reply, from a parent who's been through it:",
  "One parent's take:",
];

const CTAS = [
  "Got advice of your own? Join the conversation — link in bio.",
  "Been there? Add your take — link in bio.",
  "More where that came from — link in bio.",
  "Join parents figuring this out together — link in bio.",
];

const GENERIC_HASHTAG_SETS = [
  ["#parenting", "#parentingtips", "#parentcommunity"],
  ["#parentsofinstagram", "#momsupport", "#dadsupport"],
  ["#parentlife", "#raisingkids", "#parentcommunity"],
];

const TOPIC_HASHTAGS: Record<string, string[]> = {
  bullying: ["#bullying", "#schoolbullying"],
  "mental-health": ["#parentingsupport", "#mentalhealthawareness"],
  "special-ed": ["#specialeducation", "#IEP"],
  "regional-center": ["#specialeducation", "#autismparent"],
  "learning-differences": ["#ADHD", "#learningdifferences"],
  gifted: ["#giftededucation"],
  homeschool: ["#homeschooling", "#homeschoolmom"],
  "college-applications": ["#collegeprep", "#collegeadmissions"],
  "test-prep": ["#SATprep", "#ACTprep"],
  "reading-literacy": ["#literacy", "#readingtips"],
  "math-help": ["#mathhelp"],
  "screen-time": ["#screentime", "#parentingtech"],
};

function truncate(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}

function hashFor(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

/** Deterministic-per-post pick from a list, using a different part of the
 *  post id's hash for each slot so hook/lead-in/CTA/hashtags don't all
 *  advance in lockstep. */
function pick<T>(list: T[], id: string, salt: string): T {
  return list[hashFor(id + salt) % list.length];
}

/** Picks the best real candidate post: highest score among posts (not circle
 *  posts — those don't have a topic badge) with at least one top-level
 *  reply, excluding any ids the caller has already shown this session. Falls
 *  back to the highest-score post overall (reply or not) if every replied-to
 *  post has already been excluded. */
export async function pickCardNewsPost(
  supabase: SupabaseClient,
  excludeIds: string[] = []
): Promise<{ post: Post; topReply: Comment | null } | null> {
  const [posts, commentsByPost] = await Promise.all([getPosts(supabase), getAllComments(supabase)]);

  const eligible = posts.filter((p) => !p.circleId && !excludeIds.includes(p.id));
  if (eligible.length === 0) return null;

  const withReply = eligible
    .map((post) => ({ post, replies: (commentsByPost[post.id] || []).filter((c) => !c.parentId) }))
    .filter((x) => x.replies.length > 0)
    .sort((a, b) => b.post.score - a.post.score);

  if (withReply.length > 0) {
    const top = withReply[0];
    const topReply = [...top.replies].sort((a, b) => a.createdAt - b.createdAt)[0];
    return { post: top.post, topReply };
  }

  // Nothing with a reply left — fall back to the best post overall.
  const post = [...eligible].sort((a, b) => b.score - a.score)[0];
  return post ? { post, topReply: null } : null;
}

export function buildCardNewsContent(post: Post, topReply: Comment | null): CardNewsContent {
  const colors = colorForTopic(post.topicId);
  const label = topicLabel(post.topicId);
  const hook = pick(HOOKS, post.id, "hook");
  const questionLeadIn = pick(QUESTION_LEAD_INS, post.id, "q");
  const cta = pick(CTAS, post.id, "cta");
  const genericTags = pick(GENERIC_HASHTAG_SETS, post.id, "tags");
  const topicTags = TOPIC_HASHTAGS[post.topicId] || [];
  const hashtagLine = [...genericTags, ...topicTags, "#recessforum"].join(" ");

  if (topReply) {
    const replyLeadIn = pick(REPLY_LEAD_INS, post.id, "reply");
    return {
      postId: post.id,
      topicLabel: label,
      topicText: colors.text,
      topicBg: colors.bg,
      headline: truncate(post.title, 170),
      hasReply: true,
      replyLabel: "A PARENT REPLIED",
      replyExcerpt: truncate(topReply.body, 260),
      avatarLetter: post.author.charAt(0).toUpperCase(),
      metaLine: `Posted by ${post.author} · 1 reply · ${post.score} upvote${post.score === 1 ? "" : "s"}`,
      ctaLabel: "Read the full reply →",
      caption: [
        hook,
        "",
        `${questionLeadIn} ${truncate(post.title, 220)}`,
        "",
        `${replyLeadIn} "${truncate(topReply.body, 300)}"`,
        "",
        cta,
        "",
        hashtagLine,
      ].join("\n"),
    };
  }

  return {
    postId: post.id,
    topicLabel: label,
    topicText: colors.text,
    topicBg: colors.bg,
    headline: truncate(post.title, 170),
    hasReply: false,
    replyLabel: "NO ONE'S ANSWERED YET",
    replyExcerpt: "Be the parent who replies.",
    avatarLetter: post.author.charAt(0).toUpperCase(),
    metaLine: `Posted by ${post.author} · ${post.score} upvote${post.score === 1 ? "" : "s"}`,
    ctaLabel: "Answer this →",
    caption: [
      "No one's answered this yet. 🤔",
      "",
      `${questionLeadIn} ${truncate(post.title, 220)}`,
      "",
      `Could you be the one who helps? ${cta}`,
      "",
      hashtagLine,
    ].join("\n"),
  };
}
