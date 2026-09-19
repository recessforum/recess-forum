# Recess Forum

A Reddit-style discussion forum for parents navigating their kids' education —
deliberately not split by school type (homeschool, public, private, etc. all
coexist), organized instead by topic categories that cut across school type,
grade level, and subject.

## Structure

- [`frontend/`](frontend/) — the original React artifact prototype, the
  handoff doc it shipped with, and the two brand SVGs. Kept for reference;
  not part of the running app.
- Everything else at the repo root is the real Next.js app (App Router,
  TypeScript, Tailwind v4, Supabase Auth + Postgres). This is what you run.
- [`schema.sql`](schema.sql) — the Postgres schema, applied to the live
  Supabase project (org "Recessforum", project `recess-forum`, account
  `recessforum@gmail.com` — a separate account/business from mentodari and
  FrameHonest on purpose, so it gets its own free-tier project quota).

## Circles (done)

User-created groups within the forum — not part of the fixed topic taxonomy
in `lib/taxonomy.ts`, which stays curated/finalized. Anyone logged in can
create a circle (name, description, optional state) and is auto-joined as
its first member. Circle membership gates *posting into* that circle
(enforced in RLS on `posts`, not just the API route — see `schema.sql`), but
circle posts are otherwise fully public: they show up in the main feed,
search, and to logged-out visitors exactly like any other post, just with an
extra circle badge. `/circles` lists and lets you join/leave circles;
`/circles/[id]` is a circle's own page with its description, member count,
join/leave, and its posts.

Deliberately *not* built (yet): private/members-only circle posts. If that's
wanted later it's a new visibility model on top of this, not a change to the
existing public-post behavior — see the comment on the `circles` table in
`schema.sql`.

Verified end-to-end with two real test accounts: created a circle (creator
auto-joined), posted into it, confirmed the post appears in the main feed
and search with both topic and circle badges, confirmed a second
non-member account sees "Join circle" (no post button) and — after
joining — gets "Leave circle" + a working "New post" button.

**Pinned post, circle context, editable topic.** A circle's creator can pin one
of their own posts in that circle (button on the post page, or on the circle
page); the pinned post always sorts first on `/circles/[id]`. It's stored as
`circles.pinned_post_id` (`on delete set null`, so deleting the post just
un-pins it) and written through `PUT /api/circles/[id]/pin`, which checks the
caller is the creator and the post is theirs and in that circle — the update
policy on `circles` enforces the same thing. Circle posts in the feed carry a
gold "Circle · name" badge, and the post page shows a "This post is from the
… circle" banner with a Join circle button (logged-out users get the sign-in
prompt). The author's Edit form on a post now also changes its topic
(`PATCH /api/posts/[id]` accepts an optional `topicId`, validated against
`lib/taxonomy.ts`).

To apply on a live database, run in the Supabase SQL Editor (before deploying
the code — the circle queries select `pinned_post_id`):

```sql
alter table circles add column pinned_post_id uuid references posts(id) on delete set null;
create policy "creators update their circles" on circles for update
  using (auth.uid() = created_by)
  with check (
    auth.uid() = created_by
    and (pinned_post_id is null or exists (
      select 1 from public.posts p
      where p.id = circles.pinned_post_id and p.circle_id = circles.id and p.author_id = auth.uid()))
  );
```

## Sharing (done)

Any post can be shared from the feed (icon on each row) and from the post page
("Share" / "Share this post"). `lib/share.ts` uses the OS share sheet in the
native apps (`@capacitor/share`) and on mobile browsers (`navigator.share`),
and falls back to copying the link on desktop. Shared links unfurl properly:
`app/post/[id]/layout.tsx` sets the page title/description/Open Graph tags from
the post, and `app/post/[id]/opengraph-image.tsx` renders a 1200x630 card
(topic or circle, title, site name). Logged-out visitors who land on a post get
a "Found this helpful? Sign up free" card so shares can convert into signups.
The card font only covers Latin text, so non-English titles won't render there.

## Running it

```bash
npm install
npm run dev
```

Opens on `http://localhost:3000` (or whatever port you pass with `-p`). Needs
a local `.env.local` with the real Supabase project URL and publishable key
(not committed to git — ask for the values if you don't have them).

## Deployment (done)

Live at **https://recess-forum.vercel.app**, deployed on Vercel from this repo's
`main` branch (auto-deploys on push). Vercel project is under the personal
`mentodari` account, not a separate team — Vercel's Hobby plan can't deploy
from a *private* GitHub org repo, so `recessforum/recess-forum` was made
public on GitHub rather than paying for Pro. The same
`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` values from
`.env.local` are set as Vercel environment variables (Production and
Preview) — both are the publishable anon key, safe to expose client-side.

Verified against the live URL, not just the build log: homepage renders and
loads the real (currently empty) Supabase-backed feed, and a bogus login
attempt correctly round-trips to Supabase auth and returns "Invalid login
credentials" — confirming prod is talking to the real project, not a stale
build.

**Custom domain (done)**: `recessforum.com` is connected in Vercel and live
alongside `recess-forum.vercel.app` (which still works). DNS is at IONOS:
an `A` record on `@` → `216.198.79.1` and a `CNAME` on `www` → the
per-project target Vercel issued, with the apex redirecting (308) to
`www.recessforum.com` per Vercel's recommended setup. Supabase's
Authentication → URL Configuration Site URL and Redirect URLs were updated
to `https://www.recessforum.com` (keeping the `recess-forum.vercel.app` and
`localhost:3000` entries too) so auth email links point at the real domain
going forward.

## Custom SMTP (done)

Supabase's default email sender has strict rate limits (a handful of
emails/hour) that would have started bouncing signup-confirmation emails
under any real signup volume. Replaced with **Resend** as a custom SMTP
provider (Supabase dashboard → Authentication → Emails → SMTP Settings:
host `smtp.resend.com`, port `465`, username `resend`, password a Resend
API key), sending from `noreply@recessforum.com`.

`recessforum.com` was bought specifically for this (separate from
mentodari/FrameHonest domains) and verified in Resend via 3 DNS records
added at the registrar (IONOS): one TXT (DKIM) and two CNAME records for
SPF/sending infrastructure.

**Real bug caught during setup** — after switching to Resend, confirmation
emails sent fine but the link in them led nowhere in production
("no site"). Cause: Supabase's Authentication → URL Configuration still
had the default **Site URL** of `http://localhost:3000` and **no Redirect
URLs** configured, so it had no allowed production destination to send
users to after confirming. Fixed by setting Site URL to
`https://recess-forum.vercel.app` and adding
`https://recess-forum.vercel.app/**` and `http://localhost:3000/**` as
allowed Redirect URLs. This is a separate failure mode from the SMTP
rate limit — email deliverability and post-confirmation redirect are two
independent things to get right, and only one of them fails loudly (a
bounced email vs. a link that silently goes to `localhost`).

Verified end-to-end against the live site (not just the SMTP dashboard
test): signed up with a real address, received the email via Resend,
clicked the confirmation link, and landed on the real site logged in.
Test accounts were deleted afterward.

## Auth (done)

Real Supabase Auth is live: email/password signup with email confirmation,
a nickname field (stored as `profiles.display_name`, decoupled from the
user's real name/email on purpose), login, logout. Posting, commenting, and
voting all require login and are attributed to the logged-in user's nickname
— there's no more free-text "Your name" field anywhere.

**Google sign-in (done)**: a Google Cloud project ("Recess Forum", under
`recessforum@gmail.com` — same separate-account pattern as the rest of this
project's infra) has an OAuth 2.0 Web client with authorized origins for
`recessforum.com`, `www.recessforum.com`, `recess-forum.vercel.app`, and
`localhost:3000`, and the redirect URI
`https://uslgoqpikanwmujcoxes.supabase.co/auth/v1/callback`. The Client
ID/Secret are entered into Supabase Dashboard → Authentication → Sign In /
Providers → Google, and both "Continue with Google" buttons
(`app/login/page.tsx` / `app/signup/page.tsx`) call
`supabase.auth.signInWithOAuth({ provider: "google" })` — no separate
callback handling was needed since `app/auth/callback/route.ts` already
handled the OAuth code exchange (it was written anticipating this).

The OAuth consent screen requested only the non-sensitive `email`,
`profile`, and `openid` scopes, and is published **"In production"**
(not just "Testing") so any Google account can sign in, not only
pre-approved test users — this needed a public privacy policy URL, which
didn't exist yet, so [`/privacy`](app/privacy/page.tsx) was added.

Verified end-to-end against the live site: clicking "Continue with Google"
on `recessforum.com/login` correctly redirects to Google's real sign-in
screen referencing the Supabase project, confirming the OAuth wiring
end-to-end (didn't complete a real sign-in with a personal account as part
of this verification).

**Known trigger gotcha, already fixed** — the `handle_new_user()` Postgres
trigger that creates a `profiles` row on signup originally failed with
`relation "profiles" does not exist` (42P01). `security definer` functions
run with a restricted `search_path`, so the unqualified `profiles` reference
didn't resolve. Fixed by adding `set search_path = public` to the function
and schema-qualifying the inserts as `public.profiles`. `schema.sql` already
reflects the fix — if this function is ever recreated by hand, don't drop
that clause.

## Database (done)

Posts, comments, votes, and view counts are on the real Supabase
`posts`/`comments`/`votes`/`post_views` tables — `lib/db.ts` no longer
touches the file-based dev store. Author info (`display_name`, `role`,
`expert_type`) is joined from `profiles` at read time and flattened onto
each `Post`/`Comment` (`author`, `authorId`, `authorRole`,
`authorExpertType`), so `lib/roles.ts` no longer needs the name-keyed
`rolesByAuthor` lookup the first auth-only pass used — `roleFor` is now a
pure mapping and `karmaFor`/`tierFor` key off `authorId`.

Voting and view-increment go through two Postgres functions
(`cast_vote`, `increment_post_view` in `schema.sql`) rather than plain
client-side inserts, so the score/view-count updates are atomic. **Both
derive the acting user from `auth.uid()` inside the function — never from a
caller-supplied parameter.** An earlier version took `p_voter_id`/
`p_viewer_id` as arguments; since these are `security definer` functions
reachable directly at `/rest/v1/rpc/<name>` under the public anon key, that
would have let anyone vote or record a view as anyone else just by passing
a different id. Caught and fixed before anything used it — don't
reintroduce caller-supplied identity into either function.

**Ambiguous embed gotcha, already fixed** — a bare `profiles(...)` embed on
`posts`/`comments` selects failed with PGRST201 ("more than one relationship
was found"), because each table has a second, indirect path to `profiles`
through `post_views`/`votes`. Fixed by naming the FK explicitly:
`profiles!posts_author_id_fkey(...)` / `profiles!comments_author_id_fkey(...)`
(see `POST_SELECT`/`COMMENT_SELECT` in `lib/db.ts`).

Demo/seed content did **not** carry over — the old seed posts (MiraP,
DKimFamily, etc.) had no matching Supabase accounts, and fabricating
`auth.users` rows for them wasn't worth the hack. The live database starts
empty; real signups create real content from here.

Verified end-to-end against the live Supabase project (not just typecheck/
build): signup → profile creation with chosen nickname → login → create
post → add comment → toggle a vote (1 → 0 → 1, confirming `cast_vote`'s
undo logic and that `auth.uid()` resolves correctly from a real session) →
karma/badge display. Test accounts and their data were deleted afterward.

## Admin review flow (done)

`/admin` (gated to `profiles.role = 'admin'`) lists pending Verified Expert
applications with Approve/Reject buttons. The API routes under
`app/api/admin/expert-applications/` check `isAdmin()` and then update
`expert_applications.status`/`reviewed_by`/`reviewed_at`, promoting
`profiles.role`/`profiles.expert_type` on approval. Authorization is RLS-based
(`auth.uid()` must own a `profiles` row with `role = 'admin'`) rather than a
service-role route — there's no service role key in this environment, and
Postgres ORs multiple policies for the same command together, so the
admin-only policies compose cleanly with the existing per-user ones.

**Real bug caught during cleanup** — `expert_applications.reviewed_by` had no
`ON DELETE` clause (default RESTRICT), so deleting an admin account was
silently blocked by every application they'd ever reviewed. Fixed to
`ON DELETE SET NULL` on the live DB and in `schema.sql`.

## File uploads (done)

Credential files (license, certification, ID) attached to a Verified Expert
application now go to a real private Supabase Storage bucket
(`expert-credentials`), not just a captured filename. The browser uploads
directly to `{auth.uid()}/{timestamp}.{ext}` using the user's own session —
storage RLS only allows writing under your own uid folder, and the API route
that records the application double-checks the path prefix server-side
before insert. Client-side validation caps files at PDF/JPG/PNG, 10MB.

Admins view an attachment via `/api/admin/expert-applications/[id]/file`,
which checks `isAdmin()` and redirects to a short-lived signed URL
(`createSignedUrl`, 5 min) — the file itself is never public. A third storage
policy lets any user with `profiles.role = 'admin'` `select` any object in
the bucket, so `createSignedUrl` succeeds for admins reviewing someone else's
file.

Verified end-to-end: uploaded a real PDF as a test applicant, confirmed the
object landed at the expected `{uid}/...` path, opened it as admin via the
signed-URL route, and approved the application.

## Email notifications (done)

Reply notifications only — the post/comment author gets a transactional
email when someone replies. (Topic-interest digest emails, the other half
of the original ask, are a separate feature: they need a "follow a topic"
concept that doesn't exist yet, so they're deferred rather than guessed at.)

Sending goes through a raw `fetch` to Resend's HTTP API (`lib/email.ts`) —
not the SMTP integration Supabase Auth uses for its own emails, and no
`resend` package dependency, just one POST. Needs `RESEND_API_KEY` (the
same key already used for Supabase's SMTP works fine).

Looking up the recipient's email needed a new **service-role Supabase
client** (`lib/supabase/admin.ts`, needs `SUPABASE_SERVICE_ROLE_KEY`) —
the app had none before this. `profiles` deliberately has no email column
(it's publicly readable via RLS, so putting email there would leak every
user's address to anyone); email only lives in `auth.users`, which only a
service-role client can read. This is the only place in the codebase that
uses a service-role client — every other read/write still goes through the
request-scoped, RLS-respecting client.

`profiles.email_notifications_enabled` (default `true`) is checked before
sending — no settings UI for it yet, so turning it off means updating the
column directly for now. The trigger site is `notifyOnComment()`
(`lib/notifications.ts`), called from the comment-creation route after the
comment is inserted; it never throws — a failed send logs and moves on
rather than failing the comment itself.

`RESEND_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are now set in Vercel
(Production and Preview). Verified against the live site after a redeploy:
one real account commented on another's post, and the notification email
actually arrived in the recipient's inbox — not just a 200 from the API.
Test accounts and the test post deleted afterward.

## Profile pictures (done)

`profiles.avatar_url` — set via a new public `avatars` Storage bucket
(unlike `expert-credentials`, this one's public: an avatar is meant to be
visible to anyone viewing a post, not gated behind auth). Same
own-uid-folder RLS pattern as credentials (write only under
`{auth.uid()}/...`), just with public `select` instead of self-and-admin.
Uploaded from `/settings`, at a fixed path (`{uid}/avatar.{ext}`, `upsert:
true`) so re-uploading replaces the old one instead of accumulating
orphaned files, with a cache-busting query param appended to the saved URL
so the new image shows immediately.

`components/Avatar.tsx` renders the image when `avatar_url` is set, or
falls back to a colored circle with the user's first initial — every
place an author's name shows (`PostRow`, `CommentNode`, the post detail
page, the header) now shows the avatar next to it.

## Report & block (done)

**Report** — a "···" menu (`components/AuthorMenu.tsx`) next to a post or
comment's author opens a reason picker (`components/ReportModal.tsx`) and
inserts a row into a new `reports` table. Admins review pending reports on
`/admin` (extended, not a separate page) and mark them reviewed or
dismissed — this doesn't automatically remove the reported content, just
queues it for a human to look at.

**Block** — also from the "···" menu. The interesting part isn't the
`blocks` table (blocker_id, blocked_id) — it's that `posts`/`comments`
select RLS changed from a bare `using (true)` to excluding rows whose
author you've blocked:
```sql
using (not exists (select 1 from public.blocks b where b.blocker_id = auth.uid() and b.blocked_id = posts.author_id))
```
Blocking someone hides their posts and comments everywhere — feed, search,
post detail — for free, with no changes needed to any query in `lib/db.ts`,
because the filtering happens at the database layer for every read that
uses the caller's own session. Logged-out visitors (`auth.uid()` is null)
are unaffected, since the subquery can never match. `/settings` lists
currently-blocked users with an unblock button — right now that's the only
way to manage blocks (no confirmation-free "quick block," a native
`confirm()` gates the action from the menu).

Verified end-to-end with two real accounts: uploaded an avatar and
confirmed it rendered everywhere the author's name appears; reported a
post and confirmed the row landed in `reports` with the right reporter/
reason; blocked the post's author and confirmed the post disappeared from
the feed, the post detail route started 404ing, and both reverted after
unblocking. Test accounts and data deleted afterward.

## Photo uploads on posts (done)

One optional photo per post — `posts.image_url`, set via a third public
Storage bucket, `post-images`, same own-uid-folder RLS pattern as
`avatars`. Uploaded from `NewPostModal` at post-creation time (no
edit-after-the-fact yet — a post's photo is set once, when it's created),
with client-side validation (JPG/PNG/WEBP, 8MB max) and a local preview
before upload. Shown as a thumbnail under the post body in the feed
(`PostRow`) and full-width on the post detail page.

Verified end-to-end: uploaded a real image through the actual `NewPostModal`
UI (not just the API), confirmed the file landed in `post-images` at the
expected `{uid}/{timestamp}.ext` path, confirmed the URL is publicly
fetchable, and confirmed it renders both on the post detail page and as a
feed thumbnail. Test account and data deleted afterward.

## Violent-content filter (done, needs `OPENAI_API_KEY`)

Posts and comments are checked against OpenAI's Moderation API
(`lib/moderation.ts`, `omni-moderation-latest`, a raw `fetch` — no new npm
dependency, same pattern as `lib/email.ts`) before they're inserted. Only
the `violence` and `violence/graphic` categories are checked, deliberately
narrower than the API's full `flagged` verdict — this is a parenting forum
where people need to be able to describe bullying, school-violence
concerns, or self-harm resources without getting blocked. A flagged
submission is rejected with a 422 and a message suggesting a rephrase; the
title+body are checked together for posts, the body alone for comments.
Both `NewPostModal` and the comment/reply UIs (`CommentNode`, post detail
page) surface that message inline instead of silently closing.

Fails open: if `OPENAI_API_KEY` is missing or the API call errors, the
content is allowed through rather than blocking all posting on a
third-party outage. **The key needs to be added to `.env.local` locally
and to Vercel's environment variables before this actually filters
anything** — until then every submission passes through unchecked.

Verified end-to-end against the real OpenAI API (after adding billing to
the OpenAI org — new accounts get throttled to 429 on every request,
including the free Moderation endpoint, until a payment method is on
file): "우리 애 학교에서 괴롭힘당해서 걱정되어요" (legitimate bullying
concern) → allowed; "죽여버릴거야" (explicit violent threat) → blocked,
matching the two examples approved when this feature was scoped. The
reject/allow branching and the UI error surfacing were separately
exercised with a temporary stub before the key existed (reverted before
commit); `tsc`/`next build` both pass.

## Public author profile pages (done)

Clicking an author's name/avatar anywhere (feed rows, post detail, comments)
links to `/u/[id]` — a public page showing their avatar, display name,
role/tier badges, karma, post + comment counts, join date, and a list of
their posts. Tier and karma are computed the same way as everywhere else
in the app: client-side from the full `/api/bootstrap` posts/comments
payload (`lib/roles.ts`), not a new server-side calculation. The profile's
identity fields (display name, avatar, role, join date) come from a new
`getProfile()` in `lib/db.ts` / `GET /api/profiles/[id]`, since those
should render even for a brand-new user with zero posts yet — deriving
them only from bootstrap data would leave that case with nothing to show.

Blocked authors behave the same way blocking already worked elsewhere:
their posts/comments are filtered out by the existing RLS policies before
they ever reach the client, so a blocked author's profile just shows 0
posts rather than exposing hidden content.

Verified end-to-end with a disposable Supabase-created test account: made
a post, clicked the author name from the feed row (confirmed it opens the
profile instead of falling through to the post-detail click handler) and
from the post detail page, and confirmed the profile page showed the
correct karma/post count/join time. Test account and its post deleted
afterward.

## Nickname prompt on first sign-in (done)

Google sign-in never supplied a `display_name`, so `handle_new_user()`
silently fell back to an auto-generated `user_xxxxxxxx` name with no way
for the person to pick their own — the email/password flow was fine since
`signup/page.tsx` collects a nickname up front and passes it as signup
metadata. Fixed with a new `profiles.nickname_set` boolean: the trigger
now sets it `true` only when signup metadata actually supplied a name
(email/password path), `false` otherwise (Google path, or any other
account-creation route that doesn't collect one). `auth/callback/route.ts`
checks it after exchanging the OAuth code and redirects to a new
`/welcome` page instead of home when it's `false`; `/welcome` posts to a
new `POST /api/profile/nickname` (`updateDisplayName()` in `lib/db.ts`),
which sets both `display_name` and `nickname_set = true`, surfacing a
"that nickname is already taken" error on a unique-constraint collision
(`profiles.display_name` is unique).

Verified against real production data, not just a synthetic case: a
disposable Supabase-created test account (no metadata, matching the
Google-signup shape) landed on `/welcome` logic with `nickname_set =
false` as expected; submitting a nickname flipped it to `true` and
updated `display_name`, confirmed by querying `profiles` directly.
Submitting an already-taken name (`user_9ad46771`, another account's
existing auto-generated name) correctly surfaced the "already taken"
error instead of silently succeeding.

**This also surfaced a live-data issue, since backfilled**: every real
account that existed at the time this shipped (all via Google) had
`nickname_set = false` and was walking around the site as `user_xxxxxxxx`
— Supabase's own Auth dashboard showed their real Google name only
because it separately reads OAuth-provided metadata, which was never
carried into `profiles.display_name`. Backfilled with a one-off SQL block
(`coalesce(raw_user_meta_data->>'full_name', ->>'name')` per account,
falling back to the trigger's own `<name>_<id prefix>` disambiguation on a
collision — two accounts really were both "Steven Kim" at the time), then
manually renamed the one collision that landed awkwardly. Went smoothly
because there were only 5 accounts; a later, larger-scale version of the
same problem would need the same query but should announce the rename
rather than doing it silently.

## Post edit/delete, optional post body, thumbs vote icons (done)

Three small changes bundled together:

- **Edit/delete your own posts** — `PATCH`/`DELETE /api/posts/[id]` (new
  `updatePost()`/`deletePost()` in `lib/db.ts`), with the author check done
  twice: once explicitly in the route (for a clean 403 with a real message)
  and again for real by two new RLS policies (`authors update/delete their
  own posts`, `auth.uid() = author_id`) — the route check is a UX nicety,
  the DB policy is what actually stops a spoofed request. The post detail
  page shows inline "Edit"/"Delete" text buttons instead of the report/block
  menu when `profile.id === post.authorId`; Edit swaps the title/body into
  an editable input+textarea in place, Delete confirms then redirects home.
- **Post body is now optional** — `posts.body` dropped its `not null`
  constraint; creating a post only requires a title. `NewPostModal`'s
  Details field is labeled "(optional)"; every place that rendered
  `post.body` (`PostRow`, post detail, the client-side search filter in
  `app/page.tsx`) now guards for `null` instead of assuming a string.
- **Vote icons are thumbs up/down**, not arrows (`VoteControl.tsx`) — same
  score/toggle logic, `ThumbsUp`/`ThumbsDown` from lucide-react instead of
  `ArrowUp`/`ArrowDown`, with the active direction rendered filled.

Verified end-to-end with a disposable test account: created a title-only
post (body left blank, submit button confirmed enabled without one),
edited both its title and body in place and confirmed the change survived
a reload, deleted it and confirmed `/post/[id]` then 404ed. Also confirmed
the ownership check for real — direct `PATCH`/`DELETE` calls against
another real user's post both correctly returned 403 rather than silently
no-op'ing or succeeding.

## Profile tabs (posts/replies) and change-nickname (done)

Two small additions to things already built this session:

- **Profile page has Posts/Replies tabs** (`/u/[id]`) — the post/reply
  counts in the stats row are now clickable tabs instead of static text.
  Replies is a flat, newest-first list of the person's comments (comments
  don't have their own detail page, so each row links to `/post/[id]` and
  shows which post it's replying to, using `allPosts` from the same
  bootstrap payload already fetched for the page — no new endpoint).
- **Change your nickname any time**, not just at `/welcome` — a Nickname
  field on `/settings` reusing the same `POST /api/profile/nickname` built
  for the first-sign-in prompt. Renaming is retroactive for free: author
  name is joined from `profiles` at read time rather than stored on each
  post/comment, so an existing reply immediately shows the new name with
  no migration needed.

Verified with a disposable test account: replied to a real post, opened
its own `/u/[id]`, confirmed "0 posts · 1 reply" and that clicking the
reply tab showed the comment linking back to the right post; changed its
nickname in Settings and confirmed the header updated immediately and the
already-posted reply displayed the new name on reload.

## Fixed: voting silently never worked (bug, not a feature)

The user reported votes from several real accounts "disappearing." They
hadn't — they never landed. `cast_vote()`'s `RETURNS TABLE(score integer,
dir smallint)` makes `score` an in-scope plpgsql variable for the whole
function body, which collided with the `posts`/`comments` table column of
the same name inside `update ... set score = score + v_delta`. Postgres
can't guess which `score` the right-hand side means and throws `42702
column reference "score" is ambiguous` — on every single call,
unconditionally. `lib/db.ts`'s `vote()` does `if (error) throw error`,
`POST /api/vote` never catches it, and every `handleVotePost`/
`handleVoteComment` call site fires the request without checking
`res.ok` — so the UI's optimistic score bump was the *only* place a vote
ever showed up. A real vote's INSERT into `votes` succeeded fine (that
statement has no ambiguity), so the table has an accurate history; only
the `posts.score`/`comments.score` counters were silently stuck at
whatever `createPost`/`addComment` initialized them to.

Fixed by qualifying the column with the table alias
(`update public.posts as p set score = p.score + v_delta ...`), which
resolves the ambiguity. Also backfilled every existing post/comment's
`score` from `sum(votes.dir)` — the votes table was correct the whole
time, just never read back into the counter.

**This means the site has never had a working like/upvote counter in
production**, from the day this table and function were written. Worth
being deliberate next time a `RETURNS TABLE` column name is chosen — pick
something that can't collide with a real column, or qualify defensively
from the start, rather than relying on it happening not to be needed.

Verified: reproduced the exact 42702 error live (disposable test account,
direct `fetch('/api/vote', ...)`, read the dev server's stack trace) before
touching anything, confirmed the theory instead of guessing. After the
fix, re-ran the same call and got a real `{score, dir}` response; tested
the full up→down→toggle-off cycle on both a post and a comment; then a
project-wide query confirming zero remaining posts/comments where `score
<> sum(votes.dir)`. Test account and its test votes cleaned up after
(each toggled fully back off, leaving no residue in either table).

## "View my posts & replies" link on Settings (done)

The Posts/Replies tabs on `/u/[id]` (see "Profile tabs" above) were only
reachable by clicking someone's author name on a post or comment — there
was no way to reach *your own* profile page if you hadn't done that, so
the feature existed but had no discoverable entry point. Added a "View my
posts & replies" link next to the Settings heading, pointing to
`/u/{profile.id}`. No new logic — just a link to the page that already
had the list.

Verified with a disposable test account: logged in, opened Settings,
clicked the link, landed on `/u/[own id]` showing accurate "0 posts · 0
replies" (the account hadn't posted). Test account deleted afterward.

## Sidebar redesign — Nationwide/Local grouping (done)

Applied the sidebar proposal from `Recess_Forum_Sidebar_Proposal_KO.docx`
(written by 진욱, a discussion draft — not a final spec, and it says so).
`lib/taxonomy.ts`'s `Category` now carries a `scope: "nationwide" | "local"`
and an optional `tooltip`; both `Sidebar.tsx` and `MobileTopicDrawer.tsx`
group categories under NATIONWIDE/LOCAL subheadings instead of one flat
list.

- **Location picker moved inside the sidebar**, nested under the LOCAL
  heading instead of floating at the top of the whole page — visually
  ties it to the categories it actually filters, per the doc's stated
  problem #1. It collapses to a "📍 California ▾ · saved for next visit"
  chip once set, persisted in `localStorage` (`recess-forum:state`) and
  restored on load; clicking the chip reopens the picker to change it.
  It's still a native `<select>`, not a custom autocomplete combobox —
  that gets you most of the same result (type a state name to jump to
  it) without building a new component from scratch; a real typeahead
  combobox is still open if the plain select ever feels insufficient.
- **Hover tooltips** on the three categories the doc calls out as
  ambiguous (Academics & Curriculum, Support Needs, Wellbeing & Social),
  using its exact English tooltip text. Hover on desktop; tap the (i) icon
  to toggle on mobile, since there's no hover there.
- **"New" tag replaces raw counts** — the sidebar never actually showed
  post counts before this (there was nothing to remove), so this
  directly implements the doc's own argument against raw counts at
  this stage (a "0" or "1" next to every category reads as "no one's
  here"): a small red "New" badge appears on a category only if one of
  its topics got a post in the last 7 days; everything else stays quiet.
  This resolves one of the doc's open questions (count vs. New tag) in
  the direction its own reasoning points, since it's explicitly still
  a "discuss with 동은" item, not a settled decision.
- **Mobile drawer breakpoint moved to 720px** (was Tailwind's default
  `md`, 768px) via a Tailwind v4 `@theme` custom breakpoint
  (`--breakpoint-drawer`) in `globals.css`, replacing every `md:` on the
  sidebar/drawer pair with `drawer:`. The doc's own open question 4 asks
  whether 720px is right against real traffic — it's a best-guess number
  from the doc, not verified against this site's actual visitors.

**Also split out two categories the doc didn't ask for, per direct
request**: "Special Education" and "Homeschooling" were sub-topics buried
inside "Support Needs" and "School Types" respectively; both are now
their own top-level categories (each still holding just that one topic),
classified Local for the same state-variance reasoning the doc already
gives for IEP/504 process and school-type rules. Existing posts needed no
migration — topic ids (`special-ed`, `homeschool`) didn't change, only
which category object they live under, so `categoryOf()` resolves old
posts into the new categories automatically.

The doc's own open questions (§6) are left open, not decided here:
whether Academics & Curriculum should be split further, the exact "New"
window (used 7 days as written), whether all 9 original categories
should get tooltips instead of just 3, and the 720px breakpoint choice.

Verified in-browser at both desktop and mobile widths against real
production data: Nationwide/Local grouping renders correctly, the two
new categories show their own topics/colors, tooltips fire on hover
(desktop) and tap (mobile) with the exact doc text, the location chip
collapses/persists and survives a full reload, "New" badges appeared
exactly on categories with a post in the last 7 days (confirmed against
real recent posts), and the topic pill row / category filter click-through
all resolve correctly for the two new categories.

## Apple App Store compliance audit (done, code side)

Before wrapping Recess Forum as a mobile app, audited it against the
specific App Store review rejections a sibling project (Mentodari) actually
hit, rather than guessing at Apple's guidelines in the abstract. Found and
fixed four real gaps:

**1. Report/Block missing from author profiles (Guideline 1.2, User-Generated
Content)** — `components/AuthorMenu.tsx` (Report/Block) was already wired
into posts and comments but not onto the author profile page itself
(`/u/[id]`) — the exact shape of gap that got Mentodari's UGC review
rejected twice. Added `AuthorMenu` to the profile page header (hidden on
your own profile, same as everywhere else). This needed a new `"user"`
`target_type` on the `reports` table (previously only `'post'`/`'comment'`)
— `schema.sql`'s check constraint, `lib/types.ts`'s `ReportTargetType`, the
`/api/reports` route, and `/admin`'s report list (now links to the profile
for a `user` report) were all updated. **The live database's `reports`
check constraint still needs a one-time manual update** — this repo has no
migration runner, so run this once in the Supabase SQL Editor:
```sql
alter table reports drop constraint reports_target_type_check;
alter table reports add constraint reports_target_type_check check (target_type in ('post', 'comment', 'user'));
```

**2. No in-app account deletion (Guideline 5.1.1(v))** — added a "Danger
zone" section to `/settings` with a type-"DELETE"-to-confirm flow, backed by
a new `DELETE /api/account` route (`app/api/account/route.ts`) that calls
`supabase.auth.admin.deleteUser()` via the existing service-role admin
client (`lib/supabase/admin.ts`, already used for email notifications).
Deleting the `auth.users` row cascades through `profiles` and every table
that references it (`posts`, `comments`, `votes`, `reports`, `blocks`,
etc. — all already `on delete cascade` in `schema.sql`), so this is a real
hard delete, not a soft-delete/anonymize — appropriate here since, unlike
Mentodari, there are no payment or booking records tied to a user that
would need to survive their deletion. While testing this locally we hit a
real bug: a failed request whose body isn't valid JSON (e.g. the plain 500
Next.js returns when `createAdminClient()` throws before producing a JSON
response) left the delete button spinning forever because `res.json()`
itself threw, unhandled. Fixed with a `try/catch` around the fetch and a
`.catch()` on the JSON parse, and the API route now catches
`createAdminClient()`'s own throw instead of letting it crash the handler.

**3. No Terms of Use / signup consent gate (mirrors Mentodari's `e37f6c8`
fix)** — added `/terms` (`app/terms/page.tsx`, same structure as the
existing `/privacy` page: community standards, content ownership, account
termination, no-warranty, contact). `/signup` now has a required "I agree
to the Terms of Use and Privacy Policy" checkbox that gates both the
email/password submit button and the Google sign-in button (unchecked =
both disabled). `/privacy`'s "Your choices" section was updated to point at
the new self-service deletion instead of "email us."

**4. No Sign in with Apple (Guideline 4.8 — parity with existing Google
Sign-In)** — added a "Continue with Apple" button to `/login` and `/signup`
(gated by the same consent checkbox on signup), calling
`supabase.auth.signInWithOAuth({ provider: "apple" })`. The existing
`/auth/callback` route already handles the OAuth code exchange
provider-agnostically (it was written for Google but never assumed a
specific provider), so no backend change was needed there. **This can't be
fully wired up without manual dashboard work only the account owner can
do**: create a Services ID + Sign in with Apple key in the Apple Developer
Portal (Certificates, Identifiers & Profiles → Identifiers), then paste the
Services ID, Team ID, Key ID, and private key into Supabase → Authentication
→ Providers → Apple. Until that's done, the button is live in the UI but
the OAuth flow will fail at Supabase.

Not done yet, deliberately deferred to when the native shell exists:
genuine native functionality for Guideline 4.2 (Minimum Functionality —
likely native share at minimum, mirroring Mentodari's `@capacitor/share`)
and camera/photo-library `Info.plist` usage strings (depends on which
Capacitor plugins end up handling avatar upload).

## Mobile app — Capacitor wrapper (done, code side)

Wraps the live production site as an iOS/Android app, following the same
architecture already proven on a sibling project (Mentodari): **Capacitor**
around the real deployed `www.recessforum.com`, not React Native, not a
static export, and not a full native rewrite. The app is a thin native
shell around a `WKWebView`/`WebView` pointed at the production URL
(`capacitor.config.ts`'s `server.url`) — the Next.js app itself needed no
changes to be wrapped, and shipping a new mobile build isn't needed to ship
a normal site update; only native-shell changes (new plugins, icons,
permissions) need a resubmission.

`ios/` and `android/` are real native projects (`npx cap add ios` /
`npx cap add android`), committed to the repo (build output —
`ios/App/Pods`, `ios/App/build`, `android/app/build`, `android/.gradle` —
is gitignored, the projects themselves are not). `mobile/www/index.html` is
an unused placeholder Capacitor requires as a local `webDir` even though
`server.url` means it's never actually shown.

**Native functionality (Guideline 4.2, Minimum Functionality)** — added
`@capacitor/share` and wired a native Share button onto the post detail
page (`app/post/[id]/page.tsx`). It checks `Capacitor.isNativePlatform()`
first so the same code works on the plain website too: native share sheet
in the app, `navigator.share()` in browsers that support it (mobile Safari/
Chrome), and a "copy link to clipboard" fallback everywhere else — verified
all three states render/behave correctly, including a real bug caught
while testing the clipboard fallback (an unhandled promise rejection when
`clipboard.writeText` throws, e.g. no clipboard permission — now wrapped in
`try/catch`).

**Camera/photo library usage strings (`Info.plist`)** — added
`NSCameraUsageDescription` and `NSPhotoLibraryUsageDescription` up front,
since the existing avatar/post-photo `<input type="file" accept="image/*">`
can trigger the OS camera/photo picker inside the webview, and a missing
usage string there crashes the app instead of showing a permission prompt.

**Verified end-to-end in the iOS Simulator**, not just "the files got
generated": `xcodebuild -scheme App build` for `iphonesimulator` — **build
succeeded** (Capacitor 8 resolves its plugins via Swift Package Manager, so
no CocoaPods/`pod install` step was needed, unlike older Capacitor
versions/Mentodari's original setup). Installed and launched the built
`.app` with `xcrun simctl install` / `launch`, then screenshotted it with
`xcrun simctl io screenshot` — the real production Recess Forum homepage
rendered correctly inside the native shell, mobile drawer layout and all.
The Android project was added the same way and structurally mirrors the
verified iOS one. **Later verified for real** by installing a JDK and the
Android SDK directly (no Android Studio) — a portable Temurin 21 JDK
(Capacitor's Android module targets Java 21; a first attempt with 17 failed
with `invalid source release: 21`), then the Android `cmdline-tools`
(`sdkmanager --licenses`, then `platform-tools`, `platforms;android-36`,
`build-tools;36.0.0`), pointed at via `android/local.properties`
(gitignored, machine-specific). `./gradlew assembleDebug` — **build
successful**, producing a real signed debug APK
(`android/app/build/outputs/apk/debug/app-debug.apk`); `aapt dump badging`
against it confirmed the package name (`com.recessforum.app`), app label
("Recess Forum"), min/target SDK, and the `INTERNET` permission the webview
needs to reach `recessforum.com` are all correct. An actual emulator boot
(for iOS-Simulator-equivalent visual proof) was attempted — AVD created,
system image installed — but this machine's available disk space (a few
GB) is below what even a shrunk userdata partition needs (Android wants
7+GB regardless of the configured partition size, a known emulator
quirk/limit, not something fixable via `-partition-size` or
`config.ini`), so it was abandoned rather than fought further; the
emulator and system image downloads (~5GB) were removed afterward since
they weren't usable here, keeping just the SDK components the build
itself needs.

Bundle ID: `com.recessforum.app` (matches the `com.<brand>.app` pattern
Mentodari uses). Not done yet: an actual App Store/Play Store submission
(screenshots, listing copy, review notes) — this is a locally-verified
native wrapper, not a submitted app.

### App icon and launch screen (done)

Generated from the site's existing bell mark (`components/RecessMark.tsx`,
also `app/icon.svg`) rather than a new design — same navy (`#26364A`)/
cream (`#F7F6F3`)/gold (`#B08D45`) the header logo already uses, so the
home-screen icon and launch screen look like an extension of the site, not
a separate default-Capacitor placeholder (which is what Mentodari's own
launch screen still is — its icon was customized but its splash was never
touched, so it wasn't a template to copy here). The first pass was just the
cream bell directly on navy — too dark and flat once actually seen at icon
size, so the app-specific mark (`assets/logo.svg`, kept separate from the
site's own `RecessMark`/`icon.svg` rather than changing those) adds a thick
gold circle behind the bell, and switches the bell's clapper from gold to
cream so it doesn't disappear into that same-colored circle behind it.

`assets/logo.png` (1024×1024, transparent background, the bell scaled and
padded to stay inside the safe zone Android's adaptive-icon mask crops to)
is the single source image, run through `@capacitor/assets` in "easy mode"
to generate every iOS/Android icon and splash size:
```shell
npx @capacitor/assets generate --ios --android \
  --iconBackgroundColor '#26364A' --iconBackgroundColorDark '#26364A' \
  --splashBackgroundColor '#26364A' --splashBackgroundColorDark '#26364A' \
  --logoSplashScale 0.75
```
(`@capacitor/assets` itself isn't kept as a dependency — it pulls in an old
bundled `sharp`/`node-tar` with known CVEs, harmless for a one-off local
generation step but not worth carrying in `package-lock.json` permanently;
reinstall it with the command above whenever the icon/splash need
regenerating, then remove it again.) `--logoSplashScale` needed hand-tuning
by actually measuring the output, not just trusting the flag name: it
scales the whole 1024×1024 *source canvas* (including the transparent
padding around the bell) to that fraction of the splash width, not the
bell's own visible size — `0.2` (the tool's default) rendered a bell too
small to read on a 2732px canvas, and `0.6` was still only ~8% of the
canvas width once the math was worked through; `0.75` lands the bell at a
legible ~29%. `--iconBackgroundColorDark`/`--splashBackgroundColorDark` are
set to the same navy as the light variants — the site has no separate dark
theme design, so light/dark app icons and launch screens intentionally
look identical rather than guessing at a second palette.

Verified by rebuilding and reinstalling on the iOS Simulator and inspecting
the generated files directly (`AppIcon-512@2x.png`, the `Splash.imageset`
PNGs) rather than trusting the generator output blindly — confirmed the
bell renders correctly on the navy background at both icon and splash
sizes. One known, low-priority gap: the legacy (pre-Android-8.0,
API < 26) non-adaptive `ic_launcher.png` came out of the generator with a
transparent background instead of navy baked in (the modern adaptive icon
`mipmap-anydpi-v26/ic_launcher.xml`, which is what essentially every real
device in 2026 actually uses, is correct — background and foreground
layers composite properly). Not fixed, since it only affects devices
Android has not shipped in 8+ years.

### OAuth sign-in inside the app — Universal Links / App Links (done, code side)

Discovered while explaining how to set up Sign in with Apple: OAuth
sign-in (Google, and the new Apple button) doesn't actually work usably
*inside the wrapped app* without this. Capacitor's own navigation-handling
code
(`node_modules/@capacitor/ios/Capacitor/Capacitor/WebViewDelegationHandler.swift`)
confirms it — a top-level navigation to a host outside
`capacitor.config.ts`'s `allowNavigation` (which `appleid.apple.com` and
`accounts.google.com` both are) gets cancelled in the app's webview and
handed to `UIApplication.shared.open()`, i.e. kicked out to system Safari.
The user *can* complete sign-in there, but Supabase's redirect back to
`https://www.recessforum.com/auth/callback` then just loads in Safari too
— stranding them logged into the website in Safari while the app itself
stays logged out, with no way back short of manually switching apps. This
was a pre-existing gap in the already-shipped Google sign-in, not
something the new Apple button introduced — it just hadn't been tested
inside the native wrapper before.

The fix is Universal Links (iOS) / App Links (Android): register
`/auth/callback` as a link the OS hands to the app instead of the browser,
then have the app's own JS point its webview at that URL when it arrives.
Three pieces, all now in place:

Confirmed this was worth fixing (not just a theoretical Apple-only concern)
by actually tapping "Continue with Google" inside a real build running in
the iOS Simulator: the app handed off to system Safari exactly as
predicted, showed the real `accounts.google.com` sign-in page, and
returning to the app afterward left it still logged out — the existing
Google sign-in has had this problem the whole time, just never tested
inside the native wrapper before now.

1. **Domain association files**, served from the real site so Apple/Google
   can verify the app is allowed to claim this domain:
   - `app/.well-known/apple-app-site-association/route.ts` — a route
     handler, not a static file, because the path has no extension (that's
     required, not a mistake) and a route handler makes it trivial to get
     the `application/json` content-type right. `TEAM_ID` is filled in with
     the real Apple Developer Team ID (`623K9BU5H6`, from the account's
     Membership page).
   - `public/.well-known/assetlinks.json` — lists two SHA256 certificate
     fingerprints: the debug keystore's (`~/.android/debug.keystore`, for
     local testing) and a real release key's, generated specifically for
     this (`keytool -genkeypair`, RSA 2048, 25-year validity, kept at
     `~/keys/recessforum/recessforum-release.keystore` — **outside the
     repo, never committed**, since losing track of a release signing key
     means never being able to publish an update under the same app
     identity again). The release build is wired to actually use it:
     `android/app/build.gradle` reads `android/keystore.properties`
     (gitignored — holds the keystore path and passwords) into a
     `signingConfigs.release` block, applied to `buildTypes.release`, with
     the whole thing gated on the properties file existing so a machine
     without it still builds an (unsigned) release APK instead of failing.
     Verified for real, not just assumed correct: ran `gradlew
     assembleRelease` and checked the output with `apksigner
     verify --print-certs` — the produced APK's certificate SHA-256
     digest matches the one now in `assetlinks.json` exactly. `gradlew
     assembleDebug` was re-run afterward too, confirming the signing
     changes didn't disturb the debug build.
2. **Native declarations** that a link to `/auth/callback` should try the
   app first:
   - iOS: `ios/App/App/App.entitlements` (new file, `applinks:` for both
     `recessforum.com` and `www.recessforum.com`), wired into
     `App.xcodeproj/project.pbxproj` via `CODE_SIGN_ENTITLEMENTS` on both
     the Debug and Release build configurations.
   - Android: an `android:autoVerify="true"` intent-filter added to
     `MainActivity` in `AndroidManifest.xml` for `https://` +
     `(www.)recessforum.com/auth/callback` — verified compiled correctly
     into the built APK via `aapt dump xmltree`.
3. **The actual hand-off**, since Capacitor only delivers a matched link as
   an `appUrlOpen` JS event — it doesn't navigate the webview itself. Added
   a listener in `lib/auth-context.tsx` (already a client-side, app-wide
   mounted provider) that does `window.location.href = url` on that event,
   gated by `Capacitor.isNativePlatform()` so it's a no-op on the plain
   website.

**What could and couldn't be verified here.** The `.well-known` routes
were confirmed serving correct JSON locally. The Android manifest change
was confirmed correctly compiled into a real `gradlew assembleDebug` APK.
The iOS entitlements file turned up a real limitation while wiring it in:
rebuilding after adding `CODE_SIGN_ENTITLEMENTS` still produced an *empty*
entitlements blob in the signed binary (`codesign -d --entitlements`
confirmed it) — because this project has automatic signing with no real
Apple Developer Team selected, so Xcode has no provisioning profile to
validate the Associated Domains capability against, and silently drops it.
**Manual step required**: open `ios/App/App.xcodeproj` in Xcode, select a
real Development Team under Signing & Capabilities, and add the
"Associated Domains" capability there (Xcode will pick up the
already-correct `App.entitlements` file and register the capability with
Apple automatically once a team is attached). Beyond that, Universal Links
fundamentally **cannot be verified in the iOS Simulator** at all, by
Apple's own design — only a real device performs the CDN-based domain
verification — so this needs a real-device test once the Team ID and
Xcode capability are both in place.

### Pre-submission App Store review audit, round two (done)

With the code-side fixes and Apple/Supabase configuration both done, ran a
second, independent pass looking past the Mentodari-derived checklist for
anything else that could cause a rejection — reasoning from Apple's actual
guideline numbers against this app specifically, not just re-confirming
what was already fixed.

**Cleared, no action needed:**
- **Guideline 3.1.1 (In-App Purchase)** — traced the "Become a Verified
  Expert" flow end to end (`components/ExpertApplicationModal.tsx`,
  `app/api/expert-applications/route.ts`, the admin approve/reject routes)
  and grepped the whole repo for `stripe|payment|checkout|subscription|
  paywall|iap` — there is no monetization surface anywhere in the app
  today. This matters specifically because 3.1.1 is the guideline that got
  Mentodari rejected before, so it needed real verification, not an
  assumption. (Two things are planned for later — a possible subscription
  on the Verified Expert tier, and ads roughly 6 months post-launch —
  neither exists yet; whichever ships first needs this guideline
  re-checked before that release, since a paid tier sold inside the app
  would need real Apple In-App Purchase, not an external processor.)
- **Guideline 5.1.1 (forced sign-in)** — confirmed `app/page.tsx` and
  `app/post/[id]/page.tsx` fetch and render posts/comments with no auth
  gate; login is only enforced at interaction points (voting, posting).
  Browsing works fully logged out.
- **Guideline 1.1.6/1.2 content moderation** — the violence-only automated
  filter plus report/block/admin-review-queue is the same shape most
  Reddit-style UGC apps ship with (human review as the backstop, not full
  automated pre-screening of everything) — treated as normal for this
  category, not a rejection risk on its own.

**Fixed as a result of this pass:**
- `app/privacy/page.tsx` only documented Google Sign-In and didn't mention
  Apple Sign-In, OpenAI, or Resend at all — a real accuracy gap given
  Apple Sign-In is a headline part of this exact submission. Added Apple
  to the sign-in paragraph and a new "Third parties that process data on
  our behalf" section naming Supabase, Resend, OpenAI, and Google/Apple
  explicitly.
- `app/post/[id]/page.tsx`'s native share path (`Share.share(...)` inside
  the `Capacitor.isNativePlatform()` branch) had no `try/catch`, unlike
  the `navigator.share` fallback right below it — a cancelled or failed
  native share would throw unhandled. Wrapped it the same way.
- `app/login/page.tsx` and `app/signup/page.tsx`'s Google/Apple sign-in
  handlers had no error handling or loading state at all — a network
  failure during OAuth kickoff left the button looking like it silently
  did nothing, which is exactly the kind of thing that looks "broken" to
  an App Review tester on a flaky connection. Both now show a spinner
  while the OAuth redirect is being requested and a visible error message
  if it fails, matching the existing email/password form's error handling.


The prototype's design, copy, taxonomy, and interaction model are final
product decisions (see `frontend/recess-forum-handoff.md` §4, §6, §8) and
were ported faithfully.

| Thing | Prototype (artifact) | This app | Real product needs |
|---|---|---|---|
| Auth | None — "Your name" is free text | **Real Supabase Auth** — email/password + confirmation, nickname, logout, Google sign-in (see above). | — already real |
| Data storage — posts/comments/votes/views | `window.storage` (artifact-only) | **Real Supabase tables**, via `lib/db.ts` and real API routes | — already real |
| Data storage — expert applications | `window.storage` | **Real Supabase table** (`expert_applications`, RLS: `auth.uid() = applicant_id`) | Admin approval UI (see below) |
| Votes / views dedup | Per-browser-session React state, lost on reload | **Real Postgres tables**, atomic via `cast_vote`/`increment_post_view` (anonymous visitors share one bucket for views; voting requires login) | — already real |
| Routing | Single-page state (`openPostId`) | Real routes: `/`, `/post/[id]`, `/login`, `/signup` | — already real |
| Verified Expert / Admin roles | Hardcoded `AUTHOR_ROLES` object keyed by typed name — anyone could self-grant | **Real `profiles.role`/`profiles.expert_type` columns**, joined directly onto each post/comment, promoted via the admin review flow | Admin accounts are still granted by a manual SQL `update profiles set role = 'admin' ...` — no UI for that (not in the handoff's scope either) |
| Expert application review | Write-only queue, no review UI | **Real admin review page** (`/admin`), RLS-gated approve/reject | — already real |
| Credential file upload | Filename only, no real storage | **Real private Supabase Storage bucket**, RLS-scoped per uploader, admin access via signed URL | — already real |
| Zip → state | Approximate 3-digit-prefix table | Same table, ported as-is (`lib/location.ts`) | A real zip database or geocoding API, if this becomes a problem in practice |

## Next steps, in priority order

1. ~~Auth~~ — **done**, including Google sign-in (see above).
2. ~~Database migration~~ — **done**. Posts/comments/votes/views are on
   real Supabase tables (see above).
3. ~~Admin review flow~~ — **done**. `/admin` lists pending expert
   applications with approve/reject (see above).
4. ~~Real file upload for credentials~~ — **done**. Real Supabase Storage
   bucket, RLS-scoped, admin access via signed URL (see above).
5. ~~Reply email notifications, profile pictures, report, block~~ — **done**
   (see above). Topic-interest digest emails are still open — need a
   "follow a topic" feature first, which doesn't exist yet.
6. ~~Photo uploads on posts~~ — **done** (see above).
7. ~~Violent-content filter~~ — **done** and live in production, verified
   against the real API (see above).
8. ~~Public author profile pages~~ — **done** (see above).
9. ~~Nickname prompt on first (Google) sign-in~~ — **done**, including a
   one-off backfill of the accounts that existed before this fix (see
   above).
10. ~~Post edit/delete, optional post body, thumbs vote icons~~ — **done**
    (see above).
11. ~~Profile tabs (posts/replies) and change-nickname~~ — **done** (see
    above).
12. ~~"View my posts & replies" link on Settings~~ — **done** (see above).
13. ~~Sidebar redesign (Nationwide/Local, Special Education &
    Homeschooling as their own categories)~~ — **done** (see above).
14. ~~Apple App Store compliance audit and fixes (report/block on author
    profiles, in-app account deletion, Terms of Use consent gate, Sign in
    with Apple), Universal Links/App Links so in-app OAuth doesn't strand
    users in Safari, and a second independent pre-submission audit pass~~
    — **done, fully end-to-end**: Apple Developer Portal (App ID, Services
    ID, Sign In with Apple key) and Supabase are both configured and
    verified working with a real Apple sign-in prompt; Xcode has the
    Development Team attached and Associated Domains capability added.
    Only two things remain, both outside what code/config can fix: a
    real-device Universal Links test (Apple's Simulator can't verify
    domain association at all), and re-running the 3.1.1 In-App Purchase
    check whenever the planned Verified Expert subscription or ads ship.
15. ~~Mobile app — Capacitor wrapper around the live production site,
    native share, camera/photo usage strings, app icon/launch screen,
    Android build verification~~ — **done**, iOS verified in Simulator and
    Android verified via a real `gradlew assembleDebug` build (see above).
    Still open: an actual Android emulator boot (blocked by this
    environment's disk space, not by anything in the app itself), and the
    actual App Store/Play Store submission.
16. ~~App Store Connect submission setup — app record, Sign in with Apple
    end-to-end, iPhone screenshots, App Information (subtitle, category,
    content rights), Age Rating questionnaire, App Review Information
    (working demo account, contact, reviewer notes), Description/
    Keywords/Support URL~~ — **done**. Along the way: restricted
    `TARGETED_DEVICE_FAMILY` to iPhone-only (was Capacitor's default
    universal iPhone+iPad, never actually decided on or tested on iPad),
    added `ITSAppUsesNonExemptEncryption = false` to Info.plist (standard
    HTTPS only, so this exempts the app from export-compliance docs on
    every build upload), and added a `/support` page (Apple requires a
    working Support URL; the site didn't have one). Still open: build
    upload (no `.ipa` attached to the version yet) and the actual "Submit
    for Review" click.
17. AI-assisted Q&A — deliberately on hold. The forum's early-stage risk
    (school/IEP/discipline topics where a wrong answer causes real harm)
    and the risk of undercutting real-parent replies before the community
    has any critical mass outweigh the payoff right now; revisit once
    there's an established base of human answers, possibly scoped to
    "AI answers only when no human has yet."
18. Everything else (a moderation action tied to a report — e.g. deleting
    the reported content directly from `/admin`) — not designed yet.
