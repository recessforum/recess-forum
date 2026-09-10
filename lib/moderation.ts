/**
 * Violence-only content filter via OpenAI's Moderation API (free, no
 * OpenAI account/spend needed beyond an API key). Deliberately checks
 * only the violence-related categories, not the full category set —
 * this is a parenting forum where people need to be able to discuss
 * bullying, school-violence concerns, self-harm resources, etc.
 * Flagging on the full `flagged` boolean would block that legitimate
 * content; checking `violence` / `violence/graphic` specifically is
 * the version of this that actually matches what was asked for.
 *
 * Fails open on any error (missing key, network failure, non-200) —
 * an outage in a third-party moderation vendor shouldn't be able to
 * take down posting on the site.
 */
export async function containsViolentContent(text: string): Promise<boolean> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("OPENAI_API_KEY not set — skipping content moderation");
    return false;
  }

  try {
    const res = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ input: text, model: "omni-moderation-latest" }),
    });

    if (!res.ok) {
      console.error("OpenAI moderation request failed", res.status, await res.text().catch(() => ""));
      return false;
    }

    const data = await res.json();
    const categories = data?.results?.[0]?.categories ?? {};
    return Boolean(categories["violence"] || categories["violence/graphic"]);
  } catch (err) {
    console.error("OpenAI moderation check failed", err);
    return false;
  }
}
