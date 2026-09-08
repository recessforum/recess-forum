import type { Comment, Post, ProfileRole, Role, Tier } from "./types";

export function karmaFor(authorId: string, posts: Post[], comments: Record<string, Comment[]>): number {
  let total = 0;
  posts.forEach((p) => { if (p.authorId === authorId) total += p.score; });
  Object.values(comments).flat().forEach((c) => { if (c.authorId === authorId) total += c.score; });
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

export function countsFor(authorId: string, posts: Post[], comments: Record<string, Comment[]>) {
  const postCount = posts.filter((p) => p.authorId === authorId).length;
  const commentCount = Object.values(comments).flat().filter((c) => c.authorId === authorId).length;
  return { postCount, commentCount };
}

export function tierFor(authorId: string, posts: Post[], comments: Record<string, Comment[]>) {
  const { postCount, commentCount } = countsFor(authorId, posts, comments);
  return TIERS.find((t) => postCount >= t.posts && commentCount >= t.comments) || null;
}

/* Credential badges — separate from activity tier, granted by the site
   (Administrator) or via a separate verification application (Verified
   Expert). Read straight from the real `profiles.role`/`expert_type`
   columns joined onto each post/comment at fetch time (see handoff §10
   item 4) — promotion is still a manual `update profiles set role = ...`
   until the admin review UI exists. */
export function roleFor(role: ProfileRole, expertType: string | null): Role | null {
  if (role === "admin") return { role: "admin" };
  if (role === "verified_expert") return { role: "verified_expert", expertType: expertType || "" };
  return null;
}

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
