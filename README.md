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

## Running it

```bash
npm install
npm run dev
```

Opens on `http://localhost:3000` (or whatever port you pass with `-p`). Needs
a local `.env.local` with the real Supabase project URL and publishable key
(not committed to git — ask for the values if you don't have them).

## Auth (done)

Real Supabase Auth is live: email/password signup with email confirmation,
a nickname field (stored as `profiles.display_name`, decoupled from the
user's real name/email on purpose), login, logout. Posting, commenting, and
voting all require login and are attributed to the logged-in user's nickname
— there's no more free-text "Your name" field anywhere.

**Google sign-in is wired into the UI but disabled** (`(coming soon)` on both
the login and signup pages) — it needs a Google Cloud OAuth client (Client ID
+ Secret) that doesn't exist yet, same blocker FrameHonest's Google OAuth
hit. To finish it: create a Google Cloud project → OAuth consent screen →
OAuth Client ID (Web application) → set the authorized redirect URI to
`https://uslgoqpikanwmujcoxes.supabase.co/auth/v1/callback` → paste the
Client ID/Secret into Supabase Dashboard → Authentication → Sign In /
Providers → Google → remove the `disabled` prop on the two "Continue with
Google" buttons in `app/login/page.tsx` / `app/signup/page.tsx`.

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

## What's real vs. what's still mocked

The prototype's design, copy, taxonomy, and interaction model are final
product decisions (see `frontend/recess-forum-handoff.md` §4, §6, §8) and
were ported faithfully.

| Thing | Prototype (artifact) | This app | Real product needs |
|---|---|---|---|
| Auth | None — "Your name" is free text | **Real Supabase Auth** — email/password + confirmation, nickname, logout. Google button present but disabled (see above). | Finish Google OAuth (needs a Google Cloud project) |
| Data storage — posts/comments/votes/views | `window.storage` (artifact-only) | **Real Supabase tables**, via `lib/db.ts` and real API routes | — already real |
| Data storage — expert applications | `window.storage` | **Real Supabase table** (`expert_applications`, RLS: `auth.uid() = applicant_id`) | Admin approval UI (see below) |
| Votes / views dedup | Per-browser-session React state, lost on reload | **Real Postgres tables**, atomic via `cast_vote`/`increment_post_view` (anonymous visitors share one bucket for views; voting requires login) | — already real |
| Routing | Single-page state (`openPostId`) | Real routes: `/`, `/post/[id]`, `/login`, `/signup` | — already real |
| Verified Expert / Admin roles | Hardcoded `AUTHOR_ROLES` object keyed by typed name — anyone could self-grant | **Real `profiles.role`/`profiles.expert_type` columns**, joined directly onto each post/comment, promoted via the admin review flow | Admin accounts are still granted by a manual SQL `update profiles set role = 'admin' ...` — no UI for that (not in the handoff's scope either) |
| Expert application review | Write-only queue, no review UI | **Real admin review page** (`/admin`), RLS-gated approve/reject | — already real |
| Credential file upload | Filename only, no real storage | **Real private Supabase Storage bucket**, RLS-scoped per uploader, admin access via signed URL | — already real |
| Zip → state | Approximate 3-digit-prefix table | Same table, ported as-is (`lib/location.ts`) | A real zip database or geocoding API, if this becomes a problem in practice |

## Next steps, in priority order

1. ~~Auth~~ — **done**. Google OAuth specifically still needs a Google Cloud
   project (see above).
2. ~~Database migration~~ — **done**. Posts/comments/votes/views are on
   real Supabase tables (see above).
3. ~~Admin review flow~~ — **done**. `/admin` lists pending expert
   applications with approve/reject (see above).
4. ~~Real file upload for credentials~~ — **done**. Real Supabase Storage
   bucket, RLS-scoped, admin access via signed URL (see above).
5. Everything else (moderation tools, reporting, notifications) — not
   designed yet, per the handoff.
