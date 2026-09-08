# Recess Forum — Handoff to Claude Code

**Status**: Working React prototype (single-file artifact, no real backend). Ready to be rebuilt as a real product.
**Prototype file**: `recess-forum.jsx` (also delivered alongside this doc)
**Brand assets**: `recess-logo-horizontal.svg`, `recess-logo-icon.svg`

---

## 1. What this is

A Reddit-style discussion forum for parents navigating their kids' education — **deliberately not split by school type** (homeschool, public, private, etc. all coexist), organized instead by topic categories that cut across school type, grade level, and subject. Named "Recess" because it's meant to be the break/social space parallel to the "work" of school.

---

## 2. What's real vs. what's mocked in the prototype

**This is a functional UI prototype, not a production app.** Everything works in the browser, but:

| Thing | Prototype reality | What production needs |
|---|---|---|
| Data storage | `window.storage` key-value API (artifact-only, not a real DB) | Real database (Postgres recommended) |
| Auth | **None.** "Your name" is a free-text field, no accounts | Real auth (NextAuth/Clerk/Supabase Auth) |
| Verified Expert / Admin roles | Hardcoded lookup table (`AUTHOR_ROLES`) keyed by typed name — **anyone can grant themselves any role by typing that name** | Roles must be tied to authenticated user IDs, not display names |
| Credential file upload | Captures filename only, no actual file storage | Real file storage (S3/R2) + admin review queue |
| Zip → State mapping | Approximate, hardcoded 3-digit prefix ranges (`ZIP3_RANGES`) — wrong at boundaries | Real zip database or geocoding API |
| Expert applications | Saved to storage but **no review/approval UI exists** | Admin panel to approve → promote to `AUTHOR_ROLES` equivalent |
| Voting | Per-browser-session only (`postVoteDirs` state), not persisted per user | Tie votes to authenticated user ID, one vote per user per post/comment |
| View counts | Increments once per browser session via a `Set` in memory | Should be server-side, deduped by user/IP |

**Bottom line**: treat this file as a very detailed, working spec for UI/UX and data model — not as code to deploy as-is. The interaction design, copy, taxonomy, and visual system are final; the persistence/auth layer is not.

---

## 3. Data model (as currently shaped in the prototype)

```
Post {
  id, title, body, author (string, not a user ID),
  topicId, state (2-letter code or null),
  promo: { label, url } | null,   // Verified Expert business mention
  score (net vote count), views (int),
  createdAt (timestamp)
}

Comment {
  id, postId, parentId (null for top-level, else comment.id — enables nesting),
  author, body, score, createdAt
}

ExpertApplication {
  id, author, expertType, credentialInfo, fileName, status: "pending", submittedAt
}
```

Storage keys used (prototype only): `recess:posts`, `recess:comments:{postId}`, `recess:expertApplications` — all `shared: true`.

**Recommendation for real schema**: add a proper `users` table, foreign-key `author` → `userId` everywhere, add a `votes` table (userId, targetId, targetType, direction) instead of client-side vote-direction state, and an `expert_applications` table with a real `reviewedBy`/`reviewedAt`/`status` workflow.

---

## 4. Topic taxonomy (finalized — this is real product decisions, not placeholder)

9 categories, ~40 topics total. Full list and blurbs are in `CATEGORIES` at the top of the file. Categories:

1. **School Types** — Public, Private, Charter, Homeschool, Online/Virtual
2. **Grade & Age Stages** — Early Childhood/Pre-K through High School
3. **College Prep & Admissions** — promoted to its own top-level category (was under Grade Stages, elevated per business priority): Applications & Essays, SAT/ACT, College Research, Extracurricular Strategy, Early Decision/Action, College Financial Aid
4. **Academics & Curriculum** — Curriculum, Reading, Math, STEM, Standardized Testing
5. **Support Needs** — Special Ed/IEPs, Learning Differences, Gifted, ELL
6. **Enrichment** — Tutoring, Extracurriculars, Arts/Music, Summer Programs
7. **Wellbeing & Social** — Mental Health, Bullying, Screen Time, Motivation
8. **Fun & Family Time** — Weekend Activities, Hobbies, Games, Birthdays, Books/Media, Traditions, Travel, Screen-Free Fun (added deliberately to balance the academic-heavy categories and lower the barrier to casual participation)
9. **Logistics & Parent Life** — School Choice, Financial Aid, Teacher Communication, General Parenting

Each category has a dedicated color (`CATEGORY_COLORS`) used consistently across badges, sidebar, and banners.

---

## 5. Reddit-style mechanics implemented

- **Net upvote/downvote** (not upvote-only), toggle-to-undo behavior
- **Hot / New / Top sorting.** Hot ranking formula (`hotScore()`): `sign(score) × log10(|score|) + 0.4 × log10(views+1) − ageHours/12` — votes weighted highest, views as a secondary signal, standard time-decay
- **Nested/threaded comments**, arbitrary depth (visually capped at depth 5), sorted Best/New
- **Karma** — sum of vote scores across a user's posts + comments, computed live from `posts`/`comments` state (`karmaFor()`)

---

## 6. Membership tiers & credential badges (business logic — confirmed with stakeholder)

Two **separate** systems, both can show on the same user simultaneously:

**Activity tiers (auto-computed from post/comment counts, both thresholds required — AND, not OR):**
| Tier | Requirement | Icon/color |
|---|---|---|
| Rising | 2+ posts AND 10+ comments | Rocket, blue |
| Junior | 10+ posts AND 50+ comments | Sprout, green |
| Senior | 20+ posts AND 80+ comments | Star, purple |
| Elite | 50+ posts AND 100+ comments | Crown, gold |

Logic: `tierFor()` — checks highest tier first, returns first match.

**Credential badges (manually granted, not activity-based):**
- **Administrator** — shield icon, red
- **Verified Expert** — badge-check icon, teal, hover shows their specific expertise (e.g. "Special Education Law Attorney")

Full list of expert categories in `EXPERT_TYPES` (19 types) — includes teachers, school psychologists, clinical psychologists, psychiatrists, PMHNPs, pediatric neurologists, BCBAs, ADHD/EF coaches, OTs/SLPs/PTs, education attorneys, district admins, ESL specialists, social workers, developmental pediatricians, financial aid advisors, homeschool consultants, gifted ed specialists. This list was deliberately weighted toward ADHD/autism-adjacent professionals per stakeholder priority.

**Verified Expert perk**: when posting, if the entered author name matches a Verified Expert in `AUTHOR_ROLES`, an optional "business mention" field appears — one line (70 char max) + optional URL, rendered as a small teal tag, never a full ad unit. This is the first (and currently only) monetization-adjacent feature; **everything else is intentionally free** per stakeholder decision — no paid tiers exist yet, and none should be added without explicit sign-off (see §8).

---

## 7. Location feature

- **State is required** on every post; zip code is optional and only used client-side to auto-fill the state dropdown (`zipToState()`, approximate 3-digit-prefix table)
- **Raw zip is never stored** — only the derived 2-letter state code — this was a deliberate privacy decision (a public forum should not expose a parent's precise location)
- Search/feed has a state filter (full 50-state + DC dropdown, `US_STATES`)

---

## 8. Explicit product/business decisions already made (don't relitigate these without cause)

- **No school-type segmentation** — one unified forum, topic tags do the differentiation
- **State field mandatory, zip optional-and-privacy-scrubbed**
- **Everything is free at launch.** No paid tiers. A monetization roadmap was discussed (Verified Expert Pro subscriptions, sponsored resources, affiliate links, freemium parent membership, contextual ads *never* on Support Needs/Wellbeing categories, aggregated B2B data insights *last*, no NFT/Web3-style experiments) but **nothing beyond the free Verified Expert business-mention perk should ship** until the community has real activity/retention numbers.
- **No targeted ads or data sales on sensitive categories** (Special Ed, Mental Health, Bullying) — ever, even post-monetization. This is a trust/ethics line, not just a growth-stage decision.
- **Verified Expert review is manual** — the application form is intentionally minimal (name, expertise dropdown, one credential field, optional file) to keep friction low; approval happens on the backend, not automated.

---

## 9. Design system

- **Palette**: warm off-white bg `#F7F6F3`, ink `#1C1B19`, muted text `#9A968A`/`#5B584F`, hairline borders `#E6E3DA`, primary accent navy `#26364A`, vote-active gold `#B08D45`
- **Category colors**: see `CATEGORY_COLORS` — muted, one hue per category, used as `{ text, bg, solid }` triples
- **Typography**: Inter only, weight/size for hierarchy, no serif — deliberately plain over "elegant" per stakeholder direction (rejected an earlier notebook/chalkboard aesthetic)
- **Layout philosophy**: hairline-divider list feed, not boxed-shadow cards. No badge/box overload except category color coding, which was explicitly requested back in after an initial monochrome pass felt too flat
- **Logo**: bell icon (recess bell motif), navy `#26364A` body, gold `#B08D45` clapper — see the two SVG files

### ⚠️ Known rendering gotcha — read before porting styles
Tailwind arbitrary-value classes combining a hex color *with* an opacity modifier (e.g. `bg-[#1C1B19]/50`) **silently failed to render** in the artifact preview environment — modals appeared fully transparent with background content bleeding through. Fixed by switching those specific declarations to inline `style={{ backgroundColor: "rgba(...)" }}`. This may be an artifact-sandbox-specific quirk rather than a real Tailwind/Next.js issue — **verify early in the Claude Code environment whether `bg-[#hex]/NN` works normally there** before assuming you need to keep the inline-style workaround everywhere.

---

## 10. Priority build order for Claude Code

1. **Auth** — this unblocks everything else (real roles, real votes, real karma, tying zip/state to a profile instead of re-entering per post)
2. **Real database + API layer** replacing `window.storage` — schema is basically what's in §3, just needs real relations
3. **Admin review flow for Expert Applications** — currently a write-only queue with no UI to approve
4. **Migrate `AUTHOR_ROLES` from hardcoded object to a real `role` column tied to `userId`**
5. **File upload for credentials** (S3/R2 + basic virus/type validation)
6. **Server-side vote dedup and view-count dedup**
7. Everything else (moderation tools, reporting, notifications) — not designed yet, will need fresh product discussion

---

## 11. Marketing context (for reference, not a build task)

Launch channel strategy already decided: **Reddit (value-first, no self-promo until karma earned), Threads (light/shareable content, the Fun & Family Time category was added partly to give Threads-friendly content a home), Facebook parent support groups (admin outreach required, group rules vary)**. Full 4-week sequencing and sample copy exist earlier in this conversation if needed for a marketing-ops handoff — not relevant to the Claude Code engineering work.
