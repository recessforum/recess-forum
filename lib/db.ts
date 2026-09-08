import type { SupabaseClient } from "@supabase/supabase-js";
import type { Comment, ExpertApplication, Post, Promo, ProfileRole } from "./types";

/**
 * Real Supabase-backed persistence (handoff §10 item 2 — replaces the
 * earlier JSON-file dev store). Every function takes the request-scoped
 * Supabase client (from lib/supabase/server.ts) so RLS is enforced with the
 * caller's own session rather than a service role — inserts rely on
 * `auth.uid() = author_id` (and friends) in schema.sql's policies, not on
 * anything checked here.
 *
 * Author info is joined from `profiles` at read time and flattened onto
 * each Post/Comment (author, authorId, authorRole, authorExpertType) so the
 * UI doesn't need a separate name→role lookup the way the file store did.
 */

interface ProfileEmbed {
  display_name: string;
  role: ProfileRole;
  expert_type: string | null;
}

interface PostRow {
  id: string;
  author_id: string;
  title: string;
  body: string;
  topic_id: string;
  state: string | null;
  promo_label: string | null;
  promo_url: string | null;
  score: number;
  views: number;
  created_at: string;
  profiles: ProfileEmbed | ProfileEmbed[] | null;
}

interface CommentRow {
  id: string;
  post_id: string;
  parent_id: string | null;
  author_id: string;
  body: string;
  score: number;
  created_at: string;
  profiles: ProfileEmbed | ProfileEmbed[] | null;
}

// `profiles!<fkey>` disambiguates the embed — posts/comments each have a
// second, indirect path to profiles (through post_views / votes), so a bare
// `profiles(...)` embed is rejected by PostgREST as ambiguous (PGRST201).
const POST_SELECT =
  "id, author_id, title, body, topic_id, state, promo_label, promo_url, score, views, created_at, profiles!posts_author_id_fkey(display_name, role, expert_type)";
const COMMENT_SELECT =
  "id, post_id, parent_id, author_id, body, score, created_at, profiles!comments_author_id_fkey(display_name, role, expert_type)";

function embedProfile(p: PostRow["profiles"]): ProfileEmbed | null {
  return Array.isArray(p) ? p[0] ?? null : p;
}

function toPost(row: PostRow): Post {
  const profile = embedProfile(row.profiles);
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    author: profile?.display_name ?? "deleted",
    authorId: row.author_id,
    authorRole: profile?.role ?? "member",
    authorExpertType: profile?.expert_type ?? null,
    topicId: row.topic_id,
    state: row.state,
    promo: row.promo_label ? { label: row.promo_label, url: row.promo_url } : null,
    score: row.score,
    views: row.views,
    createdAt: new Date(row.created_at).getTime(),
  };
}

function toComment(row: CommentRow): Comment {
  const profile = embedProfile(row.profiles);
  return {
    id: row.id,
    postId: row.post_id,
    parentId: row.parent_id,
    author: profile?.display_name ?? "deleted",
    authorId: row.author_id,
    authorRole: profile?.role ?? "member",
    authorExpertType: profile?.expert_type ?? null,
    body: row.body,
    score: row.score,
    createdAt: new Date(row.created_at).getTime(),
  };
}

export async function getPosts(supabase: SupabaseClient): Promise<Post[]> {
  const { data, error } = await supabase.from("posts").select(POST_SELECT).order("created_at", { ascending: false });
  if (error) throw error;
  return ((data as unknown as PostRow[]) || []).map(toPost);
}

export async function getPost(supabase: SupabaseClient, id: string): Promise<Post | undefined> {
  const { data, error } = await supabase.from("posts").select(POST_SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? toPost(data as unknown as PostRow) : undefined;
}

export async function getAllComments(supabase: SupabaseClient): Promise<Record<string, Comment[]>> {
  const { data, error } = await supabase.from("comments").select(COMMENT_SELECT).order("created_at", { ascending: true });
  if (error) throw error;
  const map: Record<string, Comment[]> = {};
  ((data as unknown as CommentRow[]) || []).forEach((row) => {
    const c = toComment(row);
    (map[c.postId] ??= []).push(c);
  });
  return map;
}

export async function getComments(supabase: SupabaseClient, postId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from("comments")
    .select(COMMENT_SELECT)
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return ((data as unknown as CommentRow[]) || []).map(toComment);
}

export async function createPost(
  supabase: SupabaseClient,
  input: { title: string; body: string; topicId: string; state: string | null; promo: Promo | null },
  authorId: string
): Promise<Post> {
  const { data, error } = await supabase
    .from("posts")
    .insert({
      author_id: authorId,
      title: input.title,
      body: input.body,
      topic_id: input.topicId,
      state: input.state,
      promo_label: input.promo?.label ?? null,
      promo_url: input.promo?.url ?? null,
      score: 1,
      views: 0,
    })
    .select(POST_SELECT)
    .single();
  if (error) throw error;

  await supabase.from("votes").insert({ voter_id: authorId, target_type: "post", target_id: data.id, dir: 1 });
  return toPost(data as unknown as PostRow);
}

export async function addComment(
  supabase: SupabaseClient,
  postId: string,
  parentId: string | null,
  input: { body: string },
  authorId: string
): Promise<Comment> {
  const { data, error } = await supabase
    .from("comments")
    .insert({ post_id: postId, parent_id: parentId, author_id: authorId, body: input.body, score: 1 })
    .select(COMMENT_SELECT)
    .single();
  if (error) throw error;

  await supabase.from("votes").insert({ voter_id: authorId, target_type: "comment", target_id: data.id, dir: 1 });
  return toComment(data as unknown as CommentRow);
}

/**
 * Both RPCs derive the acting user from `auth.uid()` inside the function
 * rather than trusting a caller-supplied id — they're `security definer` and
 * exposed at /rest/v1/rpc/* under the public anon key, so a client-supplied
 * voter/viewer id would let anyone vote or record a view as anyone else.
 */
export async function vote(
  supabase: SupabaseClient,
  targetType: "post" | "comment",
  targetId: string,
  postId: string | undefined,
  dir: 1 | -1
): Promise<{ score: number; dir: number }> {
  const { data, error } = await supabase.rpc("cast_vote", {
    p_target_type: targetType,
    p_target_id: targetId,
    p_dir: dir,
    p_post_id: postId ?? null,
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return { score: row.score, dir: row.dir };
}

export async function getVoteDirs(
  supabase: SupabaseClient,
  voterId: string | null
): Promise<{ posts: Record<string, number>; comments: Record<string, number> }> {
  const posts: Record<string, number> = {};
  const comments: Record<string, number> = {};
  if (!voterId) return { posts, comments };

  const { data, error } = await supabase.from("votes").select("target_type, target_id, dir").eq("voter_id", voterId);
  if (error) throw error;
  (data || []).forEach((v) => {
    if (v.target_type === "post") posts[v.target_id] = v.dir;
    else comments[v.target_id] = v.dir;
  });
  return { posts, comments };
}

/** No-op (returns the current count) for logged-out visitors — the RPC checks auth.uid() itself. */
export async function registerView(supabase: SupabaseClient, postId: string): Promise<number> {
  const { data, error } = await supabase.rpc("increment_post_view", { p_post_id: postId });
  if (error) throw error;
  return data as number;
}

/**
 * Admin review flow (handoff §10 item 3). RLS backs this up independently
 * (admin_read_all_applications / admin_update_applications / on profiles,
 * see schema.sql) — this check just gives the API routes a clean 403
 * instead of relying on RLS to silently return zero rows.
 */
export async function isAdmin(supabase: SupabaseClient, userId: string): Promise<boolean> {
  const { data } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  return data?.role === "admin";
}

interface ExpertApplicationRow {
  id: string;
  applicant_id: string;
  expert_type: string;
  credential_info: string;
  file_path: string | null;
  status: ExpertApplication["status"];
  submitted_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  profiles: { display_name: string } | { display_name: string }[] | null;
}

export async function getExpertApplications(
  supabase: SupabaseClient
): Promise<(ExpertApplication & { applicantName: string })[]> {
  const { data, error } = await supabase
    .from("expert_applications")
    .select(
      "id, applicant_id, expert_type, credential_info, file_path, status, submitted_at, reviewed_by, reviewed_at, profiles!expert_applications_applicant_id_fkey(display_name)"
    )
    .order("submitted_at", { ascending: true });
  if (error) throw error;

  return ((data as unknown as ExpertApplicationRow[]) || []).map((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    return {
      id: row.id,
      applicantId: row.applicant_id,
      applicantName: profile?.display_name ?? "deleted",
      expertType: row.expert_type,
      credentialInfo: row.credential_info,
      filePath: row.file_path,
      status: row.status,
      submittedAt: new Date(row.submitted_at).getTime(),
      reviewedBy: row.reviewed_by,
      reviewedAt: row.reviewed_at ? new Date(row.reviewed_at).getTime() : null,
    };
  });
}

export async function reviewExpertApplication(
  supabase: SupabaseClient,
  applicationId: string,
  decision: "approved" | "rejected",
  reviewerId: string
): Promise<void> {
  const { data: application, error: fetchError } = await supabase
    .from("expert_applications")
    .select("applicant_id, expert_type")
    .eq("id", applicationId)
    .single();
  if (fetchError || !application) throw fetchError || new Error("application not found");

  const { error: updateAppError } = await supabase
    .from("expert_applications")
    .update({ status: decision, reviewed_by: reviewerId, reviewed_at: new Date().toISOString() })
    .eq("id", applicationId);
  if (updateAppError) throw updateAppError;

  if (decision === "approved") {
    const { error: updateProfileError } = await supabase
      .from("profiles")
      .update({ role: "verified_expert", expert_type: application.expert_type })
      .eq("id", application.applicant_id);
    if (updateProfileError) throw updateProfileError;
  }
}
