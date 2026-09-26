import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { APP_SCHEME } from "@/lib/app-scheme";

function handoffPage(appUrl: string, recovery: boolean) {
  const href = appUrl.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Returning to Recess Forum</title>
<style>body{font-family:-apple-system,system-ui,sans-serif;background:#F7F6F3;color:#1C1B19;text-align:center;padding:72px 24px}a.b{display:inline-block;margin-top:20px;padding:12px 22px;background:#26364A;color:#fff;text-decoration:none;font-weight:600;font-size:15px}p{color:#5B584F;font-size:14px}</style></head>
<body><h1 style="font-size:20px">Signing you in…</h1><p>Returning to the Recess Forum app.</p>
<a class="b" href="${href}">Open Recess Forum</a>
${recovery
  ? `<p style="margin-top:28px;font-size:13px">Not using the app? Reset links have to be opened in the same browser you requested them from.<br><a href="/forgot-password">Send a new link</a></p>`
  : `<p style="margin-top:28px;font-size:12px">Not using the app? <a href="/login">Back to log in</a></p>`}
<script>window.location.replace(${JSON.stringify(appUrl).replace(/</g, "\\u003c")});</script></body></html>`;
}

// Handles both the email-confirmation link and the OAuth (Google) redirect —
// both send the browser here with a `code` to exchange for a session.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/";

  // Native apps run sign-in in an in-app browser sheet (Safari View
  // Controller / Custom Tabs) that doesn't share cookies with the app's
  // webview, so the PKCE verifier isn't here. Hand the code back to the app
  // through its URL scheme; the webview finishes the exchange itself.
  const hasVerifier = request.cookies.getAll().some((c) => c.name.endsWith("-code-verifier"));
  if (code && !hasVerifier) {
    const appUrl = `${APP_SCHEME}://auth/callback${new URL(request.url).search}`;
    return new NextResponse(handoffPage(appUrl, next === "/reset-password"), {
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
    });
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("nickname_set").eq("id", user.id).single();
        if (profile && !profile.nickname_set) {
          return NextResponse.redirect(`${origin}/welcome?next=${encodeURIComponent(next)}`);
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
