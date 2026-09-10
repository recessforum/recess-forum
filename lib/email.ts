/**
 * Thin wrapper over Resend's HTTP API (not the SMTP integration Supabase
 * Auth uses for its own emails — this is for app-triggered notifications).
 * No `resend` package dependency; it's a single POST.
 */
export async function sendEmail(input: { to: string; subject: string; html: string }): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY not set — skipping email send");
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Recess Forum <noreply@recessforum.com>",
      to: input.to,
      subject: input.subject,
      html: input.html,
    }),
  });

  if (!res.ok) {
    console.error("Resend send failed", res.status, await res.text().catch(() => ""));
  }
}
