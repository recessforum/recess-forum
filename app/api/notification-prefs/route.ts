import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ALERT_CONSENT_TEXT, isValidCategoryList } from "@/lib/topic-alerts";

/** The signed-in member's topic alert settings (null until they've picked). */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "log in first" }, { status: 401 });

  const [{ data: prefs }, { data: profile }] = await Promise.all([
    supabase.from("notification_prefs").select("categories, category_emails").eq("user_id", user.id).maybeSingle(),
    supabase.from("profiles").select("email_notifications_enabled").eq("id", user.id).maybeSingle(),
  ]);
  return NextResponse.json({
    prefs: prefs ? { categories: prefs.categories, categoryEmails: prefs.category_emails } : null,
    replyEmails: profile?.email_notifications_enabled !== false,
  });
}

/** Saves topics + the alert opt-in. `replyEmails` optionally toggles the
 *  existing reply/comment emails from the same settings screen. */
export async function PUT(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "log in first" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  if (!isValidCategoryList(body.categories)) {
    return NextResponse.json({ error: "Pick at least one topic." }, { status: 400 });
  }
  const categoryEmails = body.categoryEmails === true;

  const { data: existing } = await supabase
    .from("notification_prefs").select("category_emails").eq("user_id", user.id).maybeSingle();

  const row: Record<string, unknown> = {
    user_id: user.id,
    categories: body.categories,
    category_emails: categoryEmails,
    updated_at: new Date().toISOString(),
  };
  // Record consent each time the member switches alerts on (not on every save).
  if (categoryEmails && !existing?.category_emails) {
    row.consented_at = new Date().toISOString();
    row.consent_text = ALERT_CONSENT_TEXT;
  }

  const { error } = await supabase.from("notification_prefs").upsert(row, { onConflict: "user_id" });
  if (error) return NextResponse.json({ error: "Couldn't save your topics. Please try again." }, { status: 500 });

  if (typeof body.replyEmails === "boolean") {
    await supabase.from("profiles").update({ email_notifications_enabled: body.replyEmails }).eq("id", user.id);
  }
  return NextResponse.json({ ok: true });
}
