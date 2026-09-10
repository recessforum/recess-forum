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
