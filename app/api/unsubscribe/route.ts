import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Turns off topic alert emails for the member who owns the token. Called by
 * the /unsubscribe page and by mail apps' one-click unsubscribe (RFC 8058),
 * which POST here with no cookies, so the token alone identifies the member.
 */
export async function POST(req: NextRequest) {
  let token = req.nextUrl.searchParams.get("t");
  if (!token && req.headers.get("content-type")?.includes("application/json")) {
    token = (await req.json().catch(() => ({}))).t ?? null;
  }
  if (!token || !UUID.test(token)) return NextResponse.json({ error: "invalid link" }, { status: 400 });

  const { error } = await createAdminClient()
    .from("notification_prefs")
    .update({ category_emails: false, updated_at: new Date().toISOString() })
    .eq("unsubscribe_token", token);
  if (error) return NextResponse.json({ error: "Couldn't unsubscribe. Please try again." }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// A plain visit (or a link scanner) only lands on the confirmation page.
export async function GET(req: NextRequest) {
  const t = req.nextUrl.searchParams.get("t") ?? "";
  return NextResponse.redirect(new URL(`/unsubscribe?t=${encodeURIComponent(t)}`, req.url));
}
