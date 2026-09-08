export interface Promo {
  label: string;
  url: string | null;
}

export interface Post {
  id: string;
  title: string;
  body: string;
  author: string;
  topicId: string;
  state: string | null;
  promo: Promo | null;
  score: number;
  views: number;
  createdAt: number;
}

export interface Comment {
  id: string;
  postId: string;
  parentId: string | null;
  author: string;
  body: string;
  score: number;
  createdAt: number;
}

export type ExpertApplicationStatus = "pending" | "approved" | "rejected";

export interface ExpertApplication {
  id: string;
  author: string;
  expertType: string;
  credentialInfo: string;
  fileName: string;
  status: ExpertApplicationStatus;
  submittedAt: number;
  reviewedBy?: string;
  reviewedAt?: number;
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
