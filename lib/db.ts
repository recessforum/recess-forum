import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdminBlockRecord, AdminMember, AdminStats, BlockedUser, Circle, Comment, ExpertApplication, Post, Promo, ProfileRole, PublicProfile, Report, ReportTargetType } from "./types";

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
  avatar_url: string | null;
}

interface CircleEmbed {
  name: string;
}

interface PostRow {
  id: string;
  author_id: string;
  title: string;
  body: string | null;
  topic_id: string;
  state: string | null;
  country: string;
  promo_label: string | null;
  promo_url: string | null;
  image_url: string | null;
  video_url: string | null;
  score: number;
  views: number;
  created_at: string;
  circle_id: string | null;
  circles: CircleEmbed | CircleEmbed[] | null;
  profiles: ProfileEmbed | ProfileEmbed[] | null;
}

interface CommentRow {
  id: string;
  post_id: string;
  parent_id: string | null;
  author_id: string;
  body: string;
  image_url: string | null;
  video_url: string | null;
  score: number;
  created_at: string;
  profiles: ProfileEmbed | ProfileEmbed[] | null;
}

// `profiles!<fkey>` disambiguates the embed — posts/comments each have a
// second, indirect path to profiles (through post_views / votes), so a bare
// `profiles(...)` embed is rejected by PostgREST as ambiguous (PGRST201).
const POST_SELECT =
  "id, author_id, title, body, topic_id, state, country, promo_label, promo_url, image_url, video_url, score, views, created_at, circle_id, circles!posts_circle_id_fkey(name), profiles!posts_author_id_fkey(display_name, role, expert_type, avatar_url)";
const COMMENT_SELECT =
  "id, post_id, parent_id, author_id, body, image_url, video_url, score, created_at, profiles!comments_author_id_fkey(display_name, role, expert_type, avatar_url)";

function embedProfile(p: PostRow["profiles"]): ProfileEmbed | null {
  return Array.isArray(p) ? p[0] ?? null : p;
}

function toPost(row: PostRow): Post {
  const profile = embedProfile(row.profiles);
  const circle = Array.isArray(row.circles) ? row.circles[0] ?? null : row.circles;
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    author: profile?.display_name ?? "deleted",
    authorId: row.author_id,
    authorRole: profile?.role ?? "member",
    authorExpertType: profile?.expert_type ?? null,
    authorAvatarUrl: profile?.avatar_url ?? null,
    topicId: row.topic_id,
    state: row.state,
    country: row.country ?? "US",
    promo: row.promo_label ? { label: row.promo_label, url: row.promo_url } : null,
    imageUrl: row.image_url,
    videoUrl: row.video_url,
    score: row.score,
    views: row.views,
    createdAt: new Date(row.created_at).getTime(),
    circleId: row.circle_id,
    circleName: circle?.name ?? null,
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
    authorAvatarUrl: profile?.avatar_url ?? null,
    body: row.body,
    imageUrl: row.image_url,
    videoUrl: row.video_url,
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
  input: { title: string; body: string | null; topicId: string; state: string | null; country: string; promo: Promo | null; circleId: string | null; imageUrl: string | null; videoUrl: string | null },
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
      country: input.country,
      promo_label: input.promo?.label ?? null,
      promo_url: input.promo?.url ?? null,
      image_url: input.imageUrl,
      video_url: input.videoUrl,
      circle_id: input.circleId,
      score: 1,
      views: 0,
    })
    .select(POST_SELECT)
    .single();
  if (error) throw error;

  await supabase.from("votes").insert({ voter_id: authorId, target_type: "post", target_id: data.id, dir: 1 });
  return toPost(data as unknown as PostRow);
}

export async function updatePost(
  supabase: SupabaseClient,
  id: string,
  input: { title: string; body: string | null; topicId: string }
): Promise<Post> {
  const { data, error } = await supabase
    .from("posts")
    .update({ title: input.title, body: input.body, topic_id: input.topicId })
    .eq("id", id)
    .select(POST_SELECT)
    .single();
  if (error) throw error;
  return toPost(data as unknown as PostRow);
}

export async function deletePost(supabase: SupabaseClient, id: string): Promise<void> {
  const { error, count } = await supabase.from("posts").delete({ count: "exact" }).eq("id", id);
  if (error) throw error;
  if (!count) throw new Error("post not found or not authorized");
}

export async function addComment(
  supabase: SupabaseClient,
  postId: string,
  parentId: string | null,
  input: { body: string; imageUrl: string | null; videoUrl: string | null },
  authorId: string
): Promise<Comment> {
  const { data, error } = await supabase
    .from("comments")
    .insert({ post_id: postId, parent_id: parentId, author_id: authorId, body: input.body, image_url: input.imageUrl, video_url: input.videoUrl, score: 1 })
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

/**
 * User-created groups (handoff-adjacent feature, not in the original spec).
 * Circle posts stay fully public — a circle is a membership/belonging layer
 * on top of the existing public forum, not a separate visibility model.
 */
interface CircleRow {
  id: string;
  name: string;
  description: string;
  state: string | null;
  country: string | null;
  image_url: string | null;
  video_url: string | null;
  created_by: string;
  created_at: string;
  pinned_post_id: string | null;
  circle_memberships: { count: number }[] | null;
}

const CIRCLE_SELECT = "id, name, description, state, country, image_url, video_url, created_by, created_at, pinned_post_id, circle_memberships(count)";

function toCircle(row: CircleRow): Circle {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    state: row.state,
    country: row.country,
    imageUrl: row.image_url,
    videoUrl: row.video_url,
    createdBy: row.created_by,
    pinnedPostId: row.pinned_post_id,
    memberCount: row.circle_memberships?.[0]?.count ?? 0,
    createdAt: new Date(row.created_at).getTime(),
  };
}

export async function getCircles(supabase: SupabaseClient): Promise<Circle[]> {
  const { data, error } = await supabase.from("circles").select(CIRCLE_SELECT).order("created_at", { ascending: false });
  if (error) throw error;
  return ((data as unknown as CircleRow[]) || []).map(toCircle);
}

export async function getCircle(supabase: SupabaseClient, id: string): Promise<Circle | undefined> {
  const { data, error } = await supabase.from("circles").select(CIRCLE_SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? toCircle(data as unknown as CircleRow) : undefined;
}

export async function createCircle(
  supabase: SupabaseClient,
  input: { name: string; description: string; state: string | null; country: string | null; imageUrl: string | null; videoUrl: string | null },
  createdBy: string
): Promise<Circle> {
  const { data, error } = await supabase
    .from("circles")
    .insert({
      name: input.name, description: input.description, state: input.state, country: input.country,
      image_url: input.imageUrl, video_url: input.videoUrl, created_by: createdBy,
    })
    .select(CIRCLE_SELECT)
    .single();
  if (error) throw error;
  return toCircle(data as unknown as CircleRow);
}

export async function setCirclePin(supabase: SupabaseClient, circleId: string, postId: string | null): Promise<void> {
  const { data, error } = await supabase.from("circles").update({ pinned_post_id: postId }).eq("id", circleId).select("id");
  if (error) throw error;
  if (!data?.length) throw new Error("circle not found or not authorized");
}

export async function isCircleMember(supabase: SupabaseClient, circleId: string, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("circle_memberships")
    .select("circle_id")
    .eq("circle_id", circleId)
    .eq("user_id", userId)
    .maybeSingle();
  return !!data;
}

export async function getMyCircleIds(supabase: SupabaseClient, userId: string): Promise<string[]> {
  const { data, error } = await supabase.from("circle_memberships").select("circle_id").eq("user_id", userId);
  if (error) throw error;
  return (data || []).map((r) => r.circle_id);
}

export async function joinCircle(supabase: SupabaseClient, circleId: string, userId: string): Promise<void> {
  const { error } = await supabase.from("circle_memberships").upsert({ circle_id: circleId, user_id: userId });
  if (error) throw error;
}

export async function leaveCircle(supabase: SupabaseClient, circleId: string, userId: string): Promise<void> {
  const { error } = await supabase.from("circle_memberships").delete().eq("circle_id", circleId).eq("user_id", userId);
  if (error) throw error;
}

export async function updateAvatar(supabase: SupabaseClient, userId: string, avatarUrl: string | null): Promise<void> {
  const { error } = await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("id", userId);
  if (error) throw error;
}

export async function updateDisplayName(supabase: SupabaseClient, userId: string, displayName: string): Promise<void> {
  const { error } = await supabase.from("profiles").update({ display_name: displayName, nickname_set: true }).eq("id", userId);
  if (error) throw error;
}

export async function getProfile(supabase: SupabaseClient, id: string): Promise<PublicProfile | undefined> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, role, expert_type, account_type, founding_number, created_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return undefined;
  return {
    id: data.id,
    displayName: data.display_name,
    avatarUrl: data.avatar_url,
    role: data.role,
    expertType: data.expert_type,
    accountType: data.account_type,
    foundingNumber: data.founding_number,
    createdAt: new Date(data.created_at).getTime(),
  };
}

export async function createReport(
  supabase: SupabaseClient,
  input: { targetType: ReportTargetType; targetId: string; reason: string },
  reporterId: string
): Promise<void> {
  const { error } = await supabase.from("reports").insert({
    reporter_id: reporterId,
    target_type: input.targetType,
    target_id: input.targetId,
    reason: input.reason,
  });
  if (error) throw error;
}

interface ReportRow {
  id: string;
  reporter_id: string;
  target_type: ReportTargetType;
  target_id: string;
  reason: string;
  status: Report["status"];
  created_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  profiles: { display_name: string } | { display_name: string }[] | null;
}

export async function getReports(supabase: SupabaseClient): Promise<Report[]> {
  const { data, error } = await supabase
    .from("reports")
    .select(
      "id, reporter_id, target_type, target_id, reason, status, created_at, reviewed_by, reviewed_at, profiles!reports_reporter_id_fkey(display_name)"
    )
    .order("created_at", { ascending: false });
  if (error) throw error;

  return ((data as unknown as ReportRow[]) || []).map((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    return {
      id: row.id,
      reporterId: row.reporter_id,
      reporterName: profile?.display_name ?? "deleted",
      targetType: row.target_type,
      targetId: row.target_id,
      reason: row.reason,
      status: row.status,
      createdAt: new Date(row.created_at).getTime(),
      reviewedBy: row.reviewed_by,
      reviewedAt: row.reviewed_at ? new Date(row.reviewed_at).getTime() : null,
    };
  });
}

export async function resolveReport(
  supabase: SupabaseClient,
  reportId: string,
  status: "reviewed" | "dismissed",
  reviewerId: string
): Promise<void> {
  const { error } = await supabase
    .from("reports")
    .update({ status, reviewed_by: reviewerId, reviewed_at: new Date().toISOString() })
    .eq("id", reportId);
  if (error) throw error;
}

export async function blockUser(supabase: SupabaseClient, blockerId: string, blockedId: string): Promise<void> {
  const { error } = await supabase.from("blocks").upsert({ blocker_id: blockerId, blocked_id: blockedId });
  if (error) throw error;
}

export async function unblockUser(supabase: SupabaseClient, blockerId: string, blockedId: string): Promise<void> {
  const { error } = await supabase.from("blocks").delete().eq("blocker_id", blockerId).eq("blocked_id", blockedId);
  if (error) throw error;
}

interface BlockRow {
  blocked_id: string;
  created_at: string;
  profiles: { display_name: string; avatar_url: string | null } | { display_name: string; avatar_url: string | null }[] | null;
}

export async function getMyBlockedUsers(supabase: SupabaseClient, blockerId: string): Promise<BlockedUser[]> {
  const { data, error } = await supabase
    .from("blocks")
    .select("blocked_id, created_at, profiles!blocks_blocked_id_fkey(display_name, avatar_url)")
    .eq("blocker_id", blockerId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return ((data as unknown as BlockRow[]) || []).map((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    return {
      id: row.blocked_id,
      displayName: profile?.display_name ?? "deleted",
      avatarUrl: profile?.avatar_url ?? null,
      blockedAt: new Date(row.created_at).getTime(),
    };
  });
}

// Full member list for the admin dashboard's "Total members" drill-down.
// Small forum, no pagination yet — revisit once this list is large enough
// that shipping every row on click actually matters.
export async function getAdminMembers(supabase: SupabaseClient): Promise<AdminMember[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, role, state, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data || []).map((row) => ({
    id: row.id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    role: row.role,
    state: row.state,
    createdAt: new Date(row.created_at).getTime(),
  }));
}

interface AdminBlockRow {
  blocker_id: string;
  blocked_id: string;
  created_at: string;
  blocker: { display_name: string } | { display_name: string }[] | null;
  blocked: { display_name: string } | { display_name: string }[] | null;
}

// Every block relationship site-wide, for the admin dashboard — unlike
// getMyBlockedUsers (a member's own list), this isn't scoped to one blocker.
// A user showing up as blocked_id many times over is the actual moderation
// signal here, so we return the raw rows and let the page do the counting.
export async function getAdminBlocks(supabase: SupabaseClient): Promise<AdminBlockRecord[]> {
  const { data, error } = await supabase
    .from("blocks")
    .select("blocker_id, blocked_id, created_at, blocker:profiles!blocks_blocker_id_fkey(display_name), blocked:profiles!blocks_blocked_id_fkey(display_name)")
    .order("created_at", { ascending: false });
  if (error) throw error;

  return ((data as unknown as AdminBlockRow[]) || []).map((row) => {
    const blocker = Array.isArray(row.blocker) ? row.blocker[0] : row.blocker;
    const blocked = Array.isArray(row.blocked) ? row.blocked[0] : row.blocked;
    return {
      blockerId: row.blocker_id,
      blockerName: blocker?.display_name ?? "deleted",
      blockedId: row.blocked_id,
      blockedName: blocked?.display_name ?? "deleted",
      createdAt: new Date(row.created_at).getTime(),
    };
  });
}

// Site-wide counts for the admin dashboard. Runs a batch of small
// head-only/count queries in parallel rather than pulling full rows — the
// state/topic breakdowns are the only place actual column values are
// fetched, since Postgres has no plain "group by, count" through the
// Supabase JS client and the table sizes here are small enough that
// grouping client-side is simpler than adding a Postgres view for it.
export async function getAdminStats(supabase: SupabaseClient): Promise<AdminStats> {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const count = (table: string, gte?: string) => {
    let q = supabase.from(table).select("id", { count: "exact", head: true });
    if (gte) q = q.gte("created_at", gte);
    return q;
  };

  const [
    totalUsers, newUsersToday, newUsersThisWeek,
    totalPosts, newPostsToday, newPostsThisWeek,
    totalComments, newCommentsToday, newCommentsThisWeek,
    pendingReports, pendingExpertApplications,
    statesRes, topicsRes,
  ] = await Promise.all([
    count("profiles"), count("profiles", startOfToday), count("profiles", sevenDaysAgo),
    count("posts"), count("posts", startOfToday), count("posts", sevenDaysAgo),
    count("comments"), count("comments", startOfToday), count("comments", sevenDaysAgo),
    supabase.from("reports").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("expert_applications").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("profiles").select("state"),
    supabase.from("posts").select("topic_id"),
  ]);

  const stateCounts = new Map<string, number>();
  for (const row of (statesRes.data as { state: string | null }[]) || []) {
    if (!row.state) continue;
    stateCounts.set(row.state, (stateCounts.get(row.state) ?? 0) + 1);
  }
  const usersByState = [...stateCounts.entries()]
    .map(([state, c]) => ({ state, count: c }))
    .sort((a, b) => b.count - a.count);

  const topicCounts = new Map<string, number>();
  for (const row of (topicsRes.data as { topic_id: string }[]) || []) {
    topicCounts.set(row.topic_id, (topicCounts.get(row.topic_id) ?? 0) + 1);
  }
  const postsByTopic = [...topicCounts.entries()]
    .map(([topicId, c]) => ({ topicId, count: c }))
    .sort((a, b) => b.count - a.count);

  return {
    totalUsers: totalUsers.count ?? 0,
    newUsersToday: newUsersToday.count ?? 0,
    newUsersThisWeek: newUsersThisWeek.count ?? 0,
    totalPosts: totalPosts.count ?? 0,
    newPostsToday: newPostsToday.count ?? 0,
    newPostsThisWeek: newPostsThisWeek.count ?? 0,
    totalComments: totalComments.count ?? 0,
    newCommentsToday: newCommentsToday.count ?? 0,
    newCommentsThisWeek: newCommentsThisWeek.count ?? 0,
    pendingReports: pendingReports.count ?? 0,
    pendingExpertApplications: pendingExpertApplications.count ?? 0,
    usersByState,
    postsByTopic,
  };
}
