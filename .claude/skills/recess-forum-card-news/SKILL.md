---
name: recess-forum-card-news
description: Builds and posts a daily Instagram "card news" image for Recess Forum (recessforum.com), sourced from a real post and reply on the live site, then publishes it to the @recessforum Instagram account via Claude in Chrome. Use this whenever the user asks to make today's card news, make/post a Recess Forum Instagram card, or do the daily Recess Forum marketing post — even if they just say "오늘 카드뉴스" or "인스타 올려줘" without spelling out the steps. Do NOT use this to design one-off marketing graphics unrelated to recessforum.com, or to post to any Instagram account other than @recessforum.
---

# Recess Forum daily card news

Turns a real question-and-answer from recessforum.com into a branded 1080×1350
(4:5) Instagram image and publishes it to @recessforum. This is a *marketing*
artifact, not fan fiction — the single rule that matters most here is:

**Never invent numbers or quotes.** No "47 people replied," no paraphrased
replies dressed up as quotes, no rounding a score up because it "reads
better." Pull the title, body, author display name, reply text, reply
author, score, and reply count straight from the live site right before you
build the card. The whole reason this content works as marketing is that
it's real — a fabricated stat is worse than no stat, and it undermines the
one thing a small, young community actually has going for it (authenticity).

## Step 1 — Find today's post

Recess Forum is small (a dozen-ish posts at any time), so browse rather than
guess:

1. Open `https://www.recessforum.com` and use the **Top** tab with the time
   range set to **All time** (not the default "This week" — the range filter
   silently hides older posts, including ones with real engagement).
2. Look for a post that has **at least one real reply** — a card with zero
   replies has nothing to quote and undercuts the "join the conversation"
   angle. (If nothing qualifies, a zero-reply post can still work with a
   *different* framing — see "Variant: nobody's answered yet" below — but
   prefer one with a reply when you have the choice.)
3. Click into the post (or find its id by matching titles against
   `https://www.recessforum.com/sitemap.xml`, then visiting
   `/post/<id>` directly) and read the real page. Record exactly:
   - Topic label (e.g. "Bullying") and its `categoryId` — see
     `references/category-colors.md` for how to map one to the other and get
     the right badge colors.
   - Post title/body (the question)
   - Author display name
   - Top reply's text and author display name
   - Score (upvotes) and reply count shown on the page
4. Don't reuse the same post/reply you used on a previous day's card — skim
   what's been posted to @recessforum recently (`instagram.com/recessforum/`)
   if there's any chance of a repeat.

## Step 2 — Build the card (1080×1350)

Copy `assets/card-template.html` and fill in the placeholders — don't design
from scratch each time, the template already matches the site's brand
(background `#F7F6F3`, navy `#26364A`, gold `#B08D45`, Inter font, the same
quote-mark/divider/footer layout used in the app's own
`app/opengraph-image.tsx` and `app/post/[id]/opengraph-image.tsx`).

The template's side padding (132px) is intentionally wide — Instagram's
profile grid (both the app and web) center-crops posts horizontally by
roughly 40-70px per side when displaying the thumbnail, which clips the
first letter or two of any text placed too close to the edge. Don't shrink
that padding back down even if the design looks like it has "extra" empty
margin at full size; that margin is what survives the grid crop.

Look up the topic's real color pair in `references/category-colors.md`
instead of picking a color that "feels right" — the badge should match the
color that topic actually has on the live site. If the reference looks
stale, the ground truth is `CATEGORY_COLORS` in `lib/taxonomy.ts`.

Render it to a PNG with headless Chrome (`scripts/render_card.sh` wraps this
— pass it the HTML path and an output path):

```bash
./scripts/render_card.sh /path/to/card.html /path/to/card.png
```

This runs:
```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --disable-gpu --hide-scrollbars \
  --window-size=1080,1350 \
  --screenshot=/path/to/card.png \
  "file:///path/to/card.html"
```

**Read the PNG back and look at it before moving on.** Check that text
isn't clipped/overflowing (long titles or replies can overrun the fixed
layout — shorten the excerpt or drop the font size a couple points rather
than letting it spill past the card edge), that the topic badge color looks
right, and that nothing reads as a placeholder.

## Step 3 — Write the caption

**Vary the wording and hashtags every time — don't reuse the same hook,
sentence structure, or hashtag set post to post.** A caption template
repeated verbatim reads as bot-made to both Instagram's ranking and to
actual followers, and it undercuts the whole point of this account (real
content, not a content mill). Before writing, skim the last 2-3 captions on
`instagram.com/recessforum/` and consciously pick a different opening line,
different phrasing for "here's what a parent said," and a different mix of
hashtags than what's already there — swap generic tags
(`#parentingtips`/`#momsupport`/`#parentlife`/etc.) as well as the
topic-specific ones. (The admin-dashboard version of this — `lib/cardNews.ts`
— does this by rotating through a handful of options per sentence, seeded by
post id; use that same spirit by hand, i.e. actually vary it, not just
technically change a word.)

Match the voice used so far: warm, plain-spoken, written like someone who
actually reads the forum — not corporate, not hypey. A reliable shape:

1. A one-line hook (often the emotional core of the question, or "Every
   parent has been there.")
2. 1–2 sentences restating the real question in your own words
3. 1–2 sentences summarizing the real reply's advice (paraphrase is fine
   here even though the card image itself must quote verbatim)
4. A call to action: "Got advice of your own? Join the conversation — link
   in bio."
5. A short, relevant hashtag line — mix broad parenting tags with the
   specific topic (`#parenting #parentingtips #parentcommunity
   #recessforum` plus 2-4 tags specific to the topic, e.g. `#bullying
   #schoolbullying` for a bullying post, `#IEP #specialeducation` for a
   special-ed one).

### Variant: nobody's answered yet
If you had to use a zero-reply post, don't pretend otherwise — flip it into
an invitation: "No one's answered this yet. Could you be the one who does?"
The image's "A PARENT REPLIED" section doesn't apply here; swap it for the
post body alone, larger, and adjust the caption to ask *your* followers to
go answer it.

## Step 4 — Publish to @recessforum

Use the `mcp__claude-in-chrome__*` tools (load them if not already loaded).
This account lives inside a Chrome profile that also has at least one other
Instagram account (a personal one, and possibly `mentodari`) logged in under
the same "Switch accounts" menu — **always confirm the active account is
`recessforum`** before uploading (top-right of instagram.com shows the
current account; click "Switch accounts" if it isn't recessforum).

1. Navigate to `https://www.instagram.com/`.
2. Click **Create → Post** in the left nav.
3. **Do not click "Select from computer"** — clicking it opens a native OS
   file picker that Claude cannot see or drive. Instead, use `find` to
   locate the hidden `<input type="file">` element in the dialog, then
   `file_upload` with `ref` set to that element and `paths` pointing at the
   PNG.
   - `file_upload` can only read from paths this session is allowed to
     read (its working directory, outputs, or an attached folder) — if the
     PNG was rendered somewhere else (e.g. `/tmp`), copy it into the current
     project's working directory first, upload from there, then delete the
     copy afterward (see cleanup below).
4. Click through **Crop → Next** (the 4:5 image is already the right
   aspect, no adjustment needed) **→ Edit/Filters → Next** (leave the filter
   on "Original" — the card is a finished design, not a photo) **→** the
   caption screen.
5. Click the caption field and type the caption from Step 3.
6. Click **Share**, then wait (a few seconds) for the "Post shared"
   confirmation dialog — don't consider it done until you see that, since
   the button click alone doesn't guarantee the upload finished.
7. Verify: check the post count went up and the new card is the first tile
   in the grid, **then open the actual published post and read its byline**
   with `get_page_text` (not just a screenshot of the compose dialog or
   confirmation toast). The active account can silently revert to the
   Chrome profile's primary account (this profile's primary is `mentodari`,
   not `recessforum`) after a page reload, so the compose dialog showing
   "recessforum" right before you click Share is *not* proof — confirm on
   the live post itself, every time. If a reload happens mid-workflow for
   any reason (including one you trigger to verify something else), re-open
   "Switch accounts" and confirm the checkmark is on `recessforum` before
   doing anything else that publishes content. If the wrong account posted,
   delete it immediately from that account (⋯ → Delete) and check the
   *other* account for the reverse mistake too before retrying.

Treat the **Share** click as the point of no return for this whole
workflow — get the image and caption right before that click, because
undoing a live Instagram post means going and deleting it by hand
afterward, not something to do casually.

## Step 5 — Clean up

- Close any extra Chrome tabs you opened for this (`tabs_close_mcp`).
- If you copied the PNG (or the HTML) into a git-tracked project directory
  to get around `file_upload`'s path restrictions, delete that copy once
  the upload is done — run `git status --short` afterward and confirm
  nothing stray is left staged or untracked.
