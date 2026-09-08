export interface Promo {
  label: string;
  url: string | null;
}

export type ProfileRole = "member" | "verified_expert" | "admin";

export interface Post {
  id: string;
  title: string;
  body: string;
  author: string; // profiles.display_name, joined at read time
  authorId: string;
  authorRole: ProfileRole;
  authorExpertType: string | null;
  topicId: string;
  state: string | null;
  promo: Promo | null;
  score: number;
  views: number;
  createdAt: number;
  circleId: string | null;
  circleName: string | null;
}

export interface Circle {
  id: string;
  name: string;
  description: string;
  state: string | null;
  createdBy: string;
  memberCount: number;
  createdAt: number;
}

export interface Comment {
  id: string;
  postId: string;
  parentId: string | null;
  author: string;
  authorId: string;
  authorRole: ProfileRole;
  authorExpertType: string | null;
  body: string;
  score: number;
  createdAt: number;
}

export type ExpertApplicationStatus = "pending" | "approved" | "rejected";

export interface ExpertApplication {
  id: string;
  applicantId: string;
  expertType: string;
  credentialInfo: string;
  filePath: string | null;
  status: ExpertApplicationStatus;
  submittedAt: number;
  reviewedBy: string | null;
  reviewedAt: number | null;
}

export type Role =
  | { role: "admin" }
  | { role: "verified_expert"; expertType: string };

export interface Tier {
  id: string;
  label: string;
  posts: number;
  comments: number;
}
