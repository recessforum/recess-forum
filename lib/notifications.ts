import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "./supabase/admin";
import { sendEmail } from "./email";

/**
 * Emails the post's author when a top-level comment is added, or the parent
 * comment's author when a reply is added. Never throws — a notification
 * failure should never fail the comment itself, so every step here is
 * best-effort and swallows its own errors.
 */
export async function notifyOnComment(
  supabase: SupabaseClient,
  params: { postId: string; parentId: string | null; commentAuthorId: string; commentAuthorName: string }
): Promise<void> {
  try {
    const { postId, parentId, commentAuthorId, commentAuthorName } = params;

    const { data: post } = await supabase.from("posts").select("title, author_id").eq("id", postId).maybeSingle();
    if (!post) return;

    let recipientId: string;
    let isReply: boolean;
    if (parentId) {
      const { data: parentComment } = await supabase
        .from("comments")
        .select("author_id")
        .eq("id", parentId)
        .maybeSingle();
      if (!parentComment) return;
      recipientId = parentComment.author_id;
      isReply = true;
    } else {
      recipientId = post.author_id;
      isReply = false;
    }

    if (recipientId === commentAuthorId) return; // don't notify yourself

    const { data: recipientProfile } = await supabase
      .from("profiles")
      .select("email_notifications_enabled")
      .eq("id", recipientId)
      .maybeSingle();
    if (recipientProfile?.email_notifications_enabled === false) return;

    const admin = createAdminClient();
    const { data: userData } = await admin.auth.admin.getUserById(recipientId);
    const email = userData?.user?.email;
    if (!email) return;

    const postUrl = `https://www.recessforum.com/post/${postId}`;
    const action = isReply ? "replied to your comment on" : "commented on your post";
    const subject = `${commentAuthorName} ${action} "${post.title}"`;

    await sendEmail({
      to: email,
      subject,
      html: `
        <p>${commentAuthorName} ${action} <strong>${post.title}</strong> on Recess Forum.</p>
        <p><a href="${postUrl}">View it</a></p>
      `,
    });
  } catch (err) {
    console.error("notifyOnComment failed", err);
  }
}

const ADMIN_NOTIFY_EMAIL = process.env.ADMIN_NOTIFY_EMAIL || "recessforum@gmail.com";
const ADMIN_URL = "https://www.recessforum.com/admin";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

async function displayNameOf(supabase: SupabaseClient, userId: string): Promise<string> {
  const { data } = await supabase.from("profiles").select("display_name").eq("id", userId).maybeSingle();
  return data?.display_name ?? "A user";
}

/** Tells the admin mailbox a new Verified Expert application is waiting. Best-effort, never throws. */
export async function notifyAdminOfExpertApplication(
  supabase: SupabaseClient,
  params: { applicantId: string; expertType: string; credentialInfo: string; hasFile: boolean }
): Promise<void> {
  try {
    const name = escapeHtml(await displayNameOf(supabase, params.applicantId));
    const type = escapeHtml(params.expertType);
    await sendEmail({
      to: ADMIN_NOTIFY_EMAIL,
      subject: `New Verified Expert application from ${name}`,
      html: `
        <p><strong>${name}</strong> applied to be a Verified Expert (${type}).</p>
        <p style="white-space:pre-wrap">${escapeHtml(params.credentialInfo)}</p>
        <p>${params.hasFile ? "A credential file is attached to the application." : "No credential file was uploaded."}</p>
        <p><a href="${ADMIN_URL}">Review it in the admin page</a></p>
      `,
    });
  } catch (err) {
    console.error("notifyAdminOfExpertApplication failed", err);
  }
}

/** Tells the admin mailbox a new report is waiting. Best-effort, never throws. */
export async function notifyAdminOfReport(
  supabase: SupabaseClient,
  params: { reporterId: string; targetType: string; reason: string }
): Promise<void> {
  try {
    const reporter = escapeHtml(await displayNameOf(supabase, params.reporterId));
    const target = escapeHtml(params.targetType);
    await sendEmail({
      to: ADMIN_NOTIFY_EMAIL,
      subject: `New report: a ${target} was reported`,
      html: `
        <p><strong>${reporter}</strong> reported a ${target}.</p>
        <p>Reason: ${escapeHtml(params.reason)}</p>
        <p><a href="${ADMIN_URL}">Review it in the admin page</a></p>
      `,
    });
  } catch (err) {
    console.error("notifyAdminOfReport failed", err);
  }
}
