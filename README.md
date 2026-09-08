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
  TypeScript, Tailwind v4, Supabase Auth). This is what you run.
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

## What's real vs. what's still mocked

The prototype's design, copy, taxonomy, and interaction model are final
product decisions (see `frontend/recess-forum-handoff.md` §4, §6, §8) and
were ported faithfully.

| Thing | Prototype (artifact) | This app | Real product needs |
|---|---|---|---|
| Auth | None — "Your name" is free text | **Real Supabase Auth** — email/password + confirmation, nickname, logout. Google button present but disabled (see above). | Finish Google OAuth (needs a Google Cloud project) |
| Data storage — posts/comments/votes/views | `window.storage` (artifact-only) | JSON file at `.data/db.json`, via `lib/db.ts` and real API routes | Migrate to `schema.sql`'s `posts`/`comments`/`votes`/`post_views` tables |
| Data storage — expert applications | `window.storage` | **Real Supabase table** (`expert_applications`, RLS: `auth.uid() = applicant_id`) | Admin approval UI (see below) |
| Votes / views dedup | Per-browser-session React state, lost on reload | Persisted server-side, deduped by the **real authenticated `userId`** (anonymous visitors share one bucket for views; voting requires login) | Just needs the storage migration above — dedup logic is already real |
| Routing | Single-page state (`openPostId`) | Real routes: `/`, `/post/[id]`, `/login`, `/signup` | — already real |
| Verified Expert / Admin roles | Hardcoded `AUTHOR_ROLES` object keyed by typed name — anyone could self-grant | **Real `profiles.role`/`profiles.expert_type` columns**, looked up by author name (`lib/roles.ts`'s `roleFor`) since posts/comments are still name-keyed in the file store | Promotion is still a manual SQL `update profiles set role = ...` — no admin UI yet (item 3 below) |
| Credential file upload | Filename only, no real storage | Same — filename only | Real object storage (S3/R2) + the `file_path` column (already on `expert_applications`) |
| Zip → state | Approximate 3-digit-prefix table | Same table, ported as-is (`lib/location.ts`) | A real zip database or geocoding API, if this becomes a problem in practice |

## Next steps, in priority order

1. ~~Auth~~ — **done**. Google OAuth specifically still needs a Google Cloud
   project (see above).
2. **Migrate `lib/db.ts` off the JSON file** onto `schema.sql`'s
   `posts`/`comments`/`votes`/`post_views` tables. The function signatures in
   that file (`createPost`, `addComment`, `vote`, `registerView`,
   `getVoteDirs`) were written to make this swap mechanical — same shapes,
   different bodies, calling Supabase instead of reading/writing JSON.
   Once posts/comments carry a real `author_id`, `lib/roles.ts`'s
   name-keyed `rolesByAuthor` lookup can also go away in favor of a direct
   join.
3. **Admin review flow** for expert applications — a page (gated to
   `profiles.role = 'admin'`) listing `expert_applications` where
   `status = 'pending'`, with approve/reject buttons that update `status`,
   `reviewed_by`, `reviewed_at`, and (on approve) `profiles.role` /
   `profiles.expert_type` for the applicant.
4. Real file upload for credentials (S3/R2 or Supabase Storage), writing to
   `expert_applications.file_path`.
5. Everything else (moderation tools, reporting, notifications) — not
   designed yet, per the handoff.
