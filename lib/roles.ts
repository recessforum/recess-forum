import type { Comment, Post, Role, Tier } from "./types";

export function karmaFor(author: string, posts: Post[], comments: Record<string, Comment[]>): number {
  let total = 0;
  posts.forEach((p) => { if (p.author === author) total += p.score; });
  Object.values(comments).flat().forEach((c) => { if (c.author === author) total += c.score; });
  return total;
}

/* ---------------------------------------------------------------------- */
/*  Membership tiers — earned automatically from activity.                */
/*  Both thresholds required (AND, not OR) — see handoff §6.              */
/* ---------------------------------------------------------------------- */
export const TIERS: (Tier & { icon: "crown" | "star" | "sprout" | "rocket"; text: string; bg: string })[] = [
  { id: "elite", label: "Elite", posts: 50, comments: 100, icon: "crown", text: "#A8791E", bg: "#F6EFDD" },
  { id: "senior", label: "Senior", posts: 20, comments: 80, icon: "star", text: "#5C5AA0", bg: "#ECEBF6" },
  { id: "junior", label: "Junior", posts: 10, comments: 50, icon: "sprout", text: "#3F7A52", bg: "#E9F2EC" },
  { id: "rising", label: "Rising", posts: 2, comments: 10, icon: "rocket", text: "#3B5BA5", bg: "#E9EEF7" },
];

export function countsFor(author: string, posts: Post[], comments: Record<string, Comment[]>) {
  const postCount = posts.filter((p) => p.author === author).length;
  const commentCount = Object.values(comments).flat().filter((c) => c.author === author).length;
  return { postCount, commentCount };
}

export function tierFor(author: string, posts: Post[], comments: Record<string, Comment[]>) {
  const { postCount, commentCount } = countsFor(author, posts, comments);
  return TIERS.find((t) => postCount >= t.posts && commentCount >= t.comments) || null;
}

/* Credential badges — separate from activity tier, granted by the site
   (Administrator) or via a separate verification application (Verified
   Expert). Unlike the prototype's AUTHOR_ROLES (a hardcoded object anyone
   could grant themselves by typing a name), this now reads the real
   `profiles.role`/`expert_type` columns from Supabase — see handoff §10
   item 4. `rolesByAuthor` is keyed by display_name (unique in `profiles`)
   because posts/comments are still stored by author name, not userId, in
   the file-backed dev store (handoff §10 item 2). */
export type RolesByAuthor = Record<string, { role: "verified_expert" | "admin"; expertType: string | null }>;

export const EXPERT_TYPES = [
  "Certified Teacher", "School Counselor / College Admissions Counselor", "School Psychologist",
  "Clinical Psychologist", "Educational / Neuropsychologist", "Psychiatrist",
  "Psychiatric Nurse Practitioner (PMHNP)", "Pediatric Neurologist",
  "Board Certified Behavior Analyst (BCBA)", "ADHD / Executive Function Coach",
  "Occupational Therapist", "Speech-Language Pathologist", "Physical Therapist", "ABA Therapist",
  "Education Law Attorney", "Special Education Law Attorney", "School District Administrator",
  "Education Consultant", "ESL / Bilingual Education Specialist", "School Social Worker",
  "Developmental Pediatrician", "Financial Aid Advisor", "Homeschool Curriculum Specialist",
  "Gifted Education Specialist",
];

export function roleFor(author: string, rolesByAuthor: RolesByAuthor): Role | null {
  const entry = rolesByAuthor[author];
  if (!entry) return null;
  if (entry.role === "admin") return { role: "admin" };
  return { role: "verified_expert", expertType: entry.expertType || "" };
}
