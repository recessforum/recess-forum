import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "./supabase/admin";
import { sendEmail } from "./email";
import { DAILY_ALERT_CAP, EXPERT_DAILY_ALERT_CAP } from "./topic-alerts";
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

    // Verified Experts get a higher daily cap: answering questions is why they're here.
    const { data: experts } = await admin.from("profiles").select("id")
      .eq("role", "verified_expert").in("id", subs.map((s) => s.user_id));
    const expertIds = new Set((experts ?? []).map((e) => e.id));

    const today = new Date().toISOString().slice(0, 10);
    const postUrl = `${SITE}/post/${params.postId}`;
    const title = escapeHtml(params.title);
    const snippetRaw = (params.body ?? "").replace(/\s+/g, " ").trim();
    const snippet = snippetRaw.length > 220 ? `${snippetRaw.slice(0, 220)}…` : snippetRaw;
    const subject = `New in ${params.categoryLabel}: ${params.title}`.slice(0, 150);

    for (const sub of subs) {
      const sentToday = sub.sent_day === today ? sub.sent_today : 0;
      if (sentToday >= (expertIds.has(sub.user_id) ? EXPERT_DAILY_ALERT_CAP : DAILY_ALERT_CAP)) continue;

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

/**
 * Welcome email when an application is approved: what the badge means and a
 * button to pick topics and turn on alerts (nothing is switched on for them).
 */
export async function notifyExpertApproved(userId: string): Promise<void> {
  try {
    const admin = createAdminClient();
    const [{ data: userData }, { data: profile }] = await Promise.all([
      admin.auth.admin.getUserById(userId),
      admin.from("profiles").select("display_name, expert_type").eq("id", userId).maybeSingle(),
    ]);
    const email = userData?.user?.email;
    if (!email || !profile) return;
    const name = profile.display_name, expertType = profile.expert_type as string | null;
    const settingsUrl = `${SITE}/settings#expert-alerts`;
    const type = expertType ? ` (${escapeHtml(expertType)})` : "";
    await sendEmail({
      to: email,
      subject: "You're a Verified Expert on Recess Forum",
      html: `
        <div style="font-family:-apple-system,system-ui,sans-serif;max-width:560px;color:#1C1B19">
          <h1 style="font-size:20px;line-height:1.3;margin:0 0 10px">Welcome, ${escapeHtml(name)}! You're now a Verified Expert${type}.</h1>
          <p style="font-size:14px;line-height:1.6;color:#3A382F">Thank you for helping parents. Here's how to find the questions you can answer:</p>
          <ol style="font-size:14px;line-height:1.6;color:#3A382F;padding-left:20px">
            <li><strong>Pick your topics and turn on alerts.</strong> We'll email you new questions in those topics, or one daily summary of questions still waiting for an expert. Your choice.</li>
            <li><strong>Parents can ask you directly.</strong> When a parent taps "Ask a Verified Expert" on their post and picks you, we'll email you a link.</li>
            <li><strong>Your answers stand out.</strong> Replies show your Verified Expert badge, and the post is marked "Answered by a Verified Expert."</li>
          </ol>
          <p style="margin:20px 0"><a href="${settingsUrl}" style="display:inline-block;background:#26364A;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:10px 18px">Choose topics and alerts</a></p>
          <p style="font-size:13px;color:#5B584F;line-height:1.6">You can also add a short bio and your practice website in Settings so parents can learn about you on your profile.</p>
        </div>`,
      text: `Welcome, ${name}! You're now a Verified Expert on Recess Forum.\n\n1. Pick your topics and turn on alerts: ${settingsUrl}\n2. Parents can ask you directly from their post; we'll email you a link.\n3. Your replies show your Verified Expert badge.\n`,
    });
  } catch (err) {
    console.error("notifyExpertApproved failed", err);
  }
}

/** A parent asked this expert to answer their post. Honors the expert's reply-email setting. Never throws. */
export async function notifyExpertRequest(params: { expertId: string; postId: string; requesterName: string }): Promise<void> {
  try {
    const admin = createAdminClient();
    const [{ data: expert }, { data: post }] = await Promise.all([
      admin.from("profiles").select("email_notifications_enabled, role").eq("id", params.expertId).maybeSingle(),
      admin.from("posts").select("title, body").eq("id", params.postId).maybeSingle(),
    ]);
    if (!post || expert?.role !== "verified_expert" || expert.email_notifications_enabled === false) return;
    const { data: userData } = await admin.auth.admin.getUserById(params.expertId);
    const email = userData?.user?.email;
    if (!email) return;

    const postUrl = `${SITE}/post/${params.postId}`;
    const snippetRaw = (post.body ?? "").replace(/\s+/g, " ").trim();
    const snippet = snippetRaw.length > 300 ? `${snippetRaw.slice(0, 300)}…` : snippetRaw;
    await sendEmail({
      to: email,
      subject: `A parent asked for your answer: ${post.title}`.slice(0, 150),
      html: `
        <div style="font-family:-apple-system,system-ui,sans-serif;max-width:560px;color:#1C1B19">
          <p style="font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#217A78;margin:0 0 8px">Asked you directly</p>
          <h1 style="font-size:20px;line-height:1.3;margin:0 0 10px">${escapeHtml(post.title)}</h1>
          ${snippet ? `<p style="font-size:14px;line-height:1.55;color:#5B584F;margin:0 0 6px">${escapeHtml(snippet)}</p>` : ""}
          <p style="font-size:12px;color:#9A968A;margin:0 0 18px">${escapeHtml(params.requesterName)} would love a Verified Expert's take.</p>
          <a href="${postUrl}" style="display:inline-block;background:#26364A;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:10px 18px">Read and reply</a>
          <p style="font-size:12px;color:#9A968A;margin-top:24px">You're getting this because you're a Verified Expert on Recess Forum. Don't want these? <a href="${SITE}/settings" style="color:#5B584F">Turn off reply emails in Settings</a>.</p>
        </div>`,
      text: `${params.requesterName} asked for your answer on Recess Forum:\n\n${post.title}\n${snippet}\n\nRead and reply: ${postUrl}\n\nTurn these off in Settings: ${SITE}/settings`,
    });
  } catch (err) {
    console.error("notifyExpertRequest failed", err);
  }
}

/**
 * Daily email for Verified Experts who opted in: questions from the past 3 days
 * in their topics with no expert reply yet, plus direct requests they haven't
 * answered. Experts with nothing waiting get no email. At most one per day.
 */
export async function sendExpertDailySummaries(): Promise<{ sent: number; skipped: number }> {
  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);
  const since = new Date(Date.now() - 3 * 864e5).toISOString();

  const { data: subs } = await admin.from("notification_prefs").select("user_id, categories, unsubscribe_token, expert_daily_last_sent")
    .eq("expert_daily", true).or(`expert_daily_last_sent.is.null,expert_daily_last_sent.lt.${today}`).limit(1000);
  if (!subs?.length) return { sent: 0, skipped: 0 };
  const { data: experts } = await admin.from("profiles").select("id").eq("role", "verified_expert").in("id", subs.map((s) => s.user_id));
  const expertIds = new Set((experts ?? []).map((e) => e.id));

  const { data: posts } = await admin.from("posts")
    .select("id, title, topic_id, author_id, created_at, comments(author_id, profiles!comments_author_id_fkey(role))")
    .is("circle_id", null).gte("created_at", since).order("created_at", { ascending: false }).limit(500);
  type C = { author_id: string; profiles: { role: string } | { role: string }[] | null };
  const roleOf = (c: C) => (Array.isArray(c.profiles) ? c.profiles[0]?.role : c.profiles?.role);
  const open = (posts ?? []).map((p) => {
    const comments = (p.comments as C[] | null) ?? [];
    return { id: p.id, title: p.title, author: p.author_id, category: categoryOf(p.topic_id), replies: comments.length,
      expertAnswered: comments.some((c) => roleOf(c) === "verified_expert"), commenters: new Set(comments.map((c) => c.author_id)) };
  }).filter((p) => !p.expertAnswered);

  const { data: requests } = await admin.from("expert_requests").select("post_id, expert_id, posts(id, title, comments(author_id))")
    .in("expert_id", [...expertIds]).gte("created_at", new Date(Date.now() - 14 * 864e5).toISOString());

  const row = (p: { id: string; title: string }, note: string) =>
    `<li style="margin:0 0 10px"><a href="${SITE}/post/${p.id}" style="color:#26364A;font-weight:600;text-decoration:none">${escapeHtml(p.title)}</a><br><span style="font-size:12px;color:#9A968A">${escapeHtml(note)}</span></li>`;
  const section = (title: string, items: string) => items ? `<h2 style="font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:#217A78;margin:24px 0 10px">${title}</h2><ul style="padding-left:18px;margin:0">${items}</ul>` : "";

  let sent = 0, skipped = 0;
  for (const sub of subs) {
    if (!expertIds.has(sub.user_id)) { skipped++; continue; }
    type R = { post_id: string; expert_id: string; posts: { id: string; title: string; comments: { author_id: string }[] | null } | null };
    const asked = ((requests ?? []) as unknown as R[])
      .filter((r) => r.expert_id === sub.user_id && r.posts && !(r.posts.comments ?? []).some((c) => c.author_id === sub.user_id))
      .map((r) => r.posts!);
    const askedIds = new Set(asked.map((p) => p.id));
    const waiting = open.filter((p) => p.category && sub.categories.includes(p.category.id) && p.author !== sub.user_id
      && !p.commenters.has(sub.user_id) && !askedIds.has(p.id)).slice(0, 8);
    if (!asked.length && !waiting.length) { skipped++; continue; }

    const { data: userData } = await admin.auth.admin.getUserById(sub.user_id);
    const email = userData?.user?.email;
    if (!email) { skipped++; continue; }

    const unsub = `${SITE}/unsubscribe?t=${sub.unsubscribe_token}&k=expert`;
    const count = asked.length + waiting.length;
    const html = `
      <div style="font-family:-apple-system,system-ui,sans-serif;max-width:560px;color:#1C1B19">
        <h1 style="font-size:20px;margin:0 0 4px">${count} ${count === 1 ? "question is" : "questions are"} waiting for an expert</h1>
        <p style="font-size:14px;color:#5B584F;margin:0">Parents in your topics would love a Verified Expert's answer.</p>
        ${section("Asked you directly", asked.map((p) => row(p, "A parent picked you")).join(""))}
        ${section("Waiting in your topics", waiting.map((p) => row(p, `${p.category!.label} · ${p.replies ? `${p.replies} ${p.replies === 1 ? "reply" : "replies"}, no expert yet` : "No replies yet"}`)).join(""))}
        <hr style="border:none;border-top:1px solid #E6E3DA;margin:28px 0 14px">
        <p style="font-size:12px;color:#9A968A;line-height:1.6">You're getting this because you turned on the daily expert summary.<br>
          <a href="${unsub}" style="color:#5B584F">Unsubscribe from the daily summary</a> · <a href="${SITE}/settings#expert-alerts" style="color:#5B584F">Change your topics</a>${MAILING_ADDRESS ? `<br>Recess Forum · ${escapeHtml(MAILING_ADDRESS)}` : ""}</p>
      </div>`;
    const text = [
      `${count} questions are waiting for an expert on Recess Forum`,
      ...(asked.length ? ["", "Asked you directly:", ...asked.map((p) => `- ${p.title} (${SITE}/post/${p.id})`)] : []),
      ...(waiting.length ? ["", "Waiting in your topics:", ...waiting.map((p) => `- ${p.title} (${SITE}/post/${p.id})`)] : []),
      "", `Unsubscribe from the daily summary: ${unsub}`,
    ].join("\n");

    await sendEmail({
      to: email, subject: `${count} ${count === 1 ? "question" : "questions"} waiting for an expert on Recess Forum`, html, text,
      headers: {
        "List-Unsubscribe": `<${SITE}/api/unsubscribe?t=${sub.unsubscribe_token}&k=expert>, <mailto:recessforum@gmail.com?subject=unsubscribe>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });
    await admin.from("notification_prefs").update({ expert_daily_last_sent: today }).eq("user_id", sub.user_id);
    sent++;
  }
  return { sent, skipped };
}
