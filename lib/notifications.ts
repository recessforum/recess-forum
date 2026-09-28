import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "./supabase/admin";
import { sendEmail } from "./email";
import { DAILY_ALERT_CAP } from "./topic-alerts";
import { categoryOf } from "./taxonomy";

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
        <p>${escapeHtml(commentAuthorName)} ${action} <strong>${escapeHtml(post.title)}</strong> on Recess Forum.</p>
        <p><a href="${postUrl}">View it</a></p>
        <p style="font-size:12px;color:#9A968A">Don't want reply emails? <a href="https://www.recessforum.com/settings" style="color:#5B584F">Turn them off in Settings</a>.</p>
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

const SITE = "https://www.recessforum.com";
// CAN-SPAM wants a valid postal address in commercial email; alerts carry it
// whenever it's configured (a PO box or virtual mailbox is fine).
const MAILING_ADDRESS = process.env.NOTIFY_MAILING_ADDRESS || "";

function alertFooter(categoryLabel: string, unsubscribeUrl: string): { html: string; text: string } {
  const address = MAILING_ADDRESS ? `<br>Recess Forum · ${escapeHtml(MAILING_ADDRESS)}` : "";
  return {
    html: `
      <hr style="border:none;border-top:1px solid #E6E3DA;margin:28px 0 14px">
      <p style="font-size:12px;color:#9A968A;line-height:1.6">
        You're getting this because you turned on email alerts for ${escapeHtml(categoryLabel)} on Recess Forum.<br>
        <a href="${unsubscribeUrl}" style="color:#5B584F">Unsubscribe from topic alerts</a> ·
        <a href="${SITE}/settings" style="color:#5B584F">Change your topics</a>${address}
      </p>`,
    text: `\n\n--\nYou're getting this because you turned on email alerts for ${categoryLabel} on Recess Forum.\nUnsubscribe: ${unsubscribeUrl}\nChange your topics: ${SITE}/settings${MAILING_ADDRESS ? `\nRecess Forum, ${MAILING_ADDRESS}` : ""}`,
  };
}

/**
 * Emails members who opted in to alerts for the new post's category. Only
 * public posts (not circle posts) are announced, never to the author, and no
 * member gets more than DAILY_ALERT_CAP alerts a day. Best-effort, never throws.
 */
export async function notifyTopicSubscribers(params: {
  postId: string; authorId: string; title: string; body: string | null; categoryId: string; categoryLabel: string; authorName: string;
}): Promise<void> {
  try {
    const admin = createAdminClient();
    const { data: subs } = await admin
      .from("notification_prefs")
      .select("user_id, unsubscribe_token, sent_day, sent_today")
      .eq("category_emails", true)
      .contains("categories", [params.categoryId])
      .neq("user_id", params.authorId)
      .limit(1000);
    if (!subs?.length) return;

    const today = new Date().toISOString().slice(0, 10);
    const postUrl = `${SITE}/post/${params.postId}`;
    const title = escapeHtml(params.title);
    const snippetRaw = (params.body ?? "").replace(/\s+/g, " ").trim();
    const snippet = snippetRaw.length > 220 ? `${snippetRaw.slice(0, 220)}…` : snippetRaw;
    const subject = `New in ${params.categoryLabel}: ${params.title}`.slice(0, 150);

    for (const sub of subs) {
      const sentToday = sub.sent_day === today ? sub.sent_today : 0;
      if (sentToday >= DAILY_ALERT_CAP) continue;

      const { data: userData } = await admin.auth.admin.getUserById(sub.user_id);
      const email = userData?.user?.email;
      if (!email) continue;

      const unsubscribeUrl = `${SITE}/unsubscribe?t=${sub.unsubscribe_token}`;
      const footer = alertFooter(params.categoryLabel, unsubscribeUrl);
      await sendEmail({
        to: email,
        subject,
        html: `
          <div style="font-family:-apple-system,system-ui,sans-serif;max-width:560px;color:#1C1B19">
            <p style="font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#9C3B4A;margin:0 0 8px">New in ${escapeHtml(params.categoryLabel)}</p>
            <h1 style="font-size:20px;line-height:1.3;margin:0 0 10px">${title}</h1>
            ${snippet ? `<p style="font-size:14px;line-height:1.55;color:#5B584F;margin:0 0 6px">${escapeHtml(snippet)}</p>` : ""}
            <p style="font-size:12px;color:#9A968A;margin:0 0 18px">Posted by ${escapeHtml(params.authorName)}</p>
            <a href="${postUrl}" style="display:inline-block;background:#26364A;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:10px 18px">Read and reply</a>
            ${footer.html}
          </div>`,
        text: `New in ${params.categoryLabel}: ${params.title}\n\n${snippet}\n\nRead and reply: ${postUrl}${footer.text}`,
        headers: {
          // RFC 8058 one-click unsubscribe (Gmail/Yahoo bulk-sender requirement).
          "List-Unsubscribe": `<${SITE}/api/unsubscribe?t=${sub.unsubscribe_token}>, <mailto:recessforum@gmail.com?subject=unsubscribe>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      });

      await admin.from("notification_prefs")
        .update({ sent_day: today, sent_today: sentToday + 1 })
        .eq("user_id", sub.user_id);
    }
  } catch (err) {
    console.error("notifyTopicSubscribers failed", err);
  }
}

/**
 * Weekly digest for members who opted in: the most active posts of the past
 * week in their topics, questions still waiting for answers, and upcoming
 * Office Hours. Members with nothing relevant that week get no email.
 * Runs from the weekly cron; skips anyone already sent one in the last 6 days.
 */
export async function sendWeeklyDigests(): Promise<{ sent: number; skipped: number }> {
  const admin = createAdminClient();
  const today = new Date();
  const weekAgo = new Date(+today - 7 * 864e5).toISOString();
  const sixDaysAgo = new Date(+today - 6 * 864e5).toISOString().slice(0, 10);

  const [{ data: subs }, { data: posts }, { data: events }] = await Promise.all([
    admin.from("notification_prefs").select("user_id, categories, unsubscribe_token, digest_last_sent")
      .eq("weekly_digest", true).or(`digest_last_sent.is.null,digest_last_sent.lte.${sixDaysAgo}`).limit(2000),
    admin.from("posts").select("id, title, topic_id, score, author_id, comments(count)")
      .is("circle_id", null).gte("created_at", weekAgo).limit(500),
    admin.from("events").select("post_id, title, starts_at").gte("starts_at", today.toISOString())
      .lte("starts_at", new Date(+today + 7 * 864e5).toISOString()).order("starts_at"),
  ]);
  if (!subs?.length) return { sent: 0, skipped: 0 };

  const enriched = (posts ?? []).map((p) => ({
    ...p, category: categoryOf(p.topic_id)?.id, replies: (p.comments as { count: number }[] | null)?.[0]?.count ?? 0,
  }));
  const row = (p: { id: string; title: string }, note: string) =>
    `<li style="margin:0 0 10px"><a href="${SITE}/post/${p.id}" style="color:#26364A;font-weight:600;text-decoration:none">${escapeHtml(p.title)}</a><br><span style="font-size:12px;color:#9A968A">${note}</span></li>`;

  let sent = 0, skipped = 0;
  for (const sub of subs) {
    const mine = enriched.filter((p) => p.category && sub.categories.includes(p.category) && p.author_id !== sub.user_id);
    const popular = mine.filter((p) => p.replies > 0).sort((a, b) => b.score + 2 * b.replies - (a.score + 2 * a.replies)).slice(0, 5);
    const waiting = mine.filter((p) => p.replies === 0).slice(0, 3);
    if (!popular.length && !waiting.length && !events?.length) { skipped++; continue; }

    const { data: userData } = await admin.auth.admin.getUserById(sub.user_id);
    const email = userData?.user?.email;
    if (!email) { skipped++; continue; }

    const unsub = `${SITE}/unsubscribe?t=${sub.unsubscribe_token}&k=digest`;
    const section = (title: string, items: string) => items ? `<h2 style="font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:#9C3B4A;margin:24px 0 10px">${title}</h2><ul style="padding-left:18px;margin:0">${items}</ul>` : "";
    const html = `
      <div style="font-family:-apple-system,system-ui,sans-serif;max-width:560px;color:#1C1B19">
        <h1 style="font-size:20px;margin:0 0 4px">This week on Recess Forum</h1>
        <p style="font-size:14px;color:#5B584F;margin:0">The conversations in your topics from the past 7 days.</p>
        ${section("Most helpful this week", popular.map((p) => row(p, `${p.replies} ${p.replies === 1 ? "reply" : "replies"}`)).join(""))}
        ${section("Can you help? Still waiting for answers", waiting.map((p) => row(p, "No replies yet")).join(""))}
        ${section("Office Hours this week", (events ?? []).map((e) => row({ id: e.post_id, title: e.title }, new Date(e.starts_at).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/New_York", timeZoneName: "short" }))).join(""))}
        <p style="margin:26px 0 0"><a href="${SITE}" style="display:inline-block;background:#26364A;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:10px 18px">Open Recess Forum</a></p>
        <hr style="border:none;border-top:1px solid #E6E3DA;margin:28px 0 14px">
        <p style="font-size:12px;color:#9A968A;line-height:1.6">You're getting this because you turned on the weekly digest.<br>
          <a href="${unsub}" style="color:#5B584F">Unsubscribe from the digest</a> · <a href="${SITE}/settings" style="color:#5B584F">Change your topics</a>${MAILING_ADDRESS ? `<br>Recess Forum · ${escapeHtml(MAILING_ADDRESS)}` : ""}</p>
      </div>`;
    const text = [
      "This week on Recess Forum",
      ...popular.map((p) => `- ${p.title} (${SITE}/post/${p.id})`),
      ...(waiting.length ? ["", "Still waiting for answers:", ...waiting.map((p) => `- ${p.title} (${SITE}/post/${p.id})`)] : []),
      "", `Unsubscribe from the digest: ${unsub}`,
    ].join("\n");

    await sendEmail({
      to: email, subject: "This week on Recess Forum", html, text,
      headers: {
        "List-Unsubscribe": `<${SITE}/api/unsubscribe?t=${sub.unsubscribe_token}&k=digest>, <mailto:recessforum@gmail.com?subject=unsubscribe>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });
    await admin.from("notification_prefs").update({ digest_last_sent: today.toISOString().slice(0, 10) }).eq("user_id", sub.user_id);
    sent++;
  }
  return { sent, skipped };
}
