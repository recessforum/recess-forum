import { NextRequest, NextResponse } from "next/server";
import { sendExpertDailySummaries } from "@/lib/notifications";

export const maxDuration = 300;

/**
 * Called by the Vercel cron in vercel.json. With CRON_SECRET set, Vercel sends
 * `Authorization: Bearer $CRON_SECRET` and that's required. Without it, only
 * Vercel's cron user agent is accepted; that's weaker, but sending is
 * idempotent (each expert gets at most one summary per day), so a stray
 * trigger can't spam anyone.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const ok = secret
    ? req.headers.get("authorization") === `Bearer ${secret}`
    : (req.headers.get("user-agent") ?? "").startsWith("vercel-cron/");
  if (!ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json(await sendExpertDailySummaries());
}
